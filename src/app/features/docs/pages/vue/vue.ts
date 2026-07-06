import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-vue',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './vue.html',
	styleUrl: './vue.scss',
})
export class DocsVue {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/vue');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/vue/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly tocSections: TocSection[] = [
   	{ id: 'quick-start', title: 'Quick Start' },
   	{ id: 'composables', title: 'Composables' },
   	{ id: 'fragments', title: 'Fragments' },
   	{ id: 'live-queries', title: 'Live Queries' },
   	{ id: 'pagination', title: 'Pagination' },
   	{ id: 'persisted-queries', title: 'Persisted Queries' },
   	{ id: 'rate-limit-gate', title: 'RateLimitGate' },
   	{ id: 'directives', title: 'Directives' },
   	{ id: 'reactive-val', title: 'Reactive Val' },
   	{ id: 'suspense-ssr', title: 'Suspense & SSR' },
   	{ id: 'testing', title: 'Testing' },
   	{ id: 'debugging', title: 'Debugging' },
   	{ id: 'opentelemetry', title: 'OpenTelemetry' },
   ];

  protected readonly apiEntries: ApiEntry[] = [
  	// ── Plugin ──
  	{ name: 'createDumbqlPlugin(client)', description: 'Vue plugin factory. Registers client globally. Usage: app.use(createDumbqlPlugin(client)).', type: 'function' },
  	{ name: 'useClient()', description: 'Returns DumbqlClient instance from composition API after plugin registration. Throws if plugin not installed.', type: 'composable' },

  	// ── useQuery ──
  	{ name: 'useQuery(document, options?)', description: 'Reactive query composable. All result fields are Vue refs. Supports pollInterval, skip, onCompleted, onError.', type: 'composable' },
  	{ name: 'UseQueryOptions', description: 'Options: { variables?, pollInterval?, skip?, onCompleted?, onError? }', type: 'interface' },
  	{ name: 'UseQueryOptions.variables', description: 'Query variables.', type: 'property' },
  	{ name: 'UseQueryOptions.pollInterval', description: 'Auto-poll interval in ms.', type: 'property' },
  	{ name: 'UseQueryOptions.skip', description: 'Skip the query on mount.', type: 'property', default: 'false' },
  	{ name: 'UseQueryOptions.onCompleted', description: 'Callback with data on success.', type: 'property' },
  	{ name: 'UseQueryOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseQueryResult', description: 'Result (all fields are Ref<T>): { data, loading, error, errorCode, networkStatus, called, refetch, fetchMore }', type: 'interface' },
  	{ name: 'UseQueryResult.data', description: 'Ref<TData | null> — response data.', type: 'property' },
  	{ name: 'UseQueryResult.loading', description: 'Ref<boolean> — true while in-flight.', type: 'property' },
  	{ name: 'UseQueryResult.error', description: 'Ref<string | null> — error message.', type: 'property' },
  	{ name: 'UseQueryResult.errorCode', description: 'Ref<ErrorCode | undefined>.', type: 'property' },
  	{ name: 'UseQueryResult.networkStatus', description: 'Ref<NetworkStatus> — loading | ready | error | refetching | poll.', type: 'property' },
  	{ name: 'UseQueryResult.called', description: 'Ref<boolean> — true once the query has fired.', type: 'property' },
  	{ name: 'UseQueryResult.refetch', description: '(vars?) => Promise<GraphQLResult> — re-execute the query.', type: 'property' },
  	{ name: 'UseQueryResult.fetchMore', description: '(merge, vars?) => Promise<GraphQLResult> — pagination helper.', type: 'property' },
  	{ name: 'NetworkStatus', description: 'Union type: loading | ready | error | refetching | poll.', type: 'type' },

  	// ── useMutation ──
  	{ name: 'useMutation(document, options?)', description: 'Returns { mutate, data, loading, error, errorCode, called } with all reactive refs. Supports optimistic updates via update option.', type: 'composable' },
   	{ name: 'UseMutationOptions', description: 'Options: { variables?, onCompleted?, onError?, update?, optimistic? }', type: 'interface' },
  	{ name: 'UseMutationOptions.variables', description: 'Default mutation variables.', type: 'property' },
  	{ name: 'UseMutationOptions.onCompleted', description: 'Callback with data on success.', type: 'property' },
  	{ name: 'UseMutationOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
   	{ name: 'UseMutationOptions.update', description: 'Cache write after mutation: update(cache, result).', type: 'property' },
   	{ name: 'UseMutationOptions.optimistic', description: 'Optimistic update callback: (cache) => string. Auto-committed on success, rolled back on error.', type: 'property' },
  	{ name: 'UseMutationResult', description: 'Result (all refs): { data, loading, error, errorCode, called, mutate }', type: 'interface' },
  	{ name: 'UseMutationResult.data', description: 'Ref<TData | null>.', type: 'property' },
  	{ name: 'UseMutationResult.loading', description: 'Ref<boolean> — true while in-flight.', type: 'property' },
  	{ name: 'UseMutationResult.error', description: 'Ref<string | null>.', type: 'property' },
  	{ name: 'UseMutationResult.errorCode', description: 'Ref<ErrorCode | undefined>.', type: 'property' },
  	{ name: 'UseMutationResult.called', description: 'Ref<boolean> — true once mutate has been called.', type: 'property' },
  	{ name: 'UseMutationResult.mutate', description: '(vars?) => Promise<GraphQLResult> — execute the mutation.', type: 'property' },
  	{ name: 'UseMutationFn', description: 'Mutate function signature: (variables?) => Promise<GraphQLResult<TData>>.', type: 'type' },

  	// ── useSubscription ──
  	{ name: 'useSubscription(document, options?)', description: 'Connects to a WebSocket subscription. All result fields are reactive refs.', type: 'composable' },
   	{ name: 'UseSubscriptionOptions', description: 'Options: { variables?, wsEndpoint?, shouldSubscribe?, reconnect?, reconnectInterval?, maxReconnects?, onNext?, onError?, onComplete? }', type: 'interface' },
  	{ name: 'UseSubscriptionOptions.variables', description: 'Subscription variables.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.wsEndpoint', description: 'WebSocket URL. Defaults to HTTP→WS transform of client endpoint.', type: 'property' },
   	{ name: 'UseSubscriptionOptions.shouldSubscribe', description: 'Conditionally enable/disable.', type: 'property', default: 'true' },
   	{ name: 'UseSubscriptionOptions.reconnect', description: 'Enable auto-reconnect with exponential backoff.', type: 'property', default: 'false' },
   	{ name: 'UseSubscriptionOptions.reconnectInterval', description: 'Base reconnect interval in ms.', type: 'property', default: '2000' },
   	{ name: 'UseSubscriptionOptions.maxReconnects', description: 'Max reconnect attempts before giving up.', type: 'property', default: '5' },
  	{ name: 'UseSubscriptionOptions.onNext', description: 'Callback with each new data payload.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseSubscriptionOptions.onComplete', description: 'Callback when the subscription completes.', type: 'property' },
  	{ name: 'UseSubscriptionResult', description: 'Result (all refs): { data, loading, error, errorCode }', type: 'interface' },
  	{ name: 'UseSubscriptionResult.data', description: 'Ref<TData | null>.', type: 'property' },
  	{ name: 'UseSubscriptionResult.loading', description: 'Ref<boolean>.', type: 'property' },
  	{ name: 'UseSubscriptionResult.error', description: 'Ref<string | null>.', type: 'property' },
  	{ name: 'UseSubscriptionResult.errorCode', description: 'Ref<ErrorCode | undefined>.', type: 'property' },

  	// ── useLiveQuery ──
  	{ name: 'useLiveQuery(document, options?)', description: 'Combines a one-shot query with a subscription for real-time updates. All result fields are reactive refs.', type: 'composable' },
  	{ name: 'UseLiveQueryOptions', description: 'Options: { variables?, wsEndpoint?, shouldSubscribe?, onCompleted?, onError? }', type: 'interface' },
  	{ name: 'UseLiveQueryOptions.variables', description: 'Query / subscription variables.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.wsEndpoint', description: 'WebSocket URL. Defaults to HTTP→WS transform.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.shouldSubscribe', description: 'Conditionally enable/disable the WS subscription.', type: 'property', default: 'true' },
  	{ name: 'UseLiveQueryOptions.onCompleted', description: 'Callback on query success or WS update.', type: 'property' },
  	{ name: 'UseLiveQueryOptions.onError', description: 'Callback with error string and optional errorCode.', type: 'property' },
  	{ name: 'UseLiveQueryResult', description: 'Result (all refs): { data, loading, error, errorCode }', type: 'interface' },
  	{ name: 'UseLiveQueryResult.data', description: 'Ref<TData | null>.', type: 'property' },
  	{ name: 'UseLiveQueryResult.loading', description: 'Ref<boolean>.', type: 'property' },
  	{ name: 'UseLiveQueryResult.error', description: 'Ref<string | null>.', type: 'property' },
  	{ name: 'UseLiveQueryResult.errorCode', description: 'Ref<ErrorCode | undefined>.', type: 'property' },

   	// ── useFragment ──
   	{ name: 'useFragment(fragment, identifier)', description: 'Reads a normalized cache entity by __typename + id. Returns { data, complete }.', type: 'composable' },
   	{ name: 'UseFragmentResult', description: 'Result: { data, complete }', type: 'interface' },
   	{ name: 'UseFragmentResult.data', description: 'Ref<TData | null> — entity data from cache.', type: 'property' },
   	{ name: 'UseFragmentResult.complete', description: 'boolean — true when the entity was found in cache.', type: 'property' },

   	// ── usePrefetch ──
   	{ name: 'usePrefetch(document)', description: 'Returns a (variables?) => Promise<GraphQLResult> prefetch function. Fires query ahead of navigation.', type: 'composable' },

   	// ── QueryRef / useBackgroundQuery / useReadQuery ──
   	{ name: 'useBackgroundQuery(document, variables?)', description: 'Returns QueryRef<TData> — kicks off a query and exposes reactive data/error/loading refs plus refetch.', type: 'composable' },
   	{ name: 'useReadQuery(queryRef)', description: 'Unwraps a QueryRef: returns { data } where data is the reactive Ref.', type: 'composable' },
   	{ name: 'QueryRef', description: 'Interface: { data: Ref, error: Ref, loading: Ref, refetch: () => Promise<GraphQLResult> }', type: 'interface' },
   	{ name: 'QueryRef.data', description: 'Ref<TData | null> — resolved query data.', type: 'property' },
   	{ name: 'QueryRef.error', description: 'Ref<string | null> — error message.', type: 'property' },
   	{ name: 'QueryRef.loading', description: 'Ref<boolean> — true while query is in-flight.', type: 'property' },
   	{ name: 'QueryRef.refetch', description: '(vars?) => Promise<GraphQLResult> — re-execute the query.', type: 'property' },

   	// ── RateLimitGate ──
   	{ name: 'RateLimitGate', description: 'Wrapper that shows countdown fallback when rate-limited. Slots: default, fallback.', type: 'component' },
   	{ name: 'RateLimitGateProps', description: 'Props: { isLimited, retryAfter?, onRetry?, error? }', type: 'interface' },
   	{ name: 'RateLimitGateProps.isLimited', description: 'Whether rate limit is currently exceeded.', type: 'property' },
   	{ name: 'RateLimitGateProps.retryAfter', description: 'Countdown duration in ms (default: 5000).', type: 'property' },
   	{ name: 'RateLimitGateProps.onRetry', description: 'Callback fired when countdown completes.', type: 'property' },
   	{ name: 'RateLimitGateProps.error', description: 'Optional error message to display in the default banner.', type: 'property' },

   	// ── Directives ──
   	{ name: 'registerDirectives(app, client)', description: 'Registers v-dql-mutate and v-dql-loading directives on an app instance. Called automatically by createDumbqlPlugin.', type: 'function' },
   	{ name: 'v-dql-mutate', description: 'Vue directive — triggers a mutation on click. Value: string (mutation) or { mutation, variables }.', type: 'directive' },
   	{ name: 'v-dql-loading', description: 'Vue directive — toggles .dql-loading CSS class based on boolean binding.', type: 'directive' },

   	// ── Suspense composables ──
  	{ name: 'useSuspenseQuery(document, variables?)', description: 'Suspense-aware query composable. Returns { data, error, loading, promise } refs. Pass promise to onServerPrefetch for SSR.', type: 'composable' },
  	{ name: 'UseSuspenseQueryResult', description: 'Result (all refs): { data, error, loading, promise }', type: 'interface' },
  	{ name: 'UseSuspenseQueryResult.data', description: 'Ref<TData | null>.', type: 'property' },
  	{ name: 'UseSuspenseQueryResult.error', description: 'Ref<string | null>.', type: 'property' },
  	{ name: 'UseSuspenseQueryResult.loading', description: 'Ref<boolean>.', type: 'property' },
  	{ name: 'UseSuspenseQueryResult.promise', description: 'Promise<TData | undefined> — await in onServerPrefetch for SSR hydration.', type: 'property' },
   	{ name: 'useBackgroundQuery(document, variables?)', description: 'Returns QueryRef<TData> — reactive query handle with data/error/loading refs and refetch.', type: 'composable' },

    // ── Re-exports from @dumbql/client ──
    { name: 'gql', description: 'Tagged template literal for parsing GraphQL documents.', type: 'function' },
    { name: 'isSuccess', description: 'Type guard: checks if GraphQLResult has status === "success".', type: 'function' },
    { name: 'isError', description: 'Type guard: checks if GraphQLResult has status === "error".', type: 'function' },
    { name: 'unwrap', description: 'Extracts data from a GraphQLResult or returns null on error.', type: 'function' },
    { name: 'unwrapOrThrow', description: 'Extracts data from a GraphQLResult or throws on error.', type: 'function' },

    // ── Val ──
    { name: 'useVal(initialValue)', description: 'Vue composable that returns a VueVal<T> — a Vue Ref<T> augmented with null-handling methods. Fully reactive.', type: 'composable' },
    { name: 'VueVal<T>', description: 'Extends Ref<T> with: nullify, isNull, isEmpty, reset, tap, swap, orElse, match.', type: 'interface' },
    { name: 'VueVal.nullify()', description: 'Sets value to null, returns previous value.', type: 'method' },
    { name: 'VueVal.isNull()', description: 'Returns true if value is null or undefined.', type: 'method' },
    { name: 'VueVal.isEmpty()', description: 'Returns true for null, undefined, empty string, or empty array.', type: 'method' },
    { name: 'VueVal.reset()', description: 'Resets to the initial value.', type: 'method' },
    { name: 'VueVal.tap(fn)', description: 'Transforms value in-place and returns this.', type: 'method' },
    { name: 'VueVal.swap(v)', description: 'Sets value to v and returns the previous value.', type: 'method' },
    { name: 'VueVal.orElse(fallback)', description: 'Returns value or fallback if null/undefined.', type: 'method' },
    { name: 'VueVal.match(onSome, onNone)', description: 'Runs onSome(value) if non-null, onNone() if null. Returns R.', type: 'method' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly quickStartCode = `<script setup>
import { createDumbqlPlugin, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql\`query Todos { todos { id title } }\`;
const { data, loading, error, refetch } = useQuery(GET_TODOS);
<\/script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error }}</p>
  <ul v-else>
    <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>`;

  protected readonly mutationCode = `const ADD_TODO = gql\`mutation AddTodo($title: String!) {
  addTodo(title: $title) { id title }
}\`;

const { mutate, data, loading, error } = useMutation(ADD_TODO);

function handleSubmit() {
  mutate({ title: 'New Todo' });
}`;

  protected readonly subscriptionCode = `const { data } = useSubscription(
  gql\`subscription OnMessage { messageAdded { content } }\`,
  { reconnect: true, reconnectInterval: 2000, maxReconnects: 5 },
);`;

  protected readonly fragmentCode = `import { useFragment, gql } from '@dumbql/vue';

const TODO_FIELDS = gql\`
  fragment TodoFields on Todo {
    id title completed
  }
\`;

const { data, complete } = useFragment(TODO_FIELDS, {
  __typename: 'Todo',
  id: props.todoId,
});`;

  protected readonly directiveCode = `<!-- v-dql-mutate: click to mutate -->
<button v-dql-mutate="{ mutation: 'mutation { like }', variables: { id: 1 } }">Like</button>

<!-- v-dql-loading: CSS class toggle -->
<div v-dql-loading="isLoading">Content</div>`;

  protected readonly valCode = `import { useVal } from '@dumbql/vue';

const count = useVal(0);
count.value; // reactive
count.set(5); // triggers reactivity

// Null-handling
const name = useVal<string | null>(null);
name.orElse('Guest'); // 'Guest'
name.match(
  (v) => \`Hello, \${v}\`,
  () => 'Hello, Guest',
);`;

  protected readonly liveQueryCode = `<script setup>
const { data, loading } = useLiveQuery(
  gql\`subscription { todoUpdated { id title } }\`,
  { wsEndpoint: 'wss://api.example.com/graphql' },
);
<\/script>

<template>
  <p v-if="loading">Waiting for updates…</p>
  <p v-else>{{ data?.title }}</p>
</template>`;

  protected readonly paginationCode = `const FEED_QUERY = gql\`
  query Feed(\$first: Int!, \$after: String) {
    feed(first: \$first, after: \$after) {
      edges { node { id title } }
      pageInfo { endCursor hasNextPage }
    }
  }
\`;

const { data, fetchMore } = useQuery(FEED_QUERY, { first: 10 });

function loadMore() {
  fetchMore({ after: data.value.feed.pageInfo.endCursor });
}`;

  protected readonly apqCode = `import { apqMiddleware } from '@dumbql/persisted-queries';
import { createClient } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middlewares: [apqMiddleware()],
});`;

  protected readonly ssrCode = `<script setup>
const { data, promise } = useSuspenseQuery(
  gql\`query { todos { id title } }\`,
);

// Vue will await this during SSR
onServerPrefetch(() => promise);
<\/script>

<template>
  <Suspense>
    <ul>
      <li v-for="todo in data?.todos" :key="todo.id">{{ todo.title }}</li>
    </ul>
  </Suspense>
</template>`;

  protected readonly testingCode = `import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createDumbqlPlugin } from '@dumbql/vue';
import { MockGraphqlService } from '@dumbql/testing';

const mockService = new MockGraphqlService();

function mountWithPlugin(component: any) {
  return mount(component, {
    global: { plugins: [createDumbqlPlugin(mockService as any)] },
  });
}`;

  protected readonly debuggingCode = `import { GraphqlDebugService } from '@dumbql/debugging';

const debugService = new GraphqlDebugService();
debugService.enable();

// Logged operations available via
const entries = debugService.getAll();`;

  protected readonly otelCode = `import { consoleExporter } from '@dumbql/opentelemetry';
import { setTracer, MinimalTracer } from '@dumbql/opentelemetry';

const tracer = new MinimalTracer({
  serviceName: 'my-vue-app',
  exporter: consoleExporter(),
});
setTracer(tracer);`;

  protected readonly pluginCode = `import { createApp } from 'vue';
import { createDumbqlPlugin } from '@dumbql/vue';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));
app.mount('#app');`;
}
