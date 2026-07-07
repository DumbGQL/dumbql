import { inject, InjectionToken, type Provider } from '@angular/core';
import { Observable } from 'rxjs';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import type { DocumentNode, TypedDocumentNode } from './gql';
import type { GraphqlCacheLike } from './dumbql-config';

export interface MutateEndpointOptions {
	optimistic?: (cache: GraphqlCacheLike) => string;
}

export class GraphqlEndpoint {
	constructor(
		private readonly graphql: GraphqlService,
		private readonly endpoint: string,
	) {}

	query<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
	): Observable<GraphQLResult<TResponse>> {
		return this.graphql.query<TResponse, TVariables>(document, variables, this.endpoint);
	}

	mutate<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
		options?: MutateEndpointOptions,
	): Observable<GraphQLResult<TResponse>> {
		return this.graphql.mutate<TResponse, TVariables>(document, variables, this.endpoint, options?.optimistic);
	}

	refetch<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
	): Observable<GraphQLResult<TResponse>> {
		return this.graphql.refetch<TResponse, TVariables>(document, variables, this.endpoint);
	}

	poll<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		intervalMs: number,
		variables?: TVariables,
	): Observable<GraphQLResult<TResponse>> {
		return this.graphql.poll<TResponse, TVariables>(document, intervalMs, variables, this.endpoint);
	}
}

const endpointTokens = new Map<string, InjectionToken<GraphqlEndpoint>>();

function getEndpointToken(name: string): InjectionToken<GraphqlEndpoint> {
	if (!endpointTokens.has(name)) {
		endpointTokens.set(name, new InjectionToken<GraphqlEndpoint>(`ENDPOINT_${name}`));
	}
	return endpointTokens.get(name)!;
}

export function provideEndpoint(name: string, url: string): Provider[] {
	const token = getEndpointToken(name);
	return [
		{
			provide: token,
			useFactory: (graphql: GraphqlService) => new GraphqlEndpoint(graphql, url),
			deps: [GraphqlService],
		},
	];
}

export function injectEndpoint(name: string): GraphqlEndpoint {
	const token = getEndpointToken(name);
	return inject(token);
}
