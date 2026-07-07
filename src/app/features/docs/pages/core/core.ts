import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { TuiNotification } from '@taiga-ui/core';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-core',
	standalone: true,
	imports: [TuiBadge, TuiNotification, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './core.html',
	styleUrl: './core.scss',
})
export class DocsCore {
	private readonly tocService = inject(TocService);

	protected readonly versionService = inject(VersionService);

	protected readonly packageSince = this.versionService.getPackageSince('@dumbql/core');

	protected selectedTabIndex = 0;

	protected readonly tabs = ['Docs', 'API'];

	protected readonly apiEntries: ApiEntry[] = [
		// ── Core Service ──
		{
			name: 'GraphqlService',
			description: 'Main injectable service for GraphQL operations. All methods return Observable<GraphQLResult<T>>.',
			type: 'class',
		},
		{
			name: 'GraphqlService.constructor',
			description: 'Injects DUMBQL_CONFIG, builds middleware pipeline. Throws if provideDumbql() not configured.',
			type: 'constructor',
			default: '—',
		},
		{
			name: 'GraphqlService.query(document, variables?, endpoint?)',
			description: 'Executes a GraphQL query. Dedup support when config.dedup is true.',
			type: 'method',
		},
		{
			name: 'GraphqlService.mutate(document, variables?, endpoint?, optimistic?)',
			description: 'Executes a GraphQL mutation. Supports file uploads and optimistic cache updates.',
			type: 'method',
		},
		{
			name: 'GraphqlService.refetch(document, variables?, endpoint?)',
			description: 'Bypasses dedup cache and re-fetches a query.',
			type: 'method',
		},
		{
			name: 'GraphqlService.poll(document, intervalMs, variables?, endpoint?)',
			description: 'Polls a query at the given interval using timer/switchMap.',
			type: 'method',
		},
		{
			name: 'GraphqlService.queryStream(document, variables?, endpoint?)',
			description: 'Executes a query with streaming support (@defer/@stream) using Fetch API multipart/mixed.',
			type: 'method',
		},
		{
			name: 'GraphqlService.setEndpoint(url)',
			description: 'Changes the GraphQL endpoint URL at runtime.',
			type: 'method',
		},
		{
			name: 'GraphqlService.endpoint',
			description: 'Current GraphQL endpoint URL.',
			type: 'property',
			default: '\'/graphql\'',
		},

		// ── Standalone Queries ──
		{
			name: 'query(document, variables?)',
			description:
				'Standalone query function. Must be called from an injection context. Returns a QueryHandle with result$, enabled signal, and refetch().',
			type: 'function',
		},
		{
			name: 'QueryHandle',
			description: 'Returned by query(). Provides result$ Observable, enabled WritableSignal, and refetch() trigger.',
			type: 'interface',
		},
		{ name: 'QueryHandle.result$', description: 'Observable stream of GraphQLResult<T>.', type: 'property' },
		{
			name: 'QueryHandle.enabled',
			description: 'WritableSignal<boolean> — set false to cancel in-flight requests.',
			type: 'property',
			default: 'true',
		},
		{ name: 'QueryHandle.refetch', description: 'Force re-execution of the query.', type: 'property' },
		{
			name: 'mutate(document, variables?, options?)',
			description: 'Standalone mutate function. Requires injection context. Options include optimistic cache updates.',
			type: 'function',
		},
		{
			name: 'MutateOptions',
			description: 'Options for standalone mutate: optional optimistic callback returning a unique ID.',
			type: 'interface',
		},
		{
			name: 'refetch(document, variables?)',
			description: 'Standalone refetch function. Bypasses dedup and re-fetches via GraphqlService.refetch().',
			type: 'function',
		},
		{
			name: 'poll(document, intervalMs, variables?)',
			description: 'Standalone poll function. Polls a query at the given interval using timer/switchMap.',
			type: 'function',
		},

		// ── Graphql Endpoint ──
		{
			name: 'GraphqlEndpoint',
			description: 'Scoped endpoint wrapper. Routes all calls to a specific GraphQL endpoint URL.',
			type: 'class',
		},
		{
			name: 'GraphqlEndpoint.constructor',
			description: 'Creates an endpoint bound to a specific URL.',
			type: 'constructor',
			default: 'graphql: GraphqlService, endpoint: string',
		},
		{
			name: 'GraphqlEndpoint.query(document, variables?)',
			description: 'Query against this endpoint.',
			type: 'method',
		},
		{
			name: 'GraphqlEndpoint.mutate(document, variables?, options?)',
			description: 'Mutate against this endpoint with optional optimistic update.',
			type: 'method',
		},
		{
			name: 'GraphqlEndpoint.refetch(document, variables?)',
			description: 'Refetch against this endpoint.',
			type: 'method',
		},
		{
			name: 'GraphqlEndpoint.poll(document, intervalMs, variables?)',
			description: 'Poll against this endpoint.',
			type: 'method',
		},
		{
			name: 'MutateEndpointOptions',
			description: 'Options for GraphqlEndpoint.mutate: optional optimistic callback.',
			type: 'interface',
		},
		{
			name: 'provideEndpoint(name, url)',
			description: 'Creates Angular providers for a named endpoint. Returns GraphqlEndpoint via injectEndpoint().',
			type: 'function',
		},
		{
			name: 'injectEndpoint(name)',
			description: 'Injects a previously provided named GraphqlEndpoint.',
			type: 'function',
		},

		// ── gql & Document Types ──
		{
			name: 'gql`...`',
			description:
				'Tagged template literal. Parses a GraphQL string into a DocumentNode at runtime using graphql.parse(). Supports interpolation for dynamic fragments.',
			type: 'function',
		},
		{
			name: 'print(document)',
			description: 'Re-exported from the graphql package. Serializes a DocumentNode back to a string.',
			type: 'function',
		},
		{
			name: 'createTypedQuery(query)',
			description: 'Creates a TypedQueryString without runtime parsing. Zero-cost abstraction for codegen output.',
			type: 'function',
		},
		{
			name: 'DocumentNode',
			description: 'Re-exported from graphql. AST representation of a parsed GraphQL document.',
			type: 'type',
		},
		{
			name: 'TypedDocumentNode<TResult, TVariables>',
			description: 'DocumentNode extended with phantom types for result and variables.',
			type: 'type',
		},
		{
			name: 'TypedQueryString<TResult, TVariables>',
			description:
				'Pre-serialized query string with phantom types. Skips runtime parse() — ideal for production bundles.',
			type: 'type',
		},
		{
			name: 'FragmentRef<TData, TName>',
			description: 'Fragment reference type for Relay-style fragment masking. Only the owning component can unmask it.',
			type: 'type',
		},

		// ── Result Types ──
		{
			name: 'GraphQLResult<T>',
			description:
				'Discriminated union: { status: "success", data } | { status: "error", error, errorCode?, graphQLErrors?, networkError? }.',
			type: 'type',
		},
		{
			name: 'GraphQLResponse<T>',
			description: 'Raw server response shape with optional data and errors.',
			type: 'type',
		},
		{
			name: 'GraphQLError',
			description: 'Single GraphQL error with message, locations, path, and extensions.',
			type: 'interface',
		},
		{
			name: 'NetworkErrorInfo',
			description: 'Network error details with message, status code, and status text.',
			type: 'interface',
		},
		{
			name: 'ErrorCode',
			description: 'Error code union: NO_DATA | GRAPHQL_ERROR | NETWORK_ERROR | VALIDATION_ERROR | UNKNOWN.',
			type: 'type',
		},

		// ── Result Helpers ──
		{
			name: 'isSuccess(result)',
			description: 'Type guard that narrows GraphQLResult<T> to the success variant.',
			type: 'function',
		},
		{
			name: 'isError(result)',
			description: 'Type guard that narrows GraphQLResult<T> to the error variant.',
			type: 'function',
		},
		{ name: 'unwrap(result)', description: 'Returns data if success, null otherwise.', type: 'function' },
		{
			name: 'unwrapOrThrow(result)',
			description: 'Returns data if success, throws Error otherwise.',
			type: 'function',
		},
		{
			name: 'mapResult(result, fn)',
			description: 'Transforms data via fn on success, propagates error unchanged.',
			type: 'function',
		},
		{
			name: 'hasPartialErrors(result)',
			description: 'Returns true if result is success with non-empty graphQLErrors.',
			type: 'function',
		},
		{ name: 'getGraphQLErrors(result)', description: 'Returns graphQLErrors array (empty if none).', type: 'function' },
		{
			name: 'getNetworkError(result)',
			description: 'Returns networkError if result is error, undefined otherwise.',
			type: 'function',
		},

		// ── Middleware ──
		{
			name: 'GraphqlRequestContext',
			description:
				'Middleware request context with query, variables, headers, type, endpoint, extensions, method, and onTypenamesExtracted.',
			type: 'interface',
		},
		{
			name: 'GraphqlMiddleware',
			description:
				'Middleware function signature: (request: GraphqlRequestContext, next: GraphqlMiddlewareNext) => Observable<GraphQLResult<unknown>>.',
			type: 'type',
		},
		{ name: 'GraphqlMiddlewareNext', description: 'Next handler in the middleware chain.', type: 'type' },
		{
			name: 'applyMiddleware(middleware, final)',
			description: 'Composes an array of middleware into a single pipeline using reduceRight.',
			type: 'function',
		},
		{
			name: 'authMiddleware(token, headerName?)',
			description: 'Attaches Authorization: Bearer header. Auto-prepends Bearer if missing.',
			type: 'function',
		},
		{
			name: 'devAuthMiddleware(token?)',
			description: 'Development auth middleware. Falls back to localStorage dev_token or "dev-token".',
			type: 'function',
		},
		{
			name: 'loggingMiddleware(label?)',
			description: 'Logs each operation with type, query snippet, and duration in ms.',
			type: 'function',
		},
		{
			name: 'hasFiles(value)',
			description: 'Checks if a value recursively contains File or Blob instances for upload detection.',
			type: 'function',
		},

		// ── Configuration Interfaces ──
		{
			name: 'DumbqlConfig',
			description:
				'Unified configuration extending GraphqlCoreConfig with all sub-configs (cache, subscriptions, upload, etc.) and DumbqlPlugin[] support.',
			type: 'interface',
		},
		{
			name: 'GraphqlCoreConfig',
			description:
				'Core config: endpoint, url, headers, errorPolicy, showErrorsOnSuccess, retryCount, retryDelay, dedup, batchWindow, middleware, retryExchange, devAuth, onError, errorHandler.',
			type: 'interface',
		},
		{ name: 'GraphqlConfig', description: 'Deprecated alias for DumbqlConfig.', type: 'interface' },
		{
			name: 'DumbqlPlugin',
			description: 'Plugin interface with name, optional onInit(client), and optional getMiddleware().',
			type: 'interface',
		},
		{
			name: 'OnErrorServiceConfig',
			description: 'Service-based error notification: provide token and use(service, error) callback.',
			type: 'interface',
		},
		{
			name: 'RetryExchangeConfig',
			description: 'Retry config: maxRetries, initialDelay, maxDelay, exponent, jitter, shouldRetry.',
			type: 'interface',
		},
		{
			name: 'SubscriptionsConfig',
			description: 'WebSocket subscriptions config: wsEndpoint, reconnect, reconnectInterval, lazy.',
			type: 'interface',
		},
		{
			name: 'CacheConfig',
			description: 'Normalized cache config: enabled, maxAge, serialize, typePolicies, schema.',
			type: 'interface',
		},
		{
			name: 'PersistedQueriesConfig',
			description: 'Persisted queries config: enabled, hash (sha256|simple), autoPersist, useGetForHashedQueries.',
			type: 'interface',
		},
		{ name: 'UploadConfig', description: 'File upload config: maxFiles, maxFileSize.', type: 'interface' },
		{
			name: 'DebugConfig',
			description: 'Debug logging config: logOperations, logTiming, logCache.',
			type: 'interface',
		},
		{ name: 'PaginationConfig', description: 'Pagination config: defaultLimit, debounceMs.', type: 'interface' },
		{ name: 'SsrConfig', description: 'SSR config: transferState, cacheTtl.', type: 'interface' },
		{ name: 'TestingConfig', description: 'Testing config: enabled.', type: 'interface' },
		{
			name: 'TelemetryConfig',
			description: 'Telemetry/OpenTelemetry config: enabled, tracing, tags.',
			type: 'interface',
		},
		{
			name: 'CodegenConfig',
			description: 'Codegen CLI config (runtime ignored): schema and types settings.',
			type: 'interface',
		},
		{ name: 'SchemaConfig', description: 'Schema config: inline data, url, custom headers.', type: 'interface' },

		// ── Providers & Tokens ──
		{
			name: 'provideGraphql(config)',
			description:
				'Primary provider function. Accepts Partial<DumbqlConfig>, sets defaults (endpoint: "/graphql", devAuth enabled).',
			type: 'function',
		},
		{ name: 'provideDumbql(config)', description: 'Alias for provideGraphql().', type: 'function' },
		{ name: 'DUMBQL_CONFIG', description: 'InjectionToken<DumbqlConfig> for the unified config.', type: 'type' },
		{ name: 'GRAPHQL_CONFIG', description: 'Deprecated alias for DUMBQL_CONFIG.', type: 'type' },

		// ── Config Service ──
		{
			name: 'DumbqlConfigService',
			description:
				'Injectable service that exposes typed sub-configs (core, cache, subscriptions, etc.) with defaults.',
			type: 'class',
		},
		{ name: 'DumbqlConfigService.all', description: 'Returns the full DumbqlConfig object.', type: 'property' },
		{
			name: 'DumbqlConfigService.core',
			description: 'Returns GraphqlCoreConfig with default fallbacks.',
			type: 'property',
		},
		{ name: 'DumbqlConfigService.cache', description: 'Returns CacheConfig (empty object default).', type: 'property' },
		{
			name: 'DumbqlConfigService.subscriptions',
			description: 'Returns SubscriptionsConfig (empty object default).',
			type: 'property',
		},
		{
			name: 'DumbqlConfigService.persistedQueries',
			description: 'Returns PersistedQueriesConfig (empty object default).',
			type: 'property',
		},
		{
			name: 'DumbqlConfigService.upload',
			description: 'Returns UploadConfig (empty object default).',
			type: 'property',
		},
		{
			name: 'DumbqlConfigService.debug',
			description: 'Returns DebugConfig. Handles boolean shortcut.',
			type: 'property',
		},
		{
			name: 'DumbqlConfigService.pagination',
			description: 'Returns PaginationConfig (empty object default).',
			type: 'property',
		},
		{ name: 'DumbqlConfigService.ssr', description: 'Returns SsrConfig (empty object default).', type: 'property' },
		{
			name: 'DumbqlConfigService.devtools',
			description: 'Returns DevtoolsConfig. Handles boolean shortcut.',
			type: 'property',
		},
		{
			name: 'DumbqlConfigService.isDevtoolsEnabled',
			description: 'True if devtools config is enabled.',
			type: 'property',
		},
		{ name: 'DumbqlConfigService.isDebugEnabled', description: 'True if debug config is enabled.', type: 'property' },

		// ── Cache Integration ──
		{
			name: 'GraphqlCacheLike',
			description:
				'Interface for the cache service used internally. Methods: merge, readLocal, writeLocalWithTypes, clearLocalStateByTypes, setTypePolicies, applyOptimistic, commitOptimistic, rollbackOptimistic.',
			type: 'interface',
		},
		{
			name: 'GRAPHQL_CACHE',
			description: 'InjectionToken<GraphqlCacheLike> for the cache service. Provided by @dumbql/cache/angular.',
			type: 'type',
		},
		{
			name: 'cacheMiddleware(injector?)',
			description: 'Middleware that reads/writes normalized cache. Supports stale-while-revalidate via maxAge.',
			type: 'function',
		},
		{
			name: 'mutationCachePolicy(injector?)',
			description: 'Middleware that clears cached queries by typename after mutation success.',
			type: 'function',
		},
		{
			name: 'provideAutoRefetch()',
			description: 'Provider that registers AutoRefetchService as an ENVIRONMENT_INITIALIZER.',
			type: 'function',
		},
		{
			name: 'AutoRefetchService',
			description: 'Injectable service for auto-refetch support (clearRegistry kept for API compat).',
			type: 'class',
		},

		// ── Reactive Variables ──
		{
			name: 'ReactiveVar<T>',
			description: 'Reactive variable backed by BehaviorSubject. Triggers consuming queries to refetch on update.',
			type: 'class',
		},
		{
			name: 'ReactiveVar.constructor',
			description: 'Creates a ReactiveVar with the initial value.',
			type: 'constructor',
			default: 'initialValue: T',
		},
		{ name: 'ReactiveVar.get()', description: 'Returns the current value synchronously.', type: 'method' },
		{ name: 'ReactiveVar.set(value)', description: 'Updates the value and notifies watchers.', type: 'method' },
		{
			name: 'ReactiveVar.update(fn)',
			description: 'Updates via callback (like React setState): fn(prev) => next.',
			type: 'method',
		},
		{
			name: 'ReactiveVar.watch()',
			description: 'Returns an Observable<T> that emits current and future values.',
			type: 'method',
		},
		{
			name: 'makeVar(initialValue)',
			description: 'Factory function that creates and returns a new ReactiveVar instance.',
			type: 'function',
		},

		// ── Pipes ──
		{
			name: 'GqlPipe',
			description: 'Pure pipe `gql` — parses a GraphQL string into DocumentNode using graphql.parse().',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlDataPipe',
			description: 'Pure pipe `graphqlData` — extracts data from a successful GraphQLResult, returns null otherwise.',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlErrorPipe',
			description:
				'Pure pipe `graphqlError` — extracts error string from an error GraphQLResult, returns null otherwise.',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlStatusPipe',
			description: 'Pure pipe `graphqlStatus` — returns "success", "error", or null from a GraphQLResult.',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlIsSuccessPipe',
			description: 'Pure pipe `graphqlIsSuccess` — returns true if result status is "success".',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlIsErrorPipe',
			description: 'Pure pipe `graphqlIsError` — returns true if result status is "error".',
			type: 'pipe',
			default: 'pure: true',
		},
		{
			name: 'GraphqlUnwrapPipe',
			description: 'Pure pipe `graphqlUnwrap` — extracts data from success, returns null otherwise.',
			type: 'pipe',
			default: 'pure: true',
		},

		// ── Directives ──
		{
			name: 'DumbqlQueryDirective',
			description:
				'Structural directive `[dumbqlQuery]` — executes a query and provides template context with result, loading, error, and refetch.',
			type: 'directive',
			default: 'selector: [dumbqlQuery], standalone: true',
		},
		{
			name: 'DumbqlQueryContext<T>',
			description: 'Template context for DumbqlQueryDirective: $implicit, result, loading, error, refetch.',
			type: 'interface',
		},
		{
			name: 'DumbqlAutoFetchDirective',
			description:
				'Attribute directive `[dumbqlAutoFetch]` — auto-polls a query at the configured interval (default 30s).',
			type: 'directive',
			default: 'selector: [dumbqlAutoFetch], standalone: true',
		},

		// ── Client Directive Middleware ──
		{
			name: 'clientDirectiveMiddleware()',
			description:
				'Middleware that intercepts @client fields. Resolves local-only queries without network and patches mixed results.',
			type: 'function',
		},

		// ── Resource ──
		{
			name: 'graphqlResource(options)',
			description:
				'Angular resource() wrapper. Returns a ResourceRef that fetches via GraphqlService.query() with abort support.',
			type: 'function',
		},
		{
			name: 'GraphqlResourceOptions<TData, TVariables>',
			description: 'Options for graphqlResource: client, query, params, id, defaultValue.',
			type: 'interface',
		},

		// ── Streaming ──
		{
			name: 'streamingMiddleware()',
			description:
				'Middleware that handles @defer/@stream incremental delivery. Emits updated results for each incremental patch.',
			type: 'function',
		},
		{
			name: 'IncrementalPayload',
			description: 'Streaming patch payload with data, path, errors, items, label, extensions.',
			type: 'interface',
		},
		{
			name: 'IncrementalResponse<T>',
			description: 'Streaming response shape with optional data, errors, incremental[], and hasNext.',
			type: 'interface',
		},
		{
			name: 'applyPatch(data, path, value)',
			description: 'Applies an incremental patch to data by path (structuredClone under the hood).',
			type: 'function',
		},
		{
			name: 'applyStreamItems(data, path, items)',
			description: 'Appends @stream items to an array at the given path in data.',
			type: 'function',
		},
		{
			name: 'parseMultipartResponse(body, boundary)',
			description: 'Parses a multipart/mixed response body into individual JSON chunks as an Observable.',
			type: 'function',
		},

		// ── Router ──
		{
			name: 'provideDumbqlRouter(routes, guards)',
			description: 'Provider function that registers routes with a named guard map. Wraps provideRouter().',
			type: 'function',
		},
		{
			name: 'guardedRoute(keys, route)',
			description: 'Wraps a Route with canActivate guards resolved by key from the guard map.',
			type: 'function',
		},
		{
			name: 'canActivateWithGuards(...guardKeys)',
			description: 'Creates a CanActivateFn that resolves guards by key from the injected ROUTE_GUARD_MAP.',
			type: 'function',
		},
		{
			name: 'DumbqlRouteGuard',
			description: 'Route guard type: () => boolean | Observable<boolean> | Promise<boolean>.',
			type: 'type',
		},

		// ── Devtools ──
		{
			name: 'DevtoolsService',
			description: 'Injectable service that connects to the DumbQL Devtools browser extension via postMessage.',
			type: 'class',
		},
		{ name: 'DevtoolsService.devtoolsConfig', description: 'Returns the resolved DevtoolsConfig.', type: 'property' },
		{
			name: 'DevtoolsService.connect()',
			description: 'Starts listening for devtools extension handshake and sends stored requests.',
			type: 'method',
		},
		{ name: 'DevtoolsService.disconnect()', description: 'Stops listening for devtools messages.', type: 'method' },
		{
			name: 'provideDevtools(config?)',
			description: 'Provider that configures and initializes DevtoolsService.',
			type: 'function',
		},
		{
			name: 'devtoolsMiddleware(config?)',
			description:
				'Middleware that captures request/response for the Devtools extension. Stores up to 500 entries in localStorage.',
			type: 'function',
		},
		{
			name: 'DevtoolsConfig',
			description: 'Devtools config: autoConnect, maxRequests, captureSchema, endpoint, schemaDownload.',
			type: 'interface',
		},
		{
			name: 'SchemaDownloadConfig',
			description: 'Schema download config: endpoint, headers, format (json|sdl).',
			type: 'interface',
		},
		{ name: 'DEVTOLS_CONFIG', description: 'InjectionToken for DevtoolsConfig.', type: 'type' },

		// ── Schema ──
		{
			name: 'SchemaService',
			description: 'Injectable service that fetches and caches the GraphQL schema via introspection query.',
			type: 'class',
		},
		{
			name: 'SchemaService.load()',
			description: 'Returns Observable<Record<string, unknown> | null> with cached schema data.',
			type: 'method',
		},
		{
			name: 'SchemaService.setCache(data)',
			description: 'Static method to pre-populate the schema cache.',
			type: 'function',
		},
		{ name: 'SchemaServiceConfig', description: 'Schema service config: url, headers.', type: 'interface' },
		{
			name: 'provideSchemaFetch(config?)',
			description: 'Provider that configures SchemaService and triggers auto-load on app init.',
			type: 'function',
		},
		{ name: 'SCHEMA_SERVICE_CONFIG', description: 'InjectionToken for SchemaServiceConfig.', type: 'type' },

		// ── Val ──
		{
			name: 'createVal(initialValue)',
			description:
				'Creates an AngularVal<T> — a WritableSignal augmented with null-handling methods. Methods: nullify(), isNull(), isEmpty(), reset(), peek(), tap(), swap(), orElse(), match().',
			type: 'function',
		},
		{
			name: 'AngularVal<T>',
			description: 'WritableSignal<T> extras: nullify, isNull, isEmpty, reset, peek, tap, swap, orElse, match.',
			type: 'interface',
		},
	];

	protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/core/src/lib';

	protected readonly graphqlServiceCode = `const posts = this.graphql.query(
  gql\`query Posts { posts { id title } }\`,
); // → Signal<Post[]>

const mutation = this.graphql.mutate(
  gql\`mutation CreatePost($input: PostInput!) {
    createPost(input: $input) { id title }
  }\`,
); // → MutationRef<Post>`;

	protected readonly mutationCode = `const createPost = this.graphql.mutate(
  gql\`mutation CreatePost($input: PostInput!) {
    createPost(input: $input) { id title }
  }\`,
);

// trigger when ready
createPost.mutate({ input: { title: 'Hello' } });`;

	protected readonly refetchCode = `service.refetch(GET_CURRENT_USER).subscribe((r) => {
  console.log('Refetched:', r);
});`;

	protected readonly middlewareCode = `import { authRefreshMiddleware } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefreshMiddleware({ refreshToken: () => inject(AuthService).token() }),
  createHttpLink({ uri: '/graphql' }),
);`;

	protected readonly standaloneCode = `import { executeQuery, buildRequest, parseResult } from '@dumbql/core';

const request = buildRequest(gql\`query { ping }\`);
const result = await executeQuery({ uri: '/graphql' }, request);`;

	protected readonly standaloneInjectCode = `import { query, mutate } from '@dumbql/core';

// Must be called from an injection context (component, directive, service, or TestBed.runInInjectionContext)
const result = query(gql\`query Books { books { id title } }\`);
// → Observable<GraphQLResult<{ books: Book[] }>>

const mutationResult = mutate(gql\`mutation LikePost($id: ID!) { likePost(id: $id) { likes } }\`);
// → Observable<GraphQLResult<{ likePost: Post }>>`;

