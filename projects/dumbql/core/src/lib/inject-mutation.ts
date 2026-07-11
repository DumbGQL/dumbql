import { inject, signal, type Signal } from '@angular/core';
import { defer, Observable, tap } from 'rxjs';
import { GraphqlService, type GraphQLResult, type RequestOverrideConfig } from './graphql.service';
import { EndpointsService } from './endpoints.service';
import type { DocumentNode, TypedDocumentNode, TypedQueryString } from './gql';
import type { InferResponse, InferVariables, InferEndpointNames } from './types';
import type { EndpointsYaml } from './endpoints-config';

export type InjectMutationEndpointParam<Yaml extends EndpointsYaml | undefined = undefined> =
	[Yaml] extends [EndpointsYaml]
		? InferEndpointNames<Yaml>
		: string | Signal<string>;

export interface InjectMutationOptions<Yaml extends EndpointsYaml | undefined = undefined> {
	/** Endpoint name or signal that resolves to an endpoint name. */
	endpoint?: InjectMutationEndpointParam<Yaml>;
	/** Apply optimistic cache update. Return a unique ID for the update. */
	optimistic?: (cache: GraphqlCacheLike) => string;
}

export interface InjectMutationHandle<TResponse> {
	/** Observable of the mutation result */
	readonly result$: Observable<GraphQLResult<TResponse>>;
	/** Execute the mutation. Returns an Observable. */
	readonly mutate: (variables?: Record<string, unknown>) => Observable<GraphQLResult<TResponse>>;
	/** Signal: current data value */
	readonly data: Signal<TResponse | undefined>;
	/** Signal: current error message */
	readonly error: Signal<string | undefined>;
	/** Signal: whether a mutation is in flight */
	readonly loading: Signal<boolean>;
	/** Signal: current status of the mutation */
	readonly status: Signal<'idle' | 'loading' | 'success' | 'error'>;
}

export function injectMutation<
	TDocument extends TypedQueryString<unknown, Record<string, unknown>>
		| DocumentNode
		| TypedDocumentNode<unknown, Record<string, unknown>>,
	TResponse = InferResponse<TDocument>,
	TVariables extends Record<string, unknown> = InferVariables<TDocument> extends Record<string, unknown>
		? InferVariables<TDocument>
		: Record<string, unknown>,
>(
	document: TDocument,
	options?: InjectMutationOptions,
): InjectMutationHandle<TResponse> {
	const graphql = inject(GraphqlService);
	const endpoints = inject(EndpointsService, { optional: true });

	const dataSignal = signal<TResponse | undefined>(undefined);
	const errorSignal = signal<string | undefined>(undefined);
	const loadingSignal = signal(false);
	const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

	let result$!: Observable<GraphQLResult<TResponse>>;

	const epOption = options?.endpoint;
	const epName = typeof epOption === 'string' ? epOption : undefined;

	if (endpoints) {
		endpoints.throwIfMultiEndpointMissing(epName);
	}

	const resolveUrlAndOverride = (): { url?: string; overrideCfg?: RequestOverrideConfig } => {
		if (!epName || !endpoints) return {};
		const route = endpoints.getRoute(epName);
		if (!route) return {};
		const hasOverride = route.middleware || route.errorPolicy ||
			route.retryCount !== undefined || route.retryDelay !== undefined;
		return {
			url: route.url,
			overrideCfg: hasOverride ? {
				middleware: route.middleware,
				errorPolicy: route.errorPolicy,
				retryCount: route.retryCount,
				retryDelay: route.retryDelay,
			} : undefined,
		};
	};

	const mutate = (variables?: Record<string, unknown>): Observable<GraphQLResult<TResponse>> => {
		loadingSignal.set(true);
		statusSignal.set('loading');
		dataSignal.set(undefined);
		errorSignal.set(undefined);

		const { url, overrideCfg } = resolveUrlAndOverride();

		return defer(() => {
			return graphql.mutate<TResponse>(
				document,
				variables as TVariables | undefined,
				url,
				options?.optimistic,
				overrideCfg,
			).pipe(
				tap({
					next: (result) => {
						loadingSignal.set(false);
						if (result.status === 'success') {
							statusSignal.set('success');
							dataSignal.set(result.data);
						} else {
							statusSignal.set('error');
							errorSignal.set(result.error);
						}
					},
					error: () => {
						loadingSignal.set(false);
						statusSignal.set('error');
						errorSignal.set('Mutation error');
					},
				}),
			);
		});
	};

	return {
		result$,
		mutate,
		data: dataSignal.asReadonly(),
		error: errorSignal.asReadonly(),
		loading: loadingSignal.asReadonly(),
		status: statusSignal.asReadonly(),
	};
}
