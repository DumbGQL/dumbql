import { ref, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './plugin';

export type UseMutationFn<TData, TVariables> = (
  variables?: TVariables,
) => Promise<GraphQLResult<TData>>;

export interface UseMutationResult<TData, TVariables> {
  data: Ref<TData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  mutate: UseMutationFn<TData, TVariables>;
}

export function useMutation<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
  const client = useClient();
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  const mutate: UseMutationFn<TData, TVariables> = async (variables?: TVariables) => {
    loading.value = true;
    error.value = null;
    data.value = null;

    const result = await client.mutate<TData, TVariables>(document, variables);
    if (result.status === 'success') {
      data.value = result.data;
    } else {
      error.value = result.error;
    }
    loading.value = false;
    return result;
  };

  return { data, loading, error, mutate };
}
