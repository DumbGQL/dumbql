import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult } from '@dumbql/client';
import { useClient } from './plugin';

export interface UseQueryResult<TData, TVariables extends Record<string, unknown>> {
  data: Ref<TData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  refetch: (vars?: TVariables) => Promise<GraphQLResult<TData>>;
}

export function useQuery<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): UseQueryResult<TData, TVariables> {
  const client = useClient();
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  let cancelled = false;
  let lastVars = variables;

  const execute = async (vars?: TVariables) => {
    loading.value = true;
    error.value = null;
    data.value = null;
    lastVars = vars;

    const result = await client.query<TData, TVariables>(document, vars);
    if (cancelled) return;
    if (result.status === 'success') {
      data.value = result.data;
    } else {
      error.value = result.error;
    }
    loading.value = false;
  };

  onMounted(() => {
    execute(variables);
  });

  const refetch = async (vars?: TVariables) => {
    const result = await client.refetch<TData, TVariables>(document, (vars ?? lastVars) as TVariables);
    if (result.status === 'success') {
      data.value = result.data;
      error.value = null;
    } else {
      data.value = null;
      error.value = result.error;
    }
    return result;
  };

  onUnmounted(() => {
    cancelled = true;
  });

  return { data, loading, error, refetch };
}
