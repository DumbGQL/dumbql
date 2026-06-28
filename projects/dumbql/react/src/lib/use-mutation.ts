import { useState, useCallback } from 'react';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './provider';

export type UseMutationFn<TData, TVariables> = (
  variables?: TVariables,
) => Promise<GraphQLResult<TData>>;

export interface UseMutationResult<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  mutate: UseMutationFn<TData, TVariables>;
}

export function useMutation<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
  const client = useClient();
  const [result, setResult] = useState<GraphQLResult<TData> | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback<UseMutationFn<TData, TVariables>>(
    async (variables?: TVariables) => {
      setLoading(true);
      const res = await client.mutate<TData, TVariables>(document, variables);
      setResult(res);
      setLoading(false);
      return res;
    },
    [client, document],
  );

  const data = result?.status === 'success' ? result.data : null;
  const error = result?.status === 'error' ? result.error : null;

  return { data, loading, error, mutate };
}
