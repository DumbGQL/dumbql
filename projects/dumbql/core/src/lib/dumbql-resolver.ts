import { inject } from '@angular/core';
import { type ActivatedRoute, type ActivatedRouteSnapshot, type ResolveFn, type Route } from '@angular/router';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import { EndpointsService } from './endpoints.service';
import { type DocumentNode, type TypedDocumentNode } from './gql';

export interface PrefetchDefinition<TVariables extends Record<string, unknown> = Record<string, unknown>> {
	readonly document: DocumentNode | TypedDocumentNode<unknown, TVariables>;
	readonly variables?: TVariables | ((route: ActivatedRouteSnapshot) => TVariables);
	/** Endpoint name from endpoints.yml. When provided, the prefetch targets that endpoint's URL and config. */
	readonly endpoint?: string;
}

export type PrefetchDefinitions = PrefetchDefinition | PrefetchDefinition[];

function resolveVariables<TVars extends Record<string, unknown>>(
	def: PrefetchDefinition<TVars>,
	route: ActivatedRouteSnapshot,
): TVars | undefined {
	return typeof def.variables === 'function'
		? (def.variables as (r: ActivatedRouteSnapshot) => TVars)(route)
		: def.variables;
}

function prefetchResolverFn(def: PrefetchDefinition): ResolveFn<GraphQLResult<unknown>> {
	return (route) => {
		const variables = resolveVariables(def, route);
		if (def.endpoint) {
			const endpoints = inject(EndpointsService);
			const endpointObj = endpoints.resolveEndpoint(def.endpoint);
			return endpointObj.query(def.document, variables);
		}
		const graphql = inject(GraphqlService);
		return graphql.query(def.document, variables);
	};
}

export function prefetchedRoute(
	route: Route,
	prefetch: PrefetchDefinitions,
	/** When provided, all prefetches on this route target this endpoint. Per-prefetch `endpoint` takes precedence. */
	defaultEndpoint?: string,
): Route {
	const defs = Array.isArray(prefetch) ? prefetch : [prefetch];
	const resolve: Record<string, ResolveFn<GraphQLResult<unknown>>> = {};
	for (const def of defs) {
		const mergedDef = defaultEndpoint && !def.endpoint
			? { ...def, endpoint: defaultEndpoint }
			: def;
		const name = extractQueryName(mergedDef.document) ?? `graphql_${Object.keys(resolve).length}`;
		resolve[name] = prefetchResolverFn(mergedDef);
	}
	return { ...route, resolve: { ...route.resolve, ...resolve } };
}

export function fromPrefetched<T>(route: ActivatedRoute, key: string): Observable<GraphQLResult<T>> {
	return route.data.pipe(map((d) => d[key] as GraphQLResult<T>));
}

function extractQueryName(doc: DocumentNode): string | null {
	for (const def of doc.definitions) {
		if (def.kind === 'OperationDefinition' && def.name?.value) {
			return def.name.value;
		}
	}
	return null;
}
