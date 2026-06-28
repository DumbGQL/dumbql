import { type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from './use-query';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';

export interface QueryProps<TData, TVariables extends Record<string, unknown>> {
  document: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  children: (result: UseQueryResult<TData, TVariables>) => ReactNode;
}

export function Query<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>({
  document,
  variables,
  children,
}: QueryProps<TData, TVariables>): ReactNode {
  const result = useQuery<TData, TVariables>(document, variables);
  return children(result);
}
