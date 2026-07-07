/**
 * Migration guide from Apollo Client to DumbQL.
 *
 * This function returns a mapping of common Apollo patterns to their DumbQL equivalents.
 */
export function createMigrationGuide(): Record<string, string> {
  return {
    ApolloClient: 'DumbqlClient (from @dumbql/client)',
    InMemoryCache: 'CacheStore (from @dumbql/cache)',
    'useQuery(query, { variables })': 'useQuery(query, { variables }) (from @dumbql/react or @dumbql/vue)',
    'useMutation(query, { variables, update, onCompleted, onError })':
      'useMutation(query, { variables, update, onCompleted, onError })',
    'useSubscription(query, { variables })': 'useSubscription(query, { variables })',
    'client.query({ query, variables })': 'client.query(query, variables)',
    'client.mutate({ mutation, variables })': 'client.mutate(document, variables)',
    'cache.readQuery({ query, variables })': 'cache.query(__typename, id)',
    'cache.writeQuery({ query, variables, data })': 'cache.write(entity)',
    'cache.evict({ id })': 'cache.evict(__typename, id)',
    'cache.gc()': 'cache.collectGarbage()',
    'makeVar(value)': 'makeVar(value) (from @dumbql/core)',
    '@client directives': 'clientDirectiveMiddleware() (from @dumbql/core)',
    ApolloProvider: 'DumbqlProvider (from @dumbql/react)',
    'Apollo Link': 'GraphqlMiddleware (from @dumbql/client)',
    errorPolicy: 'Config option in DumbqlClient / GraphqlService',
    fetchPolicy: 'Config option in DumbqlClient / GraphqlService',
    pollInterval: 'pollInterval in useQuery options',
    optimisticResponse: 'optimistic in mutate() options',
    refetchQueries: 'client.refetch() / useQuery().refetch()',
    subscribeToMore: 'useLiveQuery() (from @dumbql/react or @dumbql/vue)',
    'cache.modify': 'cache.merge()',
    'field policies': 'Not yet supported (use middleware)',
    'type policies': 'Not yet supported (use middleware)',
  };
}
