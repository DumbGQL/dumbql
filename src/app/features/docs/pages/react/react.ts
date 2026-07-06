import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-react',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './react.html',
	styleUrl: './react.scss',
})
export class DocsReact {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/react');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/react/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	// ── Provider & Context ──
  	{ name: 'DumbqlProvider', description: 'Context provider that injects client + optional cache into the React tree.', type: 'component' },
  	{ name: 'DumbqlProviderProps', description: 'Props: { client, cache?, children }', type: 'interface' },
  	{ name: 'DumbqlProviderProps.client', description: 'DumbqlClient instance.', type: 'property' },
  	{ name: 'DumbqlProviderProps.cache', description: 'Optional CacheStore instance.', type: 'property' },
  	{ name: 'DumbqlProviderProps.children', description: 'React sub-tree.', type: 'property' },
  	{ name: 'useClient()', description: 'Returns DumbqlClient from the nearest DumbqlProvider. Throws if missing.', type: 'hook' },
  	{ name: 'useCache()', description: 'Returns CacheStore | null from the nearest DumbqlProvider.', type: 'hook' },

  	// ── useQuery ──
  	{ name: 'useQuery(document, options?)', description: 'Reactive query hook. Executes on mount. Use fetchPolicy, pollInterval, skip, onCompleted, onError to control behaviour.', type: 'hook' },
  	{ name: 'UseQueryOptions', description: 'Options: { variables?, pollInterval?, skip?, onCompleted?, onError?, fetchPolicy? }', type: 'interface' },
  	{ name: 'UseQueryOptions.variables', description: 'Query variables.', type: 'property' },
  	{ name: 'UseQueryOptions.pollInterval', description: 'Auto-poll interval in ms.', type: 'property' },
  	{ name: 'UseQueryOptions.skip', description: 'Skip the query on mount.', type: 'property', default: 'false' },
  	{ name: 'UseQueryOptions.onCompleted', description: 'Callback with data on success.', type: 'property' },
  	{ name: 'UseQueryOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseQueryOptions.fetchPolicy', description: 'Cache-first, network-only, or no-cache.', type: 'property', default: '\'cache-first\'' },
  	{ name: 'UseQueryResult', description: 'Result: { data, loading, error, errorCode?, networkStatus, called, refetch, fetchMore }', type: 'interface' },
  	{ name: 'UseQueryResult.data', description: 'Response data or null.', type: 'property' },
  	{ name: 'UseQueryResult.loading', description: 'True while request is in-flight.', type: 'property' },
  	{ name: 'UseQueryResult.error', description: 'Error message string or null.', type: 'property' },
  	{ name: 'UseQueryResult.errorCode', description: 'Categorised error code.', type: 'property' },
  	{ name: 'UseQueryResult.networkStatus', description: 'loading | ready | error | refetching | poll.', type: 'property' },
  	{ name: 'UseQueryResult.called', description: 'True once the query has fired at least once.', type: 'property' },
  	{ name: 'UseQueryResult.refetch', description: 'Re-execute the query with optional new variables.', type: 'property' },
  	{ name: 'UseQueryResult.fetchMore', description: 'Merge pagination helper: fetchMore(mergeFn, vars?).', type: 'property' },
  	{ name: 'NetworkStatus', description: 'Union type: loading | ready | error | refetching | poll.', type: 'type' },

