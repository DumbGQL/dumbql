import { useState, useEffect, useRef } from 'react';
import type { DocumentNode, TypedDocumentNode, ErrorCode } from '@dumbql/client';
import { print } from '@dumbql/client';
import { useClient } from './provider';

export interface UseSubscriptionOptions<TData> {
  variables?: Record<string, unknown>;
  wsEndpoint?: string;
  shouldSubscribe?: boolean;
  onNext?: (data: TData) => void;
  onError?: (error: string, errorCode?: ErrorCode) => void;
  onComplete?: () => void;
}

export interface UseSubscriptionResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  errorCode?: ErrorCode;
}

interface GraphqlWsMessage<T = Record<string, unknown>> {
  type: 'next' | 'error' | 'complete';
  id?: string;
  payload?: { data?: T; errors?: { message: string }[] };
}

export function useSubscription<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UseSubscriptionOptions<TData>,
): UseSubscriptionResult<TData> {
  const client = useClient();
  const variables = options?.variables;
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const wsEndpoint =
    options?.wsEndpoint ??
    client.endpoint.replace(/^http/, 'ws');

  const shouldSubscribe = options?.shouldSubscribe ?? true;
  const onNextRef = useRef(options?.onNext);
  const onErrorRef = useRef(options?.onError);
  const onCompleteRef = useRef(options?.onComplete);
  onNextRef.current = options?.onNext;
  onErrorRef.current = options?.onError;
  onCompleteRef.current = options?.onComplete;

  useEffect(() => {
    if (!shouldSubscribe) return;

    setLoading(true);
    setData(null);
    setError(null);
    setErrorCode(undefined);

    const queryStr = print(document);
    const ws = new WebSocket(wsEndpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      const subscribeMsg = {
        type: 'subscribe',
        id: '1',
        payload: {
          query: queryStr,
          variables: variables ?? {},
        },
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as GraphqlWsMessage<TData>;
        if (msg.type === 'next' && msg.payload) {
          if (msg.payload.errors) {
            const errMsg = msg.payload.errors[0].message;
            setError(errMsg);
            setErrorCode('GRAPHQL_ERROR');
            onErrorRef.current?.(errMsg, 'GRAPHQL_ERROR');
          } else if (msg.payload.data) {
            setData(msg.payload.data);
            onNextRef.current?.(msg.payload.data);
          }
          setLoading(false);
        } else if (msg.type === 'error') {
          const errMsg = msg.payload?.errors?.[0]?.message ?? 'Subscription error';
          setError(errMsg);
          setErrorCode('GRAPHQL_ERROR');
          setLoading(false);
          onErrorRef.current?.(errMsg, 'GRAPHQL_ERROR');
        } else if (msg.type === 'complete') {
          setLoading(false);
          onCompleteRef.current?.();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      const errMsg = 'WebSocket connection error';
      setError(errMsg);
      setErrorCode('NETWORK_ERROR');
      setLoading(false);
      onErrorRef.current?.(errMsg, 'NETWORK_ERROR');
    };

    ws.onclose = () => {
      setLoading(false);
    };

    return () => {
      ws.close(1000, 'unsubscribe');
      wsRef.current = null;
    };
  }, [client, document, variables, wsEndpoint, shouldSubscribe]);

  return { data, loading, error, errorCode };
}
