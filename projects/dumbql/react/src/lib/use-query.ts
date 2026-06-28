import { useState, useEffect, useCallback, useRef } from 'react';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './provider';

export interface UseQueryResult<TData, TVariables extends Record<string, unknown>> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  refetch: (vars?: TVariables) => Promise<GraphQLResult<TData>>;
}

export function useQuery<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): UseQueryResult<TData, TVariables> {
  const client = useClient();
  const [result, setResult] = useState<GraphQLResult<TData> | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setLoading(true);
    setResult(null);

    client.query<TData, TVariables>(document, variables).then((res) => {
      if (!cancelRef.current) {
        setResult(res);
        setLoading(false);
      }
    });

    return () => {
      cancelRef.current = true;
    };
  }, [client, document, JSON.stringify(variables ?? {})]);

  const refetch = useCallback(
    async (vars?: TVariables) => {
      const res = await client.refetch<TData, TVariables>(document, (vars ?? variables) as TVariables);
      setResult(res);
      return res;
    },
    [client, document, variables],
  );

  const data = result?.status === 'success' ? result.data : null;
  const error = result?.status === 'error' ? result.error : null;

  return { data, loading, error, refetch };
}
