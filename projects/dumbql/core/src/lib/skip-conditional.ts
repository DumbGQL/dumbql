import { inject, Injector, signal, isSignal, type Signal, type WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, switchMap, NEVER, share, ReplaySubject, startWith, distinctUntilChanged, of, map as rxMap, takeUntil } from 'rxjs';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import { EndpointsService } from './endpoints.service';
import type { DocumentNode, TypedDocumentNode, TypedQueryString } from './gql';
import type { InferResponse, InferVariables, InferEndpointNames } from './types';
import type { EndpointsYaml } from './endpoints-config';

export type SkipEndpointParam<Yaml extends EndpointsYaml | undefined = undefined> =
	[Yaml] extends [EndpointsYaml]
		? InferEndpointNames<Yaml>
		: string | Signal<string>;

export interface SkipQueryOptions<Yaml extends EndpointsYaml | undefined = undefined> {
	/** Endpoint name or signal that resolves to an endpoint name. */
	endpoint?: SkipEndpointParam<Yaml>;
	/** Signal or boolean to skip the query. */
	skip?: Signal<boolean> | boolean;
}

export interface SkipQueryHandle<T> {
	/** Stream of query results */
	readonly result$: Observable<GraphQLResult<T>>;
	/** Toggle query execution */
	readonly enabled: WritableSignal<boolean>;
	/** Force re-execution of the query */
	readonly refetch: () => void;
	/** Signal: current data value */
	readonly data: Signal<T | undefined>;
	/** Signal: current error message */
	readonly error: Signal<string | undefined>;
	/** Signal: whether a query is in flight */
	readonly loading: Signal<boolean>;
	/** Signal: current status of the query */
	readonly status: Signal<'idle' | 'loading' | 'success' | 'error'>;
}

export function skipQuery<
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
	options?: SkipQueryOptions,
): SkipQueryHandle<TResponse> {
	const graphql = inject(GraphqlService);
	const injector = inject(Injector);
	const endpoints = inject(EndpointsService, { optional: true });

	const skip = options?.skip ?? false;
	const skipSignal = isSignal(skip) ? skip : signal(skip);

	const enabled = signal(false);

	const epOption = options?.endpoint;

	let endpoint$: Observable<string | undefined>;
	if (isSignal(epOption)) {
		endpoint$ = toObservable(epOption, { injector }).pipe(
			distinctUntilChanged(),
			rxMap((name) => {
				if (name && endpoints) return endpoints.getRoute(name)?.url;
				return undefined;
			}),
		);
	} else if (typeof epOption === 'string') {
		const url = endpoints?.getRoute(epOption)?.url;
		endpoint$ = of(url);
	} else {
		endpoint$ = of(undefined);
	}

	const refetch$ = new Subject<void>();
	const destroy$ = new Subject<void>();

	const result$ = toObservable(skipSignal, { injector }).pipe(
		distinctUntilChanged(),
		switchMap((isSkip) => {
			if (isSkip) return NEVER;
			return refetch$.pipe(
				startWith(undefined),
				switchMap(() => endpoint$.pipe(
					switchMap((url) =>
						graphql.query<TResponse>(document, variables, url).pipe(takeUntil(destroy$)),
					),
				)),
			);
		}),
		share({ connector: () => new ReplaySubject(1) }),
	);

	const statusSignal = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
	const dataSignal = signal<TResponse | undefined>(undefined);
	const errorSignal = signal<string | undefined>(undefined);
	const loadingSignal = signal(false);

	result$.subscribe({
		next: (result) => {
			loadingSignal.set(false);
			if (result.status === 'success') {
				statusSignal.set('success');
				dataSignal.set(result.data);
				errorSignal.set(undefined);
			} else {
				statusSignal.set('error');
				dataSignal.set(undefined);
				errorSignal.set(result.error);
			}
		},
		error: () => {
			loadingSignal.set(false);
			statusSignal.set('error');
			errorSignal.set('Query subscription error');
		},
	});

	return {
		result$,
		enabled,
		refetch: () => refetch$.next(),
		data: dataSignal.asReadonly(),
		error: errorSignal.asReadonly(),
		loading: loadingSignal.asReadonly(),
		status: statusSignal.asReadonly(),
	};
}