  	// ── useMutation ──
  	{ name: 'useMutation(document, options?)', description: 'Returns mutate function and reactive result. Supports optimistic cache updates via update option.', type: 'hook' },
  	{ name: 'UseMutationOptions', description: 'Options: { variables?, onCompleted?, onError?, update? }', type: 'interface' },
  	{ name: 'UseMutationOptions.variables', description: 'Default mutation variables.', type: 'property' },
  	{ name: 'UseMutationOptions.onCompleted', description: 'Callback with data on success.', type: 'property' },
  	{ name: 'UseMutationOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseMutationOptions.update', description: 'Optimistic cache update: update(cache, result).', type: 'property' },
  	{ name: 'UseMutationResult', description: 'Result: { data, loading, error, errorCode?, called, mutate }', type: 'interface' },
  	{ name: 'UseMutationResult.data', description: 'Response data or null.', type: 'property' },
  	{ name: 'UseMutationResult.loading', description: 'True while mutation is in-flight.', type: 'property' },
  	{ name: 'UseMutationResult.error', description: 'Error message string or null.', type: 'property' },
  	{ name: 'UseMutationResult.errorCode', description: 'Categorised error code.', type: 'property' },
  	{ name: 'UseMutationResult.called', description: 'True once mutate has been called.', type: 'property' },
  	{ name: 'UseMutationResult.mutate', description: 'Execute the mutation: mutate(vars?). Returns Promise<GraphQLResult>.', type: 'property' },
  	{ name: 'UseMutationFn', description: 'Mutate function signature: (variables?) => Promise<GraphQLResult<TData>>.', type: 'type' },

  	// ── useSubscription ──
  	{ name: 'useSubscription(document, options?)', description: 'Connects to a WebSocket subscription. Fires on mount, cleans up on unmount.', type: 'hook' },
  	{ name: 'UseSubscriptionOptions', description: 'Options: { variables?, wsEndpoint?, shouldSubscribe?, onNext?, onError?, onComplete? }', type: 'interface' },
  	{ name: 'UseSubscriptionOptions.variables', description: 'Subscription variables.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.wsEndpoint', description: 'WebSocket URL. Defaults to HTTP→WS transform of client endpoint.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.shouldSubscribe', description: 'Conditionally enable/disable the subscription.', type: 'property', default: 'true' },
  	{ name: 'UseSubscriptionOptions.onNext', description: 'Callback with each new data payload.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.onComplete', description: 'Callback when the subscription stream completes.', type: 'property' },
  	{ name: 'UseSubscriptionResult', description: 'Result: { data, loading, error, errorCode? }', type: 'interface' },
  	{ name: 'UseSubscriptionResult.data', description: 'Latest subscription data or null.', type: 'property' },
  	{ name: 'UseSubscriptionResult.loading', description: 'True while initial subscription is establishing.', type: 'property' },
  	{ name: 'UseSubscriptionResult.error', description: 'Error message string or null.', type: 'property' },
  	{ name: 'UseSubscriptionResult.errorCode', description: 'Categorised error code.', type: 'property' },

  	// ── useLiveQuery ──
  	{ name: 'useLiveQuery(document, options?)', description: 'Combines a one-shot query with a WebSocket subscription for real-time updates.', type: 'hook' },
  	{ name: 'UseLiveQueryOptions', description: 'Options: { variables?, wsEndpoint?, shouldSubscribe?, onCompleted?, onError? }', type: 'interface' },
  	{ name: 'UseLiveQueryOptions.variables', description: 'Query / subscription variables.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.wsEndpoint', description: 'WebSocket URL. Defaults to HTTP→WS transform of client endpoint.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.shouldSubscribe', description: 'Conditionally enable/disable the WS subscription.', type: 'property', default: 'true' },
  	{ name: 'UseLiveQueryOptions.onCompleted', description: 'Callback on query success or WS update.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseLiveQueryResult', description: 'Result: { data, loading, error, errorCode? }', type: 'interface' },
  	{ name: 'UseLiveQueryResult.data', description: 'Latest data from query or subscription.', type: 'property' },
  	{ name: 'UseLiveQueryResult.loading', description: 'True while initial query is in-flight.', type: 'property' },
  	{ name: 'UseLiveQueryResult.error', description: 'Error message string or null.', type: 'property' },
  	{ name: 'UseLiveQueryResult.errorCode', description: 'Categorised error code.', type: 'property' },

