import { reactive, onMounted, onUnmounted, watch, type UnwrapNestedRefs } from 'vue';
import type { DocumentNode, TypedDocumentNode, GraphQLResult, ErrorCode } from '@dumbql/client';
import { useClient } from './plugin';

export interface UseReactiveQueryOptions<TData, TVariables> {
	readonly variables?: TVariables;
	readonly pollInterval?: number;
	readonly skip?: boolean;
	readonly placeholderData?: TData;
	readonly initialData?: TData;
	readonly select?: (data: TData) => unknown;
	readonly onCompleted?: (data: TData) => void;
	readonly onError?: (error: string, errorCode?: ErrorCode) => void;
}

export type NetworkStatus = 'idle' | 'loading' | 'success' | 'error' | 'refetching' | 'poll';

export interface UseReactiveQueryState<TData> {
	data: TData | null;
	previousData: TData | null;
	error: string | null;
	errorCode: ErrorCode | undefined;
	status: NetworkStatus;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	isIdle: boolean;
	isRefetching: boolean;
	called: boolean;
}

export interface UseReactiveQueryResult<TData, TVariables extends Record<string, unknown>>
	extends UnwrapNestedRefs<UseReactiveQueryState<TData>> {
	refetch: (vars?: TVariables) => Promise<GraphQLResult<TData>>;
	fetchMore: (merge: (prev: TData, next: TData) => TData, vars?: TVariables) => Promise<GraphQLResult<TData>>;
	$reset: () => void;
}

export function useReactiveQuery<
	TData,
	TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
	document: DocumentNode | TypedDocumentNode<TData, TVariables>,
	options?: UseReactiveQueryOptions<TData, TVariables>,
): UseReactiveQueryResult<TData, TVariables> {
	const client = useClient();
	const variables = options?.variables;
	const pollInterval = options?.pollInterval;
	const skip = options?.skip ?? false;
	const onCompleted = options?.onCompleted;
	const onError = options?.onError;
	const select = options?.select;

	const state = reactive<UseReactiveQueryState<TData>>({
		data: options?.initialData ?? null,
		previousData: null,
		error: null,
		errorCode: undefined,
		status: skip ? 'idle' : 'loading',
		isLoading: !skip,
		isSuccess: false,
		isError: false,
		isIdle: skip,
		isRefetching: false,
		called: false,
	});

	const updateState = (result: GraphQLResult<TData>): void => {
		state.previousData = state.data;
		if (result.status === 'success') {
			const selected = select ? select(result.data) as TData : result.data;
			state.data = selected;
			state.error = null;
			state.errorCode = undefined;
			state.status = 'success';
			state.isSuccess = true;
			state.isError = false;
			state.isLoading = false;
			state.isRefetching = false;
			onCompleted?.(result.data);
		} else {
			state.error = result.error;
			state.errorCode = result.errorCode;
			state.status = 'error';
			state.isError = true;
			state.isSuccess = false;
			state.isLoading = false;
			state.isRefetching = false;
			onError?.(result.error, result.errorCode);
		}
	};

	let cancelled = false;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let lastVars = variables;

	const execute = async (vars?: TVariables, status?: NetworkStatus) => {
		if (skip) return;
		cancelled = false;
		state.status = status ?? 'loading';
		state.isLoading = true;
		state.isRefetching = status === 'refetching';
		state.called = true;
		lastVars = vars;

		const result = await client.query<TData, TVariables>(document, vars ?? variables);
		if (cancelled) return;
		updateState(result);
	};

	const refetch = async (vars?: TVariables) => {
		state.status = 'refetching';
		state.isRefetching = true;
		const result = await client.refetch<TData, TVariables>(document, (vars ?? lastVars) as TVariables);
		updateState(result);
		return result;
	};

	const fetchMore = async (merge: (prev: TData, next: TData) => TData, vars?: TVariables) => {
		state.status = 'refetching';
		state.isRefetching = true;
		const result = await client.query<TData, TVariables>(document, vars ?? lastVars);
		if (result.status === 'success' && state.data) {
			state.data = merge(state.data, result.data);
		}
		state.status = 'success';
		state.isRefetching = false;
		return result;
	};

	const $reset = (): void => {
		state.data = options?.initialData ?? null;
		state.previousData = null;
		state.error = null;
		state.errorCode = undefined;
		state.status = 'idle';
		state.isLoading = false;
		state.isSuccess = false;
		state.isError = false;
		state.isIdle = true;
		state.isRefetching = false;
		state.called = false;
	};

	onMounted(() => {
		if (!skip) {
			execute(variables);
		}
		if (pollInterval && pollInterval > 0 && !skip) {
			pollTimer = setInterval(async () => {
				const result = await client.query<TData, TVariables>(document, variables);
				updateState(result);
			}, pollInterval);
		}
	});

	watch(
		() => JSON.stringify(variables ?? {}),
		() => {
			if (!skip) execute(variables);
		},
	);

	onUnmounted(() => {
		cancelled = true;
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	});

	return Object.assign(state, { refetch, fetchMore, $reset });
}
