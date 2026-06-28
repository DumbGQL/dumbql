import { inject, Injector } from '@angular/core';
import { of, tap } from 'rxjs';
import type { GraphQLResult } from './graphql.service';
import type { GraphqlMiddleware } from './middleware';
import { CacheService } from '@dumbql/cache';

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

export function cacheMiddleware(injector?: Injector): GraphqlMiddleware {
	return (request, next) => {
		const inj = injector ?? (() => { try { return inject(Injector); } catch { return null; } })();
		if (!inj) return next(request);

		const cache = inj.get(CacheService, null);
		if (!cache) return next(request);

		if (request.type === 'query') {
			const queryHash = `query:${request.query}|${JSON.stringify(request.variables)}`;
			const cachedResult = cache.readLocal(queryHash);
			if (cachedResult) {
				return of(cachedResult as GraphQLResult<unknown>);
			}

			return next(request).pipe(
				tap((result: GraphQLResult<unknown>) => {
					if (result.status === 'success' && result.data) {
						const entities: EntityRef[] = [];
						extractEntities(result.data, entities);
						for (const entity of entities) {
							cache.merge(entity);
						}
						cache.writeLocal(queryHash, result);
					}
				}),
			);
		}

		if (request.type === 'mutation') {
			return next(request).pipe(
				tap((result: GraphQLResult<unknown>) => {
					if (result.status === 'success' && result.data) {
						const entities: EntityRef[] = [];
						extractEntities(result.data, entities);
						for (const entity of entities) {
							cache.merge(entity);
							cache.evict(entity.__typename, entity.id);
						}
						cache.clearLocalState();
					}
				}),
			);
		}

		return next(request);
	};
}
