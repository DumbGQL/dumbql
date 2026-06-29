import { ref, type Ref } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult, ErrorCode } from '@dumbql/client';
import type { CacheStore } from '@dumbql/cache';
import { useClient } from './plugin';

export interface UseMutationOptions<TData, TVariables> {
  variables?: TVariables;
  onCompleted?: (data: TData) => void;
  onError?: (error: string, errorCode?: ErrorCode) => void;
  update?: (cache: CacheStore, result: GraphQLResult<TData>) => void;
}

export type UseMutationFn<TData, TVariables> = (
  variables?: TVariables,
) => Promise<GraphQLResult<TData>>;

export interface UseMutationResult<TData, TVariables> {
  data: Ref<TData | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  errorCode: Ref<ErrorCode | undefined>;
  called: Ref<boolean>;
  mutate: UseMutationFn<TData, TVariables>;
}

export function useMutation<TData, TVariables extends Record<string, unknown> = Record<string, unknown>>(
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: UseMutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
  const client = useClient();
  const data = ref<TData | null>(null) as Ref<TData | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const errorCode = ref<ErrorCode | undefined>(undefined);
  const called = ref(false);

  const mutate: UseMutationFn<TData, TVariables> = async (variables?: TVariables) => {
    loading.value = true;
    called.value = true;
    error.value = null;
    errorCode.value = undefined;
    data.value = null;

    const result = await client.mutate<TData, TVariables>(document, variables ?? (options?.variables as TVariables | undefined));

    if (result.status === 'success') {
      data.value = result.data;
      options?.onCompleted?.(result.data);
      if (options?.update) {
        const cache = client.getCacheService();
        if (cache) {
          options.update(cache, result);
        }
      }
    } else {
      error.value = result.error;
      errorCode.value = result.errorCode;
      options?.onError?.(result.error, result.errorCode);
    }

    loading.value = false;
    return result;
  };

  return { data, loading, error, errorCode, called, mutate };
}
