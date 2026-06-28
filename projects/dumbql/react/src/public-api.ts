// Provider & context
export { DumbqlProvider, useClient, useCache, type DumbqlProviderProps } from './lib/provider';

// Hooks
export { useQuery, type UseQueryResult } from './lib/use-query';
export { useMutation, type UseMutationResult, type UseMutationFn } from './lib/use-mutation';
export { useSubscription, type UseSubscriptionResult } from './lib/use-subscription';

// Components (render props)
export { Query, type QueryProps } from './lib/query';
export { Mutation, type MutationProps } from './lib/mutation';
export { Subscription, type SubscriptionProps } from './lib/subscription';

// Re-exports for convenience
export { gql, isSuccess, isError, unwrap, unwrapOrThrow, type GraphQLResult } from '@dumbql/client';
export { type CacheStore } from '@dumbql/cache';
