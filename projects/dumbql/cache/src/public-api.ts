export { NormalizedCache, type CacheEntity, type OptimisticUpdate } from './lib/normalized-cache';
export { CacheService } from './lib/cache.service';
export { CacheGc } from './lib/cache-gc';
export {
	CachePersistenceService,
	provideCachePersistence,
	CACHE_PERSIST_CONFIG,
	type CachePersistConfig,
} from './lib/cache-persist';
