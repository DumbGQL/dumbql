import { useState, useEffect, useRef } from 'react';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';
import { print } from '@dumbql/client';
import { useClient } from './provider';

export interface UseSubscriptionResult<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
}

interface GraphqlWsMessage<T = Record<string, unknown>> {
  type: 'next' | 'error' | 'complete';
  id?: string;
  payload?: { data?: T; errors?: { message: string }[] };
}

export function useSubscription<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
  options?: {
    wsEndpoint?: string;
    shouldSubscribe?: boolean;
  },
): UseSubscriptionResult<TData> {
  const client = useClient();
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const wsEndpoint =
    options?.wsEndpoint ??
    client.endpoint.replace(/^http/, 'ws');

  const shouldSubscribe = options?.shouldSubscribe ?? true;

  useEffect(() => {
    if (!shouldSubscribe) return;

    setLoading(true);
    setData(null);
    setError(null);

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
            setError(msg.payload.errors[0].message);
          } else if (msg.payload.data) {
            setData(msg.payload.data);
          }
          setLoading(false);
        } else if (msg.type === 'error') {
          const errMsg = msg.payload?.errors?.[0]?.message ?? 'Subscription error';
          setError(errMsg);
          setLoading(false);
        } else if (msg.type === 'complete') {
          setLoading(false);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setLoading(false);
    };

    ws.onclose = () => {
      setLoading(false);
    };

    return () => {
      ws.close(1000, 'unsubscribe');
      wsRef.current = null;
    };
  }, [client, document, variables, wsEndpoint, shouldSubscribe]);

  return { data, loading, error };
}
