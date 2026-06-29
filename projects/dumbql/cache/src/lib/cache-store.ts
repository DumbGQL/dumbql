import { NormalizedCache, type CacheEntity, type OptimisticUpdate, type TypePolicy } from './normalized-cache';
import { CacheGc } from './cache-gc';
import { CachePersistence, type CachePersistConfig } from './cache-persist';

export interface CacheStoreConfig {
  persist?: CachePersistence | CachePersistConfig;
  typePolicies?: Record<string, TypePolicy>;
}

export class CacheStore {
  readonly cache: NormalizedCache;
  readonly gc: CacheGc;
  private localState = new Map<string, unknown>();
  private localStateListeners = new Map<string, Set<() => void>>();
  private localStateTypes = new Map<string, Set<string>>();
  private persistSvc: CachePersistence | null = null;

  constructor(config?: CacheStoreConfig) {
    this.cache = new NormalizedCache(config?.typePolicies);
    this.gc = new CacheGc(this.cache);
    if (config?.persist) {
      const svc = config.persist instanceof CachePersistence
        ? config.persist
        : new CachePersistence(config.persist);
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
    return this.localState.get(key);
  }

  watchLocal(key: string, listener: () => void): () => void {
    const existing = this.localStateListeners.get(key);
    if (existing) {
      existing.add(listener);
    } else {
      this.localStateListeners.set(key, new Set([listener]));
    }
    return () => {
      this.localStateListeners.get(key)?.delete(listener);
    };
  }

  writeLocal<T>(key: string, value: T): void {
    this.localState.set(key, value);
    const listeners = this.localStateListeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener();
      }
    }
  }

  clearLocalState(): void {
    this.localState.clear();
    this.localStateListeners.clear();
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
      localState: Array.from(this.localState.entries()),
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

  setTypePolicies(policies: Record<string, TypePolicy>): void {
    this.cache.setTypePolicies(policies);
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
    for (const [key, value] of this.localState) {
      data.push([`__local__${key}`, { value }]);
    }
    this.persistSvc.persist(data);
  }
}

export function createCache(config?: CacheStoreConfig): CacheStore {
  return new CacheStore(config);
}