	protected readonly gqlTagCode = `const BOOKS_QUERY = gql\`query Books {
  books { id title author { name } }
}\`;`;

	protected readonly reactiveVarCode = `const isAuthenticated = createReactiveVar(false);

// Update triggers all consuming queries to refetch
isAuthenticated.set(true);`;

	protected readonly clientDirectiveCode = `<div *dqlClient="let data = query(gql\`query { isLoggedIn @client }\`)">
  {{ data?.isLoggedIn ? 'Logged in' : 'Guest' }}
</div>`;

	protected readonly configurationCode = `export interface DumbqlCoreConfig {
  link: Link;
  routerRefetch?: boolean;
  defaultContext?: Record<string, unknown>;
  retryOnError?: boolean;
}`;

	protected readonly provideGraphqlCode = `import { provideGraphql } from '@dumbql/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGraphql({ endpoint: '/graphql' }),
  ],
};`;

	protected readonly pluginCode = `import { provideGraphql } from '@dumbql/core';

const loggingPlugin = {
  name: 'LoggingPlugin',
  onInit() { console.log('GraphQL initialized'); },
  getMiddleware() {
    return (request, next) => {
      console.log('Request:', request);
      return next(request);
    };
  },
};

provideGraphql({
  endpoint: '/graphql',
  plugins: [loggingPlugin],
});`;

