import { inject, Injectable, type Provider, ENVIRONMENT_INITIALIZER, Injector } from '@angular/core';
import { tap } from 'rxjs';
import type { GraphQLResult } from './graphql.service';
import type { GraphqlMiddleware } from './middleware';
import { CacheService } from '@dumbql/cache';

interface EntityRef {
	__typename: string;
	id?: string;
}

function extractEntities(data: unknown, entities: EntityRef[]): void {
	if (!data || typeof data !== 'object') return;
	if (Array.isArray(data)) {
		for (const item of data) extractEntities(item, entities);
		return;
	}
	const obj = data as Record<string, unknown>;
	if (typeof obj['__typename'] === 'string') {
		const id = typeof obj['id'] === 'string' || typeof obj['_id'] === 'string'
			? String(obj['id'] ?? obj['_id']) : undefined;
		entities.push({ __typename: obj['__typename'] as string, id });
	}
	for (const v of Object.values(obj)) {
		if (v && typeof v === 'object') extractEntities(v, entities);
	}
}

export function mutationCachePolicy(injector?: Injector): GraphqlMiddleware {
	return (request, next) => {
		if (request.type !== 'mutation') return next(request);

		return next(request).pipe(
			tap((result: GraphQLResult<unknown>) => {
				if (result.status !== 'success') return;
				const inj = injector ?? (() => { try { return inject(Injector); } catch { return null; } })();
				if (!inj) return;
				const cache = inj.get(CacheService, null);
				if (!cache) return;
				const entities: EntityRef[] = [];
				extractEntities(result.data, entities);
				for (const e of entities) {
					if (e.id) {
						cache.evict(e.__typename, e.id);
					}
				}
			}),
		);
	};
}

@Injectable()
export class AutoRefetchService {
	clearRegistry(): void {
		// no-op, kept for API compatibility
	}
}

export function provideAutoRefetch(): Provider[] {
	return [
		AutoRefetchService,
		{
			provide: ENVIRONMENT_INITIALIZER,
			multi: true,
			useValue: () => inject(AutoRefetchService),
		},
	];
}
