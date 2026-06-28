import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { NormalizedCache, type CacheEntity, type OptimisticUpdate } from './normalized-cache';
import { CacheGc } from './cache-gc';
import { CachePersistenceService } from './cache-persist';

export interface LocalStateEntry<T = unknown> {
  key: string;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  readonly cache = new NormalizedCache();
  readonly gc = new CacheGc(this.cache);
  private localState = new Map<string, BehaviorSubject<unknown>>();
  /** Tracks which typenames each local state entry references, for selective mutation invalidation. */
  private localStateTypes = new Map<string, Set<string>>();
  private persistSvc: CachePersistenceService | null = null;

  constructor() {
    try {
      const svc = inject(CachePersistenceService, { optional: true });
      if (svc) {
        this.persistSvc = svc;
        const restored = svc.restore();
        if (restored) {
          for (const [key, value] of restored) {
            if (key.startsWith('__local__')) {
              this.writeLocal(key.slice(9), value);
            } else {
              this.cache.set(value as CacheEntity);
            }
          }
        }
      }
    } catch {
      // persist service not configured
    }
  }

  query(typename: string, id: string): CacheEntity | undefined {
  	return this.cache.get(typename, id);
  }

  write(entity: CacheEntity): void {
  	this.cache.set(entity);
  }

  merge(entity: Partial<CacheEntity> & { __typename: string; id: string }): void {
  	this.cache.merge(entity);
  }

  evict(typename: string, id: string): void {
  	this.cache.remove(typename, id);
  }

  applyOptimistic(update: OptimisticUpdate): void {
  	this.cache.applyOptimistic(update);
  }

  rollbackOptimistic(id: string): void {
  	this.cache.rollbackOptimistic(id);
  }

  commitOptimistic(id: string): void {
  	this.cache.commitOptimistic(id);
  }

  readLocal(key: string): unknown {
  	return this.localState.get(key)?.value;
  }

  watchLocal(key: string): Observable<unknown> {
  	const existing = this.localState.get(key);
  	if (existing) {
  		return existing.asObservable();
  	}
  	const subj = new BehaviorSubject<unknown>(undefined);
  	this.localState.set(key, subj);
  	return subj.asObservable();
  }

  writeLocal<T>(key: string, value: T): void {
  	const existing = this.localState.get(key);
  	if (existing) {
  		existing.next(value);
  	} else {
  		this.localState.set(key, new BehaviorSubject<unknown>(value));
  	}
  }

  clearLocalState(): void {
  	this.localState.clear();
  	this.localStateTypes.clear();
  }

  writeLocalWithTypes<T>(key: string, value: T, types: Set<string>): void {
  	this.localStateTypes.set(key, types);
  	this.writeLocal(key, value);
  }

  clearLocalStateByTypes(types: string[]): void {
  	if (types.length === 0) return;
  	const typeSet = new Set(types);
  	const toDelete: string[] = [];
  	for (const [key, tracked] of this.localStateTypes) {
  		for (const t of tracked) {
  			if (typeSet.has(t)) {
  				toDelete.push(key);
  				break;
  			}
  		}
  	}
  	for (const key of toDelete) {
  		this.localState.delete(key);
  		this.localStateTypes.delete(key);
  	}
  }

  serialize(): string {
  	return JSON.stringify({
  		entities: Array.from(this.cache.all().entries()),
  		localState: Array.from(this.localState.entries()).map(([k, v]) => [k, v.value]),
  	});
  }

  deserialize(json: string): void {
  	const data = JSON.parse(json);
  	for (const [, entity] of data.entities) {
  		this.cache.set(entity);
  	}
  	for (const [key, value] of data.localState) {
  		this.writeLocal(key, value);
  	}
  }

  collectGarbage(): number {
  	return this.gc.sweep();
  }

  persist(): void {
    if (!this.persistSvc) return;
    const data: [string, Record<string, unknown>][] = [];
    for (const [k, v] of this.cache.all()) {
      data.push([k, v as unknown as Record<string, unknown>]);
    }
    for (const [k, v] of this.localState) {
      data.push([`__local__${k}`, { value: v.value }]);
    }
    this.persistSvc.persist(data);
  }
}
