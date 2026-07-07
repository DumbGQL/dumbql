import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { type GraphqlDebugEntry } from '../graphql-debug.service';
import { GraphqlDebugService } from '../graphql-debug.service';

export type DevToolsTab = 'queries' | 'cache' | 'errors';

export interface CacheSnapshot {
  typename: string;
  id: string;
  fields: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class DevToolsService {
  private readonly debugSvc = inject(GraphqlDebugService);

  readonly visible = new BehaviorSubject(false);
  readonly activeTab = new BehaviorSubject<DevToolsTab>('queries');
  readonly cacheSnapshot = new BehaviorSubject<CacheSnapshot[]>([]);

  visible$: Observable<boolean> = this.visible.asObservable();
  activeTab$: Observable<DevToolsTab> = this.activeTab.asObservable();
  cacheSnapshot$: Observable<CacheSnapshot[]> = this.cacheSnapshot.asObservable();

  get cacheSnapshotValue(): CacheSnapshot[] {
    return this.cacheSnapshot.value;
  }

  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

  init(): void {
    if (typeof document === 'undefined' || this.keyboardHandler) return;

    this.keyboardHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        this.toggle();
      }
    };
    document.addEventListener('keydown', this.keyboardHandler);
  }

  destroy(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  toggle(): void {
    this.visible.next(!this.visible.value);
    if (this.visible.value) {
      this.snapshotCache();
    }
  }

  open(): void {
    this.visible.next(true);
    this.snapshotCache();
  }

  close(): void {
    this.visible.next(false);
  }

  setTab(tab: DevToolsTab): void {
    this.activeTab.next(tab);
    if (tab === 'cache') {
      this.snapshotCache();
    }
  }

  get entries(): GraphqlDebugEntry[] {
    return this.debugSvc.entries;
  }

  private snapshotCache(): void {
    try {
      const svc = this.debugSvc as unknown as {
        svc: { injector: { get: <T>(token: unknown, opts?: { optional?: boolean }) => T | null } };
      };
      const injector = svc?.svc?.injector;
      if (!injector) return;

      import('@dumbql/cache/angular')
        .then(({ CacheService }) => {
          // eslint-disable-next-line max-len
          const cache = injector.get<{ cache?: { all: () => Map<string, unknown> } } | null>(CacheService, {
            optional: true,
          });
          if (!cache?.cache) return;

          const snapshot: CacheSnapshot[] = [];
          const allEntries = cache.cache.all();
          for (const [key, value] of allEntries) {
            const entity = value as Record<string, unknown> & { __typename?: string; id?: string };
            snapshot.push({
              typename: entity.__typename ?? '(unknown)',
              id: entity.id ?? key,
              fields: entity,
            });
          }
          this.cacheSnapshot.next(snapshot);
        })
        .catch(() => undefined);
    } catch {
      // cache service may not be available
    }
  }

  getQueryCount(): number {
    return this.debugSvc.entries.length;
  }

  getErrorCount(): number {
    return this.debugSvc.entries.filter((e) => e.result.status === 'error').length;
  }
}
