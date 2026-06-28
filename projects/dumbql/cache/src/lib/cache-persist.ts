import { Injectable, inject, InjectionToken, type Provider, ENVIRONMENT_INITIALIZER } from '@angular/core';

export interface CachePersistConfig {
  storageKey?: string;
  throttle?: number;
  /** Schema version — bumping it invalidates all stored cache on next load. */
  version?: string;
  /** Max age in ms for persisted data. Older data is discarded on restore. */
  maxAge?: number;
  /** Preferred storage type. Defaults to localStorage with memory fallback. */
  storage?: 'localStorage' | 'memory';
}

export const CACHE_PERSIST_CONFIG = new InjectionToken<CachePersistConfig>('CACHE_PERSIST_CONFIG');

// ─── Storage abstraction ────────────────────────────────────────────────────

interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createStorage(config: CachePersistConfig): StorageBackend {
  if (config.storage === 'memory') {
    return new InMemoryStorage();
  }
  try {
    const testKey = '__dumbql_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    return new InMemoryStorage();
  }
}

class InMemoryStorage implements StorageBackend {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

// ─── Serialization ──────────────────────────────────────────────────────────

interface PersistedPayload {
  version?: string;
  timestamp: number;
  data: [string, Record<string, unknown>][];
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class CachePersistenceService {
  private key: string;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private storage: StorageBackend;
  private version?: string;
  private maxAge?: number;

  constructor() {
    const config = inject(CACHE_PERSIST_CONFIG, { optional: true }) ?? {};
    this.key = config.storageKey ?? '__dumbql_cache';
    this.storage = createStorage(config);
    this.version = config.version;
    this.maxAge = config.maxAge;
  }

  persist(data: [string, Record<string, unknown>][]): void {
    const payload: PersistedPayload = {
      version: this.version,
      timestamp: Date.now(),
      data,
    };
    try {
      this.storage.setItem(this.key, JSON.stringify(payload));
    } catch {
      // storage full or unavailable
    }
  }

  persistThrottled(data: [string, Record<string, unknown>][], delay = 1000): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.persist(data);
      this.timer = null;
    }, delay);
  }

  /** Returns full persisted data, or null if missing/expired/version-mismatch. */
  restore(): [string, Record<string, unknown>][] | null {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;

      const payload: PersistedPayload = JSON.parse(raw);

      if (this.version !== undefined && payload.version !== this.version) {
        this.storage.removeItem(this.key);
        return null;
      }

      if (this.maxAge && Date.now() - payload.timestamp > this.maxAge) {
        this.storage.removeItem(this.key);
        return null;
      }

      return payload.data;
    } catch {
      this.storage.removeItem(this.key);
      return null;
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      // ignore
    }
  }
}

export function provideCachePersistence(config?: CachePersistConfig): Provider[] {
  return [
    ...(config ? [{ provide: CACHE_PERSIST_CONFIG, useValue: config }] : []),
    CachePersistenceService,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => inject(CachePersistenceService),
    },
  ];
}
