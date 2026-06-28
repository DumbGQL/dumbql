import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode } from '@dumbql/client';
import { print } from '@dumbql/client';
import { useClient } from './plugin';

export interface UseSubscriptionResult<TData> {
  data: Ref<TData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
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
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  const wsEndpoint =
    options?.wsEndpoint ??
    client.endpoint.replace(/^http/, 'ws');

  const shouldSubscribe = options?.shouldSubscribe ?? true;

  let ws: WebSocket | null = null;

  onMounted(() => {
    if (!shouldSubscribe) return;

    loading.value = true;
    data.value = null;
    error.value = null;

    const queryStr = print(document);
    ws = new WebSocket(wsEndpoint);

    ws.onopen = () => {
      const subscribeMsg = {
        type: 'subscribe',
        id: '1',
        payload: {
          query: queryStr,
          variables: variables ?? {},
        },
      };
      ws!.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as GraphqlWsMessage<TData>;
        if (msg.type === 'next' && msg.payload) {
          if (msg.payload.errors) {
            error.value = msg.payload.errors[0].message;
          } else if (msg.payload.data) {
            data.value = msg.payload.data;
          }
          loading.value = false;
        } else if (msg.type === 'error') {
          error.value = msg.payload?.errors?.[0]?.message ?? 'Subscription error';
          loading.value = false;
        } else if (msg.type === 'complete') {
          loading.value = false;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      error.value = 'WebSocket connection error';
      loading.value = false;
    };

    ws.onclose = () => {
      loading.value = false;
    };
  });

  onUnmounted(() => {
    if (ws) {
      ws.close(1000, 'unsubscribe');
      ws = null;
    }
  });

  return { data, loading, error };
}