  	// ── useFragment ──
  	{ name: 'useFragment(fragment, identifier)', description: 'Subscribes to a normalized cache fragment by __typename and optional id. Returns { data, complete }.', type: 'hook' },
  	{ name: 'UseFragmentResult', description: 'Result: { data, complete }', type: 'interface' },
  	{ name: 'UseFragmentResult.data', description: 'Fragment data from cache or null.', type: 'property' },
  	{ name: 'UseFragmentResult.complete', description: 'True when the fragment was fully resolved from cache.', type: 'property' },

  	// ── usePrefetch ──
  	{ name: 'usePrefetch(document)', description: 'Fires a query ahead of navigation. Returns a prefetch(vars?) function that resolves once the query completes.', type: 'hook' },

  	// ── Suspense hooks ──
  	{ name: 'useSuspenseQuery(query, options?)', description: 'Suspense-powered query. Throws a promise until data is available. Returns fully resolved data (error thrown as exception).', type: 'hook' },
  	{ name: 'useBackgroundQuery(query, options?)', description: 'Starts fetching in a parent component. Returns a QueryRef tuple for useReadQuery.', type: 'hook' },
  	{ name: 'QueryRef', description: 'Object: { read(), refetch() } returned by useBackgroundQuery.', type: 'interface' },
  	{ name: 'QueryRef.read', description: 'Read resolved data. Throws promise if still loading or error if failed.', type: 'property' },
  	{ name: 'QueryRef.refetch', description: 'Re-execute the query and return a promise of GraphQLResult.', type: 'property' },
  	{ name: 'useReadQuery(queryRef)', description: 'Reads resolved data from a QueryRef created by useBackgroundQuery. Returns { data }.', type: 'hook' },

  	// ── Render-prop components ──
  	{ name: 'Query', description: 'Render-prop component for inline query execution.', type: 'component' },
  	{ name: 'QueryProps', description: 'Props: { document, variables?, pollInterval?, skip?, children }', type: 'interface' },
  	{ name: 'QueryProps.document', description: 'GraphQL document (gql`...`).', type: 'property' },
  	{ name: 'QueryProps.variables', description: 'Query variables.', type: 'property' },
  	{ name: 'QueryProps.pollInterval', description: 'Auto-poll interval in ms.', type: 'property' },
  	{ name: 'QueryProps.skip', description: 'Skip execution on mount.', type: 'property' },
  	{ name: 'QueryProps.children', description: 'Render function receiving UseQueryResult.', type: 'property' },
  	{ name: 'Mutation', description: 'Render-prop component for inline mutation execution.', type: 'component' },
  	{ name: 'MutationProps', description: 'Props: { document, variables?, update?, children }', type: 'interface' },
  	{ name: 'MutationProps.document', description: 'GraphQL document (gql`...`).', type: 'property' },
  	{ name: 'MutationProps.variables', description: 'Default mutation variables.', type: 'property' },
  	{ name: 'MutationProps.update', description: 'Local cache update callback: update(result).', type: 'property' },
  	{ name: 'MutationProps.children', description: 'Render function receiving (mutate, result).', type: 'property' },
  	{ name: 'Subscription', description: 'Render-prop component for inline subscription.', type: 'component' },
  	{ name: 'SubscriptionProps', description: 'Props: { document, variables?, wsEndpoint?, shouldSubscribe?, children }', type: 'interface' },
  	{ name: 'SubscriptionProps.document', description: 'GraphQL document (gql`...`).', type: 'property' },
  	{ name: 'SubscriptionProps.variables', description: 'Subscription variables.', type: 'property' },
  	{ name: 'SubscriptionProps.wsEndpoint', description: 'WebSocket URL.', type: 'property' },
  	{ name: 'SubscriptionProps.shouldSubscribe', description: 'Conditionally enable/disable.', type: 'property', default: 'true' },
  	{ name: 'SubscriptionProps.children', description: 'Render function receiving UseSubscriptionResult.', type: 'property' },

