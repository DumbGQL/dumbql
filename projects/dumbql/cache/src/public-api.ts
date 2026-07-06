// Framework-agnostic core (zero dependencies — no Angular needed)
export { NormalizedCache, type CacheEntity, type OptimisticUpdate, type TypePolicy } from './lib/normalized-cache';
export { CacheStore, createCache, type CacheStoreConfig } from './lib/cache-store';
export { CacheGc } from './lib/cache-gc';
export {
  CachePersistence,
  CACHE_PERSIST_CONFIG,
  type CachePersistConfig,
} from './lib/cache-persist';
export { CacheEvents, type CacheEvent, type CacheEventListener } from './lib/cache-events';
export { CacheMetrics, type CacheMetricsSnapshot } from './lib/cache-metrics';

// For Angular wrappers import from '@dumbql/cache/angular'
