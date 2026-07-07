import { ref, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './plugin';

export interface UseSuspenseQueryResult<TData> {
  data: Ref<TData | null>;
  error: Ref<string | null>;
  loading: Ref<boolean>;
  promise: Promise<TData | undefined>;
}

export function useSuspenseQuery<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): UseSuspenseQueryResult<TData> {
  const client = useClient();
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const error = ref<string | null>(null);
  const loading = ref(true);

  const promise = client.query<TData, TVariables>(document, variables).then((result) => {
    loading.value = false;
    if (result.status === 'error') {
      error.value = result.error;
      return undefined;
    }
    data.value = result.data;
    return result.data;
  });

  return { data, error, loading, promise };
}

export interface QueryRef<TData> {
  data: Ref<TData | null>;
  error: Ref<string | null>;
  loading: Ref<boolean>;
  refetch: () => Promise<GraphQLResult<TData>>;
}

export function useBackgroundQuery<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): QueryRef<TData> {
  const client = useClient();
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const error = ref<string | null>(null);
  const loading = ref(true);

  loading.value = true;
  client.query<TData, TVariables>(document, variables).then((result) => {
    loading.value = false;
    if (result.status === 'error') {
      error.value = result.error;
      return;
    }
    data.value = result.data;
  });

  const refetch = async (vars?: TVariables): Promise<GraphQLResult<TData>> => {
    const result = await client.refetch<TData, TVariables>(document, (vars ?? variables) as TVariables);
    if (result.status === 'success') {
      data.value = result.data;
      error.value = null;
    } else {
      error.value = result.error;
    }
    return result;
  };

  return { data, error, loading, refetch };
}

export function useReadQuery<TData>(queryRef: QueryRef<TData>): { data: Ref<TData | null> } {
  return { data: queryRef.data };
}
