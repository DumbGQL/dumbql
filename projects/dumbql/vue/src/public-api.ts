export { createDumbqlPlugin, useClient, DUMBQL_CLIENT_KEY } from './lib/plugin';
export { useQuery, type UseQueryOptions, type UseQueryResult, type NetworkStatus } from './lib/use-query';
export { useMutation, type UseMutationOptions, type UseMutationResult, type UseMutationFn } from './lib/use-mutation';
export { useSubscription, type UseSubscriptionOptions, type UseSubscriptionResult } from './lib/use-subscription';
export { useLiveQuery, type UseLiveQueryOptions, type UseLiveQueryResult } from './lib/use-live-query';
export {
	useSuspenseQuery,
	useBackgroundQuery,
	useReadQuery,
	type UseSuspenseQueryResult,
	type QueryRef,
} from './lib/use-suspense-query';
export { gql, isSuccess, isError, unwrap, unwrapOrThrow } from '@dumbql/client';
export { useEpicFetus, type NullDetectionInfo } from './lib/use-epic-fetus';
export { NullOverlay } from './lib/null-overlay';

export { useFragment, type UseFragmentResult } from './lib/use-fragment';
export { usePrefetch } from './lib/use-prefetch';
export { RateLimitGate, type RateLimitGateProps } from './lib/rate-limit-gate';
export { useVal, type VueVal } from './lib/use-val';
export { registerDirectives } from './lib/directives';
