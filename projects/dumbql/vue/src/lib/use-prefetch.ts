import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './plugin';

export function usePrefetch<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
): (variables?: TVariables) => Promise<GraphQLResult<TData>> {
  const client = useClient();
  return (variables?: TVariables) => client.query<TData, TVariables>(document, variables);
}
