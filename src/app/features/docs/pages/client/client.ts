import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-client',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './client.html',
	styleUrl: './client.scss',
})
export class DocsClient {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/client');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/client/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'quick-start', title: 'Quick Start' },
  	{ id: 'api', title: 'API' },
  	{ id: 'middleware', title: 'Middleware' },
  	{ id: 'cache', title: 'Cache Integration' },
  	{ id: 'streaming', title: 'Streaming' },
  	{ id: 'file-upload', title: 'File Upload' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'createClient(config, cache?)', description: 'Factory function that creates and returns a configured DumbqlClient instance. Accepts a ClientConfig and optional CacheStore.', type: 'function' },
  	{ name: 'DumbqlClient', description: 'Core client class for all GraphQL operations. Methods return Promise<GraphQLResult<T>>.', type: 'class' },
  	{ name: 'DumbqlClient.constructor', description: 'Creates a client with config and optional cache service.', type: 'constructor', default: 'config: ClientConfig, cache?: CacheStore' },
  	{ name: 'DumbqlClient.query(document, variables?, endpoint?)', description: 'Executes a GraphQL query. Supports dedup when config.dedup is enabled.', type: 'method' },
  	{ name: 'DumbqlClient.mutate(document, variables?, endpoint?)', description: 'Executes a GraphQL mutation. Supports file uploads and auto-invalidates cache on success.', type: 'method' },
  	{ name: 'DumbqlClient.refetch(document, variables?, endpoint?)', description: 'Bypasses dedup cache and re-fetches a query.', type: 'method' },
  	{ name: 'DumbqlClient.queryStream(document, variables?, endpoint?)', description: 'Returns an AsyncIterable for streaming (@defer/@stream) responses via multipart/mixed.', type: 'method' },
  	{ name: 'DumbqlClient.setEndpoint(url)', description: 'Changes the GraphQL endpoint URL at runtime.', type: 'method' },
  	{ name: 'DumbqlClient.endpoint', description: 'Current GraphQL endpoint URL.', type: 'property', default: '\'/graphql\'' },
  	{ name: 'DumbqlClient.getCacheService()', description: 'Returns the CacheStore instance or null if not provided.', type: 'method' },

  	// ── gql & Documents ──
  	{ name: 'gql`...`', description: 'Tagged template literal. Parses a GraphQL string into DocumentNode using graphql.parse().', type: 'function' },
  	{ name: 'print(document)', description: 'Serializes a DocumentNode back to a GraphQL string.', type: 'function' },
  	{ name: 'DocumentNode', description: 'Re-exported from graphql. AST representation of a parsed GraphQL document.', type: 'type' },
  	{ name: 'TypedDocumentNode<TResult, TVariables>', description: 'DocumentNode extended with phantom types for result and variables.', type: 'type' },

  	// ── Result Types ──
  	{ name: 'GraphQLResult<T>', description: 'Discriminated union: { status: "success", data } | { status: "error", error, errorCode?, graphQLErrors?, networkError? }.', type: 'type' },
  	{ name: 'GraphQLResponse<T>', description: 'Raw server response shape with optional data and errors.', type: 'type' },
  	{ name: 'GraphQLError', description: 'Single GraphQL error with message, locations, path, and extensions.', type: 'interface' },
  	{ name: 'NetworkErrorInfo', description: 'Network error details with message, status code, and status text.', type: 'interface' },
  	{ name: 'ErrorCode', description: 'Error code union: NO_DATA | GRAPHQL_ERROR | NETWORK_ERROR | VALIDATION_ERROR | UNKNOWN.', type: 'type' },

  	// ── Result Helpers ──
  	{ name: 'isSuccess(result)', description: 'Type guard that narrows GraphQLResult<T> to the success variant.', type: 'function' },
  	{ name: 'isError(result)', description: 'Type guard that narrows GraphQLResult<T> to the error variant.', type: 'function' },
  	{ name: 'unwrap(result)', description: 'Returns data if success, null otherwise.', type: 'function' },
  	{ name: 'unwrapOrThrow(result)', description: 'Returns data if success, throws Error on error status.', type: 'function' },
  	{ name: 'mapResult(result, fn)', description: 'Transforms data via fn on success, propagates error unchanged.', type: 'function' },
  	{ name: 'hasPartialErrors(result)', description: 'Returns true if result is success with non-empty graphQLErrors.', type: 'function' },
  	{ name: 'getGraphQLErrors(result)', description: 'Returns graphQLErrors array (empty if none).', type: 'function' },
  	{ name: 'getNetworkError(result)', description: 'Returns networkError if result is error, undefined otherwise.', type: 'function' },

  	// ── Middleware ──
  	{ name: 'GraphqlRequestContext', description: 'Middleware request context: query, variables, headers, type, endpoint, extensions, method, onTypenamesExtracted.', type: 'interface' },
  	{ name: 'GraphqlMiddleware', description: 'Middleware function: (request, next) => Promise<GraphQLResult<unknown>>.', type: 'type' },
  	{ name: 'GraphqlMiddlewareNext', description: 'Next handler in the async middleware chain.', type: 'type' },
  	{ name: 'applyMiddleware(middleware, final)', description: 'Composes middleware array into a single async pipeline using reduceRight.', type: 'function' },
  	{ name: 'authMiddleware(token, headerName?)', description: 'Attaches Authorization: Bearer header to requests.', type: 'function' },
  	{ name: 'loggingMiddleware(label?)', description: 'Logs each operation with type, query snippet, and duration.', type: 'function' },