	protected readonly appQueriesCode = `import { gql } from '@dumbql/core';

export const GET_CURRENT_USER = gql\`query GetCurrentUser {
  getCurrentUser { id username createdAt }
}\`;

export const GET_NOTES = gql\`query GetNotes($filter: NoteType) {
  getNotes(filter: $filter) { id title content noteType }
}\`;`;

	protected readonly tocSections: TocSection[] = [
		{ id: 'dumbqlcore', title: '@dumbql/core' },
		{ id: 'installation', title: 'Installation' },
		{
			id: 'graphqlservice',
			title: 'GraphqlService',
			children: [
				{ id: 'query', title: 'Query' },
				{ id: 'mutation', title: 'Mutation' },
				{ id: 'refetch', title: 'Refetch' },
			],
		},
		{
			id: 'middleware-pipeline',
			title: 'Middleware Pipeline',
			children: [{ id: 'built-in-middleware', title: 'Built-in Middleware' }],
		},
		{ id: 'standalone-functions', title: 'Standalone Functions' },
		{ id: 'gql-tag', title: 'gql Tag' },
		{ id: 'reactive-variables', title: 'Reactive Variables' },
		{ id: 'client-directive', title: 'Client Directive' },
		{
			id: 'configuration',
			title: 'Configuration',
			children: [
				{ id: 'provide-graphql', title: 'provideGraphql' },
				{ id: 'plugins', title: 'Plugins' },
			],
		},
		{ id: 'app-queries', title: 'App Queries' },
	];

	constructor() {
		this.tocService.sections.set(this.tocSections);
	}
}
