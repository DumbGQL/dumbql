import { inject, type Signal } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { GraphqlService, type GraphQLResult, type RequestOverrideConfig, type RefetchQueryDef } from './graphql.service';
import { EndpointsService } from './endpoints.service';
import type { DocumentNode, TypedDocumentNode, TypedQueryString } from './gql';
import type { GraphqlCacheLike } from './dumbql-config';
import type { InferResponse, InferVariables, InferEndpointNames } from './types';
import type { EndpointsYaml } from './endpoints-config';

export type MutateEndpointParam<Yaml extends EndpointsYaml | undefined = undefined> =
	[Yaml] extends [EndpointsYaml]
		? InferEndpointNames<Yaml>
		: string | Signal<string>;

export interface MutateOptions {
	/** Apply optimistic cache update. Return a unique ID for the update. */
	readonly optimistic?: (cache: GraphqlCacheLike) => string;
	/** Re-execute these queries after a successful mutation. */
	readonly refetchQueries?: readonly RefetchQueryDef[];
}

export function mutate<
	TDocument extends TypedQueryString<unknown, Record<string, unknown>>
		| DocumentNode
		| TypedDocumentNode<unknown, Record<string, unknown>>,
	TResponse = InferResponse<TDocument>,
	TVariables extends Record<string, unknown> = InferVariables<TDocument> extends Record<string, unknown>
		? InferVariables<TDocument>
		: Record<string, unknown>,
>(
	document: TDocument,
	endpoint?: MutateEndpointParam,
	variables?: TVariables,
	options?: MutateOptions,
): Observable<GraphQLResult<TResponse>> {
	return defer(() => {
		const svc = inject(GraphqlService);
		const endpoints = inject(EndpointsService, { optional: true });

		let epName = typeof endpoint === 'string' ? endpoint : undefined;

		if (endpoints) {
			epName = endpoints.throwIfMultiEndpointMissing(epName);
		}

		let url: string | undefined;
		let overrideCfg: RequestOverrideConfig | undefined;
		if (epName && endpoints) {
			const route = endpoints.getRoute(epName);
			url = route?.url;
			if (route) {
				const has = route.middleware || route.errorPolicy ||
					route.retryCount !== undefined || route.retryDelay !== undefined;
				if (has) {
					overrideCfg = {
						middleware: route.middleware,
						errorPolicy: route.errorPolicy,
						retryCount: route.retryCount,
						retryDelay: route.retryDelay,
					};
				}
			}
		}

		return svc.mutate<TResponse, TVariables>(
			document, variables, url, options?.optimistic, overrideCfg,
			options?.refetchQueries,
		);
	});
}
