import { Injectable, InjectionToken, type Provider, ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { CachePersistence, type CachePersistConfig } from './cache-persist';

export type { CachePersistConfig };

export const NG_CACHE_PERSIST_CONFIG = new InjectionToken<CachePersistConfig>('NG_CACHE_PERSIST_CONFIG');

@Injectable()
export class CachePersistenceService {
  private inner: CachePersistence;

  constructor() {
    const config = inject(NG_CACHE_PERSIST_CONFIG, { optional: true }) ?? {};
    this.inner = new CachePersistence(config);
  }

  persist(data: [string, Record<string, unknown>][]): void {
    this.inner.persist(data);
  }

  persistThrottled(data: [string, Record<string, unknown>][], delay?: number): void {
    this.inner.persistThrottled(data, delay);
  }

  restore(): [string, Record<string, unknown>][] | null {
    return this.inner.restore();
  }

  clear(): void {
    this.inner.clear();
  }
}

export function provideCachePersistence(config?: CachePersistConfig): Provider[] {
  return [
    ...(config ? [{ provide: NG_CACHE_PERSIST_CONFIG, useValue: config }] : []),
    CachePersistenceService,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => inject(CachePersistenceService),
    },
  ];
}
