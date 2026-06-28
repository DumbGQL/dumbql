export { createDumbqlPlugin, useClient, DUMBQL_CLIENT_KEY } from './lib/plugin';
export { useQuery, type UseQueryResult } from './lib/use-query';
export { useMutation, type UseMutationResult, type UseMutationFn } from './lib/use-mutation';
export { useSubscription, type UseSubscriptionResult } from './lib/use-subscription';
export { gql, isSuccess, isError, unwrap, unwrapOrThrow } from '@dumbql/client';
