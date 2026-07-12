import { reactive, type UnwrapNestedRefs } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult, ErrorCode } from '@dumbql/client';
import type { CacheStore } from '@dumbql/cache';
import { useClient } from './plugin';

export interface UseReactiveMutationOptions<TData, TVariables> {
	readonly variables?: TVariables;
	readonly onCompleted?: (data: TData) => void;
	readonly onError?: (error: string, errorCode?: ErrorCode) => void;
	readonly update?: (cache: CacheStore, result: GraphQLResult<TData>) => void;
	readonly optimistic?: (cache: CacheStore) => string;
}

export interface UseReactiveMutationState<TData> {
	data: TData | null;
	error: string | null;
	errorCode: ErrorCode | undefined;
	status: 'idle' | 'loading' | 'success' | 'error';
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	isIdle: boolean;
	called: boolean;
}

export type UseReactiveMutationFn<TData, TVariables> = (variables?: TVariables) => Promise<GraphQLResult<TData>>;

export interface UseReactiveMutationResult<TData, TVariables>
	extends UnwrapNestedRefs<UseReactiveMutationState<TData>> {
	mutate: UseReactiveMutationFn<TData, TVariables>;
	$reset: () => void;
}

export function useReactiveMutation<
	TData,
	TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
	document: DocumentNode | TypedDocumentNode<TData, TVariables>,
	options?: UseReactiveMutationOptions<TData, TVariables>,
): UseReactiveMutationResult<TData, TVariables> {
	const client = useClient();

	const state = reactive<UseReactiveMutationState<TData>>({
		data: null,
		error: null,
		errorCode: undefined,
		status: 'idle',
		isLoading: false,
		isSuccess: false,
		isError: false,
		isIdle: true,
		called: false,
	});

	let optimisticId: string | undefined;

	const mutate: UseReactiveMutationFn<TData, TVariables> = async (variables?: TVariables) => {
		state.status = 'loading';
		state.isLoading = true;
		state.isIdle = false;
		state.called = true;
		state.error = null;
		state.errorCode = undefined;
		state.data = null;

		const cache = client.getCacheService();
		if (cache && options?.optimistic) {
			optimisticId = options.optimistic(cache);
		}

		const opts = options?.variables as TVariables | undefined;
		const result = await client.mutate<TData, TVariables>(document, variables ?? opts);

		if (result.status === 'success') {
			state.data = result.data;
			state.status = 'success';
			state.isSuccess = true;
			state.isError = false;
			state.isLoading = false;
			options?.onCompleted?.(result.data);
			if (cache && options?.update) {
				options.update(cache, result);
			}
			if (cache && optimisticId) {
				cache.commitOptimistic(optimisticId);
				optimisticId = undefined;
			}
		} else {
			state.error = result.error;
			state.errorCode = result.errorCode;
			state.status = 'error';
			state.isError = true;
			state.isSuccess = false;
			state.isLoading = false;
			options?.onError?.(result.error, result.errorCode);
			if (cache && optimisticId) {
				cache.rollbackOptimistic(optimisticId);
				optimisticId = undefined;
			}
		}

		return result;
	};

	const $reset = (): void => {
		state.data = null;
		state.error = null;
		state.errorCode = undefined;
		state.status = 'idle';
		state.isLoading = false;
		state.isSuccess = false;
		state.isError = false;
		state.isIdle = true;
		state.called = false;
	};

	return Object.assign(state, { mutate, $reset });
}