  	// ── RateLimitGate ──
  	{ name: 'RateLimitGate', description: 'Wrapper that shows fallback UI when rate-limited. Runs a countdown and fires onRetry when elapsed.', type: 'component' },
  	{ name: 'RateLimitGateProps', description: 'Props: { isLimited, children, fallback?, retryAfter?, onRetry?, error? }', type: 'interface' },
  	{ name: 'RateLimitGateProps.isLimited', description: 'Whether rate limit is currently exceeded.', type: 'property' },
  	{ name: 'RateLimitGateProps.children', description: 'Normal UI shown when not limited.', type: 'property' },
  	{ name: 'RateLimitGateProps.fallback', description: 'Custom fallback UI when rate limited (default: built-in banner).', type: 'property' },
  	{ name: 'RateLimitGateProps.retryAfter', description: 'Countdown duration in ms (default: 5000).', type: 'property' },
  	{ name: 'RateLimitGateProps.onRetry', description: 'Callback fired when the countdown completes.', type: 'property' },
  	{ name: 'RateLimitGateProps.error', description: 'Optional error message to display in the default banner.', type: 'property' },

    // ── Re-exports from @dumbql/client ──
    { name: 'gql', description: 'Tagged template literal for parsing GraphQL documents at build/run time.', type: 'function' },
    { name: 'isSuccess', description: 'Type guard: checks if a GraphQLResult has status === "success".', type: 'function' },
    { name: 'isError', description: 'Type guard: checks if a GraphQLResult has status === "error".', type: 'function' },
    { name: 'unwrap', description: 'Extracts data from a GraphQLResult or returns null on error.', type: 'function' },
    { name: 'unwrapOrThrow', description: 'Extracts data from a GraphQLResult or throws on error.', type: 'function' },
    { name: 'GraphQLResult', description: 'Result type: { status, data?, error?, errorCode? } from client operations.', type: 'type' },
    { name: 'CacheStore', description: 'Normalized cache interface from @dumbql/cache. Used by DumbqlProvider and useCache.', type: 'type' },

