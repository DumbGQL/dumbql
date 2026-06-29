import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode, ErrorCode } from '@dumbql/client';
import { print } from '@dumbql/client';
import { useClient } from './plugin';

export interface UseSubscriptionOptions<TData> {
  variables?: Record<string, unknown>;
  wsEndpoint?: string;
  shouldSubscribe?: boolean;
  onNext?: (data: TData) => void;
  onError?: (error: string, errorCode?: ErrorCode) => void;
  onComplete?: () => void;
}

export interface UseSubscriptionResult<TData> {
  data: Ref<TData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  errorCode: Ref<ErrorCode | undefined>;
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
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const loading = ref(true);
  const error = ref<string | null>(null);
  const errorCode = ref<ErrorCode | undefined>(undefined);

  const wsEndpoint =
    options?.wsEndpoint ??
    client.endpoint.replace(/^http/, 'ws');

  const shouldSubscribe = options?.shouldSubscribe ?? true;
  const onNext = options?.onNext;
  const onError = options?.onError;
  const onComplete = options?.onComplete;

  let ws: WebSocket | null = null;

  onMounted(() => {
    if (!shouldSubscribe) return;

    loading.value = true;
    data.value = null;
    error.value = null;
    errorCode.value = undefined;

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
            const errMsg = msg.payload.errors[0].message;
            error.value = errMsg;
            errorCode.value = 'GRAPHQL_ERROR';
            onError?.(errMsg, 'GRAPHQL_ERROR');
          } else if (msg.payload.data) {
            data.value = msg.payload.data;
            onNext?.(msg.payload.data);
          }
          loading.value = false;
        } else if (msg.type === 'error') {
          const errMsg = msg.payload?.errors?.[0]?.message ?? 'Subscription error';
          error.value = errMsg;
          errorCode.value = 'GRAPHQL_ERROR';
          loading.value = false;
          onError?.(errMsg, 'GRAPHQL_ERROR');
        } else if (msg.type === 'complete') {
          loading.value = false;
          onComplete?.();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      const errMsg = 'WebSocket connection error';
      error.value = errMsg;
      errorCode.value = 'NETWORK_ERROR';
      loading.value = false;
      onError?.(errMsg, 'NETWORK_ERROR');
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

  return { data, loading, error, errorCode };
}
