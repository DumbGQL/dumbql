// Core cache logic (zero Angular deps, framework-agnostic)
export { NormalizedCache, type CacheEntity, type OptimisticUpdate, type TypePolicy } from './lib/normalized-cache';
export { CacheStore, createCache, type CacheStoreConfig } from './lib/cache-store';
export { CacheGc } from './lib/cache-gc';
export { CachePersistence, CACHE_PERSIST_CONFIG, type CachePersistConfig } from './lib/cache-persist';
export { CacheEvents, type CacheEvent, type CacheEventListener } from './lib/cache-events';
export { CacheMetrics, type CacheMetricsSnapshot } from './lib/cache-metrics';

// Angular integration helpers (requires @angular/core at runtime)
export { GRAPHQL_CACHE, type GraphqlCacheLike } from './lib/tokens';

// For further Angular wrappers import from '@dumbql/cache/angular'
