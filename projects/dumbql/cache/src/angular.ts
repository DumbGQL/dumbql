// Angular wrappers for @dumbql/cache
// Import from '@dumbql/cache/angular' in Angular projects
export { CacheService, provideCacheService } from './lib/cache.service';
export { CachePersistenceService, NG_CACHE_PERSIST_CONFIG, provideCachePersistence } from './lib/cache-persist-ng';
export { injectFragment } from './lib/fragment';
export { GRAPHQL_CACHE, type GraphqlCacheLike } from './lib/tokens';
