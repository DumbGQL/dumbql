import type { GraphQLResult } from './result';
import type { GraphqlMiddleware } from './middleware';
import type { CacheStore, TypePolicy } from '@dumbql/cache';
import type { CacheConfig } from './config';

interface EntityRef {
  __typename: string;
  id: string;
  [key: string]: unknown;
}

function extractEntities(data: unknown, entities: EntityRef[]): void {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) {
    for (const item of data) extractEntities(item, entities);
    return;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj['__typename'] === 'string' && (typeof obj['id'] === 'string' || typeof obj['id'] === 'number')) {
    entities.push(obj as EntityRef);
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') extractEntities(v, entities);
  }
}

function extractTypeNames(data: unknown, types: Set<string>): void {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data)) {
    for (const item of data) extractTypeNames(item, types);
    return;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj['__typename'] === 'string') {
    types.add(obj['__typename'] as string);
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') extractTypeNames(v, types);
  }
}

export function cacheMiddleware(cache: CacheStore, config?: CacheConfig): GraphqlMiddleware {
  // Wire typePolicies if provided
  if (config?.typePolicies) {
    cache.setTypePolicies(config.typePolicies as Record<string, TypePolicy>);
  }

  const fetchTimestamps = new Map<string, number>();
  const maxAge = config?.maxAge ?? 0;
  const staleTime = maxAge > 0 ? Math.floor(maxAge / 2) : 0;

  return async (request, next) => {
    const storeResult = (result: GraphQLResult<unknown>, queryHash: string): void => {
      if (result.status === 'success' && result.data) {
        const entities: EntityRef[] = [];
        const typeNames = new Set<string>();
        extractEntities(result.data, entities);
        extractTypeNames(result.data, typeNames);
        for (const entity of entities) {
          cache.merge(entity);
        }
        cache.writeLocalWithTypes(queryHash, result, typeNames);
        fetchTimestamps.set(queryHash, Date.now());
      }
    };

    if (request.type === 'query') {
      const queryHash = `query:${request.query}|${JSON.stringify(request.variables)}`;
      const cachedRaw = cache.readLocal(queryHash) as GraphQLResult<unknown> | undefined;
      const lastFetch = fetchTimestamps.get(queryHash) ?? 0;
      const age = Date.now() - lastFetch;

      if (cachedRaw && maxAge > 0) {
        if (age < staleTime) {
          return cachedRaw;
        }
        if (age < maxAge) {
          const result = await next(request);
          storeResult(result, queryHash);
          return cachedRaw;
        }
      }

      if (cachedRaw && maxAge === 0) {
        return cachedRaw;
      }

      const result = await next(request);
      storeResult(result, queryHash);
      return result;
    }

    if (request.type === 'mutation') {
      const result = await next(request);
      if (result.status === 'success' && result.data) {
        const entities: EntityRef[] = [];
        const typeNames = new Set<string>();
        extractEntities(result.data, entities);
        extractTypeNames(result.data, typeNames);
        for (const entity of entities) {
          cache.merge(entity);
        }
        if (typeNames.size > 0) {
          cache.clearLocalStateByTypes(Array.from(typeNames));
        }
      }
      return result;
    }

    return next(request);
  };
}
