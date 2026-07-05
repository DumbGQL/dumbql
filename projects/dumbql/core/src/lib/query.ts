import { inject, Injector, signal, type WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, switchMap, NEVER, share, ReplaySubject, startWith, distinctUntilChanged } from 'rxjs';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import type { DocumentNode, TypedDocumentNode, TypedQueryString } from './gql';

export interface QueryHandle<T> {
  /** Stream of query results */
  readonly result$: Observable<GraphQLResult<T>>;
  /** Toggle query execution. Set `false` to cancel in-flight requests. */
  readonly enabled: WritableSignal<boolean>;
  /** Force re-execution of the query */
  readonly refetch: () => void;
}

export function query<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
  variables?: TVariables,
): QueryHandle<TResponse> {
  const graphql = inject(GraphqlService);
  const injector = inject(Injector);
  const enabled = signal(true);
  const refetch$ = new Subject<void>();

  const result$ = toObservable(enabled, { injector }).pipe(
    distinctUntilChanged(),
    switchMap((isEnabled) => {
      if (!isEnabled) return NEVER;
      return refetch$.pipe(
        startWith(undefined),
        switchMap(() => graphql.query<TResponse>(document, variables)),
      );
    }),
    share({ connector: () => new ReplaySubject(1) }),
  );

  return {
    result$,
    enabled,
    refetch: () => refetch$.next(),
  };
}
