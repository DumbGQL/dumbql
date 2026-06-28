import { inject } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { GraphqlService, type GraphQLResult } from './graphql.service';
import type { DocumentNode, TypedDocumentNode } from './gql';
import type { CacheService } from '@dumbql/cache';

export interface MutateOptions {
  /** Apply optimistic cache update. Return a unique ID for the update. */
  optimistic?: (cache: CacheService) => string;
}

export function mutate<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
  variables?: TVariables,
  options?: MutateOptions,
): Observable<GraphQLResult<TResponse>> {
  return defer(() => {
    const svc = inject(GraphqlService);
    return svc.mutate<TResponse, TVariables>(document, variables, undefined, options?.optimistic);
  });
}