    // ── Config Interfaces ──
    { name: 'DumbqlClientConfig', description: 'Alias for ClientConfig. Config interface for createClient: endpoint, url, headers, errorPolicy, retryCount, middleware, retryExchange, devAuth, onError, errorHandler, subscriptions, cache, persistedQueries.', type: 'type' },
    { name: 'CacheConfig', description: 'Cache config: enabled, maxAge, serialize, typePolicies, schema.', type: 'interface' },
    { name: 'SubscriptionsConfig', description: 'WebSocket config: wsEndpoint, reconnect, reconnectInterval, lazy.', type: 'interface' },
    { name: 'PersistedQueriesConfig', description: 'Persisted queries: enabled, hash, autoPersist, useGetForHashedQueries.', type: 'interface' },
    { name: 'RetryExchangeConfig', description: 'Retry config: maxRetries, initialDelay, maxDelay, exponent, jitter, shouldRetry.', type: 'interface' },
    { name: 'MiddlewareConfig', description: 'Middleware config: onError callback.', type: 'interface' },

    // ── Val ──
    { name: 'Val<T>', description: 'Generic value container with built-in null handling methods. Holds a value of type T and provides nullify(), isNull(), isEmpty(), reset(), peek(), tap(), swap(), orElse(), match() and toJSON().', type: 'class' },
    { name: 'Val.value', description: 'Get/set the contained value.', type: 'property' },
    { name: 'Val.nullify()', description: 'Sets the value to null and returns the previous value.', type: 'method' },
    { name: 'Val.isNull()', description: 'Returns true if the value is null or undefined.', type: 'method' },
    { name: 'Val.isEmpty()', description: 'Returns true for null, undefined, empty string, or empty array.', type: 'method' },
    { name: 'Val.reset()', description: 'Resets the value to the initial value passed to the constructor.', type: 'method' },
    { name: 'Val.peek()', description: 'Returns the value without triggering reactive tracking.', type: 'method' },
    { name: 'Val.tap(fn)', description: 'Transforms the value in-place via fn and returns this for chaining.', type: 'method' },
    { name: 'Val.swap(v)', description: 'Sets the value to v and returns the previous value.', type: 'method' },
    { name: 'Val.orElse(fallback)', description: 'Returns the value if not null, otherwise returns the fallback.', type: 'method' },
    { name: 'Val.match(onSome, onNone)', description: 'Pattern matches on null: calls onSome(value) if non-null, onNone() if null. Returns R.', type: 'method' },
    { name: 'Val.toJSON()', description: 'Returns the contained value for JSON serialization.', type: 'method' },
  ];

  protected readonly quickStartCode = `import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql\`query Todos { todos { id title } }\`;

const result = await client.query<{ todos: Todo[] }>(GET_TODOS);
if (isSuccess(result)) {
  console.log(result.data.todos);
}`;

  protected readonly middlewareCode = `import { createClient, authMiddleware, loggingMiddleware } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middleware: [
    authMiddleware('my-token'),
    loggingMiddleware('Todos'),
  ],
});`;

  protected readonly cacheCode = `import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const cache = createCache();
const client = createClient({
  endpoint: '/graphql',
}, cache);`;

  protected readonly streamingCode = `const stream = client.queryStream(gql\`query Stream { ... }\`);

for await (const part of stream) {
  if (isSuccess(part)) {
    console.log('incremental:', part.data);
  }
}`;

  protected readonly clientStarters: StarterCodes = {
    vanilla: `import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql\`{ todos { id title done } }\`;

async function loadTodos() {
  const result = await client.query(GET_TODOS);
  if (isSuccess(result)) {
    console.log(result.data.todos);
  }
}

const ADD_TODO = gql\`mutation Add($title: String!) { addTodo(title: $title) { id title } }\`;

async function addTodo(title: string) {
  const result = await client.mutate(ADD_TODO, { title });
  if (isSuccess(result)) {
    console.log('Created:', result.data.addTodo);
  }
}

loadTodos();
`,
    angular: `import { provideDumbql, GraphqlService, gql } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
  ],
};

@Component({ ... })
export class TodosComponent {
  private graphql = inject(GraphqlService);
  todos$ = this.graphql.query(gql\`{ todos { id title done } }\`);

  addTodo(title: string) {
    this.graphql.mutate(gql\`mutation Add($title: String!) {
      addTodo(title: $title) { id title }
    }\`, { title }).subscribe();
  }
}
`,
    react: `import { DumbqlProvider, useQuery, useMutation, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

function Todos() {
  const { data, loading } = useQuery(gql\`{ todos { id title done } }\`);
  const [addTodo] = useMutation(gql\`mutation Add($title: String!) {
    addTodo(title: $title) { id title }
  }\`);

  if (loading) return <p>Loading...</p>;
  return (
    <div>
      <ul>{data?.todos.map(t => <li key={t.id}>{t.title}</li>)}</ul>
      <button onClick={() => addTodo({ variables: { title: 'New' } })}>Add</button>
    </div>
  );
}

function App() {
  return <DumbqlProvider client={client}><Todos /></DumbqlProvider>;
}
`,
    vue: `import { createDumbqlPlugin, useQuery, useMutation, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const app = createApp(App);
app.use(createDumbqlPlugin(client));

<script setup lang="ts">
const { data, loading } = useQuery(gql\`{ todos { id title done } }\`);
const { mutate } = useMutation(gql\`mutation Add($title: String!) {
  addTodo(title: $title) { id title }
}\`);
</script>

<template>
  <p v-if="loading">Loading...</p>
  <ul v-else>
    <li v-for="todo in data?.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
  <button @click="mutate({ title: 'New' })">Add</button>
</template>
`,
  };
}
