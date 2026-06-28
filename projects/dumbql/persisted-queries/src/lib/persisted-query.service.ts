import { Injectable, inject } from '@angular/core';
import { from, Observable, of, switchMap, tap } from 'rxjs';
import type { GraphQLResult } from '@dumbql/core';
import { GraphqlService, type DocumentNode } from '@dumbql/core';
import type { GraphqlMiddleware } from '@dumbql/core';

async function sha256(message: string): Promise<string> {
	if (typeof crypto !== 'undefined' && crypto.subtle) {
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	let hash = 0;
	for (let i = 0; i < message.length; i++) {
		const char = message.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0;
	}
	return Math.abs(hash).toString(36);
}

function isPersistedQueryNotFound(result: GraphQLResult<unknown>): boolean {
	return result.status === 'error'
		&& (result.error.includes('PersistedQueryNotFound')
			|| result.error.includes('persistedQueryNotFound'));
}

const hashCache = new Map<string, string>();
const registeredHashes = new Set<string>();

export function apqMiddleware(): GraphqlMiddleware {
	return (request, next) => {
		const hash = hashCache.get(request.query);
		if (hash && registeredHashes.has(hash)) {
			const extensions: Record<string, unknown> = {
				...request.extensions,
				persistedQuery: { version: 1, sha256Hash: hash },
			};
			return next({ ...request, query: '', extensions });
		}

		return from(sha256(request.query)).pipe(
			switchMap((computedHash) => {
				hashCache.set(request.query, computedHash);
				const extensions: Record<string, unknown> = {
					persistedQuery: { version: 1, sha256Hash: computedHash },
				};

				return next({ ...request, query: '', extensions }).pipe(
					switchMap((result) => {
						if (isPersistedQueryNotFound(result)) {
							return next({
								...request,
								query: request.query,
								extensions: { ...extensions, ...request.extensions },
							}).pipe(
								tap(() => registeredHashes.add(computedHash)),
							);
						}
						registeredHashes.add(computedHash);
						return of(result);
					}),
				);
			}),
		);
	};
}

@Injectable({ providedIn: 'root' })
export class PersistedQueryService {
	private readonly svc = inject(GraphqlService);

	execute<T, TVars extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode,
		variables?: TVars,
	): Observable<GraphQLResult<T>> {
		return this.svc.query<T, TVars>(document, variables);
	}
}
