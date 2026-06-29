import { type ReactNode } from 'react';
import { useQuery, type UseQueryOptions, type UseQueryResult } from './use-query';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';

export interface QueryProps<TData, TVariables extends Record<string, unknown>> {
  document: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  pollInterval?: number;
  skip?: boolean;
  children: (result: UseQueryResult<TData, TVariables>) => ReactNode;
}

export function Query<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  document,
  variables,
  pollInterval,
  skip,
  children,
}: QueryProps<TData, TVariables>): ReactNode {
  const options: UseQueryOptions<TData, TVariables> = {};
  if (variables !== undefined) options.variables = variables;
  if (pollInterval !== undefined) options.pollInterval = pollInterval;
  if (skip !== undefined) options.skip = skip;

  const result = useQuery<TData, TVariables>(document, options);
  return children(result);
}
