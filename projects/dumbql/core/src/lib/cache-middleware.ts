import { inject, Injector } from '@angular/core';
import { of, tap, merge, Subject, takeUntil } from 'rxjs';
import type { GraphQLResult } from './graphql.service';
import type { GraphqlMiddleware } from './middleware';
import { DUMBQL_CONFIG, GRAPHQL_CACHE, type DumbqlConfig } from './dumbql-config';

interface TypePolicy {
  keyFields?: string[];
  merge?:
    | 'append'
    | 'prepend'
    | ((
        existing: unknown[] | undefined,
        incoming: unknown[],
        options?: { args?: Record<string, unknown> },
      ) => unknown[]);
}

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

const initialized = new WeakSet<Injector>();

export function cacheMiddleware(injector?: Injector): GraphqlMiddleware {
  const fetchTimestamps = new Map<string, number>();

  return (request, next) => {
    const inj =
      injector ??
      (() => {
        try {
          return inject(Injector);
        } catch {
          return null;
        }
      })();
    if (!inj) return next(request);

    const cache = inj.get(GRAPHQL_CACHE, null);
    if (!cache) return next(request);

    const cfg = inj.get(DUMBQL_CONFIG, null) as DumbqlConfig | null;

    // Wire typePolicies once per Injector
    if (!initialized.has(inj) && cfg?.cache?.typePolicies) {
      initialized.add(inj);
      const policies = cfg.cache.typePolicies as Record<string, TypePolicy>;
      cache.setTypePolicies(policies);
    }

    const maxAge = cfg?.cache?.maxAge ?? 0;
    const staleTime = maxAge > 0 ? Math.floor(maxAge / 2) : 0;

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
          return of(cachedRaw);
        }
        if (age < maxAge) {
          const stop$ = new Subject<void>();
          return merge(
            of(cachedRaw),
            next(request).pipe(
              tap((result) => storeResult(result, queryHash)),
              takeUntil(stop$),
            ),
          );
        }
      }

      if (cachedRaw && maxAge === 0) {
        return of(cachedRaw);
      }

      return next(request).pipe(tap((result) => storeResult(result, queryHash)));
    }

    if (request.type === 'mutation') {
      return next(request).pipe(
        tap((result: GraphQLResult<unknown>) => {
          if (result.status === 'success' && result.data) {
            const entities: EntityRef[] = [];
            const typeNames = new Set<string>();
            extractEntities(result.data, entities);
            extractTypeNames(result.data, typeNames);
            for (const entity of entities) {
              cache.merge(entity);
            }
            // Selective invalidation: only clear cached queries that reference
            // the mutated entity types. Unlike URQL Graphcache which invalidates
            // ALL queries of a type on create (issue #3843), we track per-query
            // typename dependencies and only clear the affected ones.
            if (typeNames.size > 0) {
              cache.clearLocalStateByTypes(Array.from(typeNames));
            }
          }
        }),
      );
    }

    return next(request);
  };
}
