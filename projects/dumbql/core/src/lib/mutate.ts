import { inject, isSignal, type Signal } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { GraphqlService, type GraphQLResult, type RequestOverrideConfig } from './graphql.service';
import { EndpointsService } from './endpoints.service';
import type { DocumentNode, TypedDocumentNode, TypedQueryString } from './gql';
import type { GraphqlCacheLike } from './dumbql-config';
import type { InferResponse, InferVariables, InferEndpointNames } from './types';
import type { EndpointsYaml } from './endpoints-config';

export type MutateEndpointParam<Yaml extends EndpointsYaml | undefined = undefined> =
	[Yaml] extends [EndpointsYaml]
		? InferEndpointNames<Yaml>
		: string | Signal<string>;

export interface MutateOptions<Yaml extends EndpointsYaml | undefined = undefined> {
	/** Apply optimistic cache update. Return a unique ID for the update. */
	optimistic?: (cache: GraphqlCacheLike) => string;
	/** Endpoint name or signal that resolves to an endpoint name. Required when multiEndpoint is enabled. */
	endpoint?: MutateEndpointParam<Yaml>;
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
	variables?: TVariables,
	options?: MutateOptions,
): Observable<GraphQLResult<TResponse>> {
	return defer(() => {
		const svc = inject(GraphqlService);
		const endpoints = inject(EndpointsService, { optional: true });

		const epOption = options?.endpoint;
		const epName = isSignal(epOption) ? epOption() : epOption;

		if (endpoints) {
			endpoints.throwIfMultiEndpointMissing(epName);
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
		);
	});
}
