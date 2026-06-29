import { useState, useCallback, useRef, useEffect } from 'react';
import type { DocumentNode, TypedDocumentNode, GraphQLResult, ErrorCode } from '@dumbql/client';
import { useClient } from './provider';

interface SuspenseQueryOptions<TData, TVariables> {
  variables?: TVariables;
  fetchPolicy?: 'cache-first' | 'network-only' | 'no-cache';
  onCompleted?: (data: TData) => void;
  onError?: (error: string, errorCode?: ErrorCode) => void;
}

interface SuspenseQueryResult<TData> {
  data: TData;
  error: null;
  networkStatus: 'ready';
}

export function useSuspenseQuery<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: SuspenseQueryOptions<TData, TVariables>,
): SuspenseQueryResult<TData> {
  const client = useClient();
  const variables = options?.variables;
  const onCompletedRef = useRef(options?.onCompleted);
  const onErrorRef = useRef(options?.onError);
  onCompletedRef.current = options?.onCompleted;
  onErrorRef.current = options?.onError;

  const key = JSON.stringify({ doc: query, vars: variables ?? {} });
  const keyRef = useRef(key);

  const dataRef = useRef<TData | undefined>(undefined);
  const errorRef = useRef<string | undefined>(undefined);
  const errorCodeRef = useRef<ErrorCode | undefined>(undefined);
  const promiseRef = useRef<Promise<void> | undefined>(undefined);

  if (keyRef.current !== key) {
    keyRef.current = key;
    dataRef.current = undefined;
    errorRef.current = undefined;
    errorCodeRef.current = undefined;
    promiseRef.current = undefined;
  }

  if (!dataRef.current && !errorRef.current) {
    if (!promiseRef.current) {
      promiseRef.current = client
        .query<TData, TVariables>(query, variables)
        .then((res: GraphQLResult<TData>) => {
          if (res.status === 'success') {
            dataRef.current = res.data;
            onCompletedRef.current?.(res.data);
          } else {
            errorRef.current = res.error ?? 'Query failed';
            errorCodeRef.current = res.errorCode;
            onErrorRef.current?.(res.error ?? 'Query failed', res.errorCode);
          }
          promiseRef.current = undefined;
        });
    }
    throw promiseRef.current;
  }

  if (errorRef.current) {
    const errorMessage = errorRef.current;
    const code = errorCodeRef.current;
    dataRef.current = undefined;
    errorRef.current = undefined;
    errorCodeRef.current = undefined;
    promiseRef.current = undefined;
    throw new Error(errorMessage);
  }

  return { data: dataRef.current!, error: null, networkStatus: 'ready' };
}

export interface QueryRef<TData> {
  read(): TData;
  refetch: () => Promise<GraphQLResult<TData>>;
}

export function useBackgroundQuery<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: { variables?: TVariables },
): [QueryRef<TData>] {
  const client = useClient();
  const variables = options?.variables;

  const dataRef = useRef<TData | undefined>(undefined);
  const errorRef = useRef<string | undefined>(undefined);
  const promiseRef = useRef<Promise<void> | undefined>(undefined);

  const refetch = useCallback(async () => {
    promiseRef.current = undefined;
    dataRef.current = undefined;
    errorRef.current = undefined;
    const res = await client.refetch<TData, TVariables>(query, variables);
    if (res.status === 'success') {
      dataRef.current = res.data;
    } else {
      errorRef.current = res.error ?? 'Query failed';
    }
    return res;
  }, [client, query, variables]);

  if (!promiseRef.current && dataRef.current === undefined && !errorRef.current) {
    promiseRef.current = client
      .query<TData, TVariables>(query, variables)
      .then((res: GraphQLResult<TData>) => {
        if (res.status === 'success') {
          dataRef.current = res.data;
        } else {
          errorRef.current = res.error ?? 'Query failed';
        }
        promiseRef.current = undefined;
      });
  }

  const queryRef: QueryRef<TData> = {
    read(): TData {
      if (promiseRef.current) {
        throw promiseRef.current;
      }
      if (errorRef.current) {
        throw new Error(errorRef.current);
      }
      return dataRef.current!;
    },
    refetch,
  };

  return [queryRef];
}

export function useReadQuery<TData>(queryRef: QueryRef<TData>): { data: TData } {
  return { data: queryRef.read() };
}
