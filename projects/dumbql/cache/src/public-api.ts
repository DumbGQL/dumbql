// Framework-agnostic core (zero dependencies — no Angular needed)
export { NormalizedCache, type CacheEntity, type OptimisticUpdate, type TypePolicy } from './lib/normalized-cache';
export { CacheStore, createCache, type CacheStoreConfig } from './lib/cache-store';
export { CacheGc } from './lib/cache-gc';
export {
  CachePersistence,
  CACHE_PERSIST_CONFIG,
  type CachePersistConfig,
} from './lib/cache-persist';

// For Angular wrappers import from '@dumbql/cache/angular'