    // ── Val ──
    { name: 'useVal(initialValue)', description: 'React hook that returns a ReactVal<T> — a reactive value container with null-handling methods. Re-renders on mutation.', type: 'hook' },
    { name: 'ReactVal<T>', description: 'Interface: { value, set, update, nullify, isNull, isEmpty, reset, peek, tap, swap, orElse, match }', type: 'interface' },
    { name: 'ReactVal.value', description: 'Current value (reactive read).', type: 'property' },
    { name: 'ReactVal.set(v)', description: 'Sets the value and triggers re-render.', type: 'method' },
    { name: 'ReactVal.update(fn)', description: 'Updates the value via fn(prev) => next and triggers re-render.', type: 'method' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'quick-start', title: 'Quick Start' },
  	{ id: 'hooks', title: 'Hooks' },
  	{ id: 'fragments', title: 'Fragments' },
  	{ id: 'live-queries', title: 'Live Queries' },
  	{ id: 'pagination', title: 'Pagination' },
  	{ id: 'persisted-queries', title: 'Persisted Queries' },
  	{ id: 'suspense-ssr', title: 'Suspense & SSR' },
  	{ id: 'testing', title: 'Testing' },
  	{ id: 'debugging', title: 'Debugging' },
  	{ id: 'opentelemetry', title: 'OpenTelemetry' },
  	{ id: 'render-props', title: 'Render-prop Components' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly quickStartCode = `import { DumbqlProvider, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

const GET_TODOS = gql\`query Todos { todos { id title } }\`;

function Todos() {
  const { data, loading, error, refetch } = useQuery(GET_TODOS);

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {data.todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  );
}

function App() {
  return (
    <DumbqlProvider client={client} cache={cache}>
      <Todos />
    </DumbqlProvider>
  );
}`;

  protected readonly mutationCode = `const ADD_TODO = gql\`mutation AddTodo($title: String!) {
  addTodo(title: $title) { id title }
}\`;

function AddTodoForm() {
  const [mutate, { data, loading, error }] = useMutation(ADD_TODO);
  return <button onClick={() => mutate({ title: 'New' })}>Add</button>;
}`;

  protected readonly subscriptionCode = `const { data } = useSubscription(
  gql\`subscription OnMessage { messageAdded { content } }\`,
);`;

  protected readonly fragmentCode = `import { useFragment, gql } from '@dumbql/react';

const TODO_FIELDS = gql\`
  fragment TodoFields on Todo {
    id title completed
  }
\`;

function TodoItem({ todoId }: { todoId: string }) {
  const { data, complete } = useFragment(TODO_FIELDS, {
    __typename: 'Todo',
    id: todoId,
  });

  if (!complete) return <p>Loading fragment…</p>;
  return <p>{data.title}</p>;
}`;

  protected readonly liveQueryCode = `import { useLiveQuery, gql } from '@dumbql/react';

const { data, loading, error } = useLiveQuery(
  gql\`subscription { todoUpdated { id title } }\`,
  { wsEndpoint: 'wss://api.example.com/graphql' },
);`;

  protected readonly paginationCode = `import { useQuery, gql } from '@dumbql/react';
import { cursorPagination } from '@dumbql/pagination';

const FEED_QUERY = gql\`
  query Feed($first: Int!, $after: String) {
    feed(first: $first, after: $after) {
      edges { node { id title } }
      pageInfo { endCursor hasNextPage }
    }
  }
\`;

function Feed() {
  const { data, fetchMore } = useQuery(FEED_QUERY, {
    variables: { first: 10 },
  });

  return (
    <button onClick={() => fetchMore({
      variables: { after: data.feed.pageInfo.endCursor },
    })}>
      Load More
    </button>
  );
}`;

  protected readonly apqCode = `import { apqMiddleware } from '@dumbql/persisted-queries';
import { createClient } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [apqMiddleware()],
});`;

  protected readonly ssrCode = `import { useSuspenseQuery, usePrefetch, gql } from '@dumbql/react';

function TodoList() {
  const { data } = useSuspenseQuery(gql\`query { todos { id title } }\`);
  return <ul>{data.todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}

// Prefetch for route-level
function prefetch() {
  const prefetchQuery = usePrefetch(gql\`query { todos { id title } }\`);
  return prefetchQuery();
}`;

  protected readonly testingCode = `import { render, screen } from '@testing-library/react';
import { DumbqlProvider } from '@dumbql/react';
import { provideDumbqlTesting, MockGraphqlService } from '@dumbql/testing';

const mockService = new MockGraphqlService();

function renderWithProvider(ui: ReactElement) {
  return render(
    <DumbqlProvider client={mockService as any} cache={null}>
      {ui}
    </DumbqlProvider>
  );
}`;

  protected readonly debuggingCode = `import { GraphqlDebugService } from '@dumbql/debugging';

const debugService = new GraphqlDebugService();
debugService.enable();

// Access logged operations
const entries = debugService.getAll();`;

  protected readonly otelCode = `import { consoleExporter } from '@dumbql/opentelemetry';
import { setTracer, MinimalTracer } from '@dumbql/opentelemetry';

const tracer = new MinimalTracer({
  serviceName: 'my-app',
  exporter: consoleExporter(),
});
setTracer(tracer);`;

  protected readonly renderPropCode = `import { Query, Mutation, gql } from '@dumbql/react';

<Query document={gql\`query { todos { id title } }\`}>
  {({ data, loading }) => (
    <div>
      {loading ? <p>Loading…</p> : data.todos.map(t => <p key={t.id}>{t.title}</p>)}
    </div>
  )}
</Query>`;
}
