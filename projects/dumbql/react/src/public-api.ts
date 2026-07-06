// Provider & context
export { DumbqlProvider, useClient, useCache, type DumbqlProviderProps } from './lib/provider';

// Hooks
export { useQuery, type UseQueryOptions, type UseQueryResult, type NetworkStatus } from './lib/use-query';
export { useMutation, type UseMutationOptions, type UseMutationResult, type UseMutationFn } from './lib/use-mutation';
export { useSubscription, type UseSubscriptionOptions, type UseSubscriptionResult } from './lib/use-subscription';
export { useLiveQuery, type UseLiveQueryOptions, type UseLiveQueryResult } from './lib/use-live-query';
export { useSuspenseQuery, useBackgroundQuery, useReadQuery, type QueryRef } from './lib/use-suspense-query';
export { useFragment, type UseFragmentResult } from './lib/use-fragment';
export { usePrefetch } from './lib/use-prefetch';
export { RateLimitGate, type RateLimitGateProps } from './lib/rate-limit-gate';

// Components (render props)
export { Query, type QueryProps } from './lib/query';
export { Mutation, type MutationProps } from './lib/mutation';
export { Subscription, type SubscriptionProps } from './lib/subscription';

// Re-exports for convenience
export { gql, isSuccess, isError, unwrap, unwrapOrThrow, type GraphQLResult } from '@dumbql/client';
export { type CacheStore } from '@dumbql/cache';

// Epic Fetus & Null Overlay
export { useEpicFetus, type NullDetectionInfo } from './lib/use-epic-fetus';
export { NullOverlay } from './lib/null-overlay';

// Val
export { useVal, type ReactVal } from './lib/use-smth-ref';
