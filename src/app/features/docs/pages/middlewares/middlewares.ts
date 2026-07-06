import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
	selector: 'app-docs-middlewares',
	standalone: true,
	imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './middlewares.html',
	styleUrl: './middlewares.scss',
})
export class DocsMiddlewares {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/middlewares');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/middlewares/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API'];

  protected readonly apiEntries: ApiEntry[] = [
  	{ name: 'authRefreshMiddleware(config)', description: 'Intercepts 401 responses, queues concurrent requests, calls refreshToken(), replays with new token.', type: 'function' },
  	{ name: 'AuthRefreshConfig', description: 'Configuration for auth refresh middleware.', type: 'interface' },
  	{ name: 'AuthRefreshConfig.refreshToken', description: 'Async function that returns a new token.', type: 'property', default: '—' },
  	{ name: 'AuthRefreshConfig.headerName', description: 'Header to set the token on.', type: 'property', default: 'Authorization' },
  	{ name: 'AuthRefreshConfig.triggerStatuses', description: 'HTTP status codes that trigger a refresh.', type: 'property', default: '[401]' },
  	{ name: 'AuthRefreshConfig.maxAttempts', description: 'Max refresh attempts per request.', type: 'property', default: '1' },
  	{ name: 'retryExchange(config?)', description: 'Retries failed operations with exponential backoff and optional jitter.', type: 'function' },
  	{ name: 'RetryExchangeConfig', description: 'Configuration for retry exchange middleware.', type: 'interface' },
  	{ name: 'RetryExchangeConfig.maxRetries', description: 'Maximum number of retry attempts.', type: 'property', default: '3' },
  	{ name: 'RetryExchangeConfig.initialDelay', description: 'Initial delay in ms before first retry.', type: 'property', default: '1000' },
  	{ name: 'RetryExchangeConfig.maxDelay', description: 'Maximum delay cap in ms.', type: 'property', default: '30000' },
  	{ name: 'RetryExchangeConfig.exponent', description: 'Backoff exponent multiplier.', type: 'property', default: '2' },
  	{ name: 'RetryExchangeConfig.jitter', description: 'Randomizes delay between 50-100% of calculated value.', type: 'property', default: 'true' },
  	{ name: 'RetryExchangeConfig.shouldRetry(result, attempt)', description: 'Custom predicate to decide whether to retry.', type: 'property', default: 'network error only' },
  	{ name: 'focusRefetchMiddleware(config?)', description: 'Refetches stale queries on visibilitychange or window.focus.', type: 'function' },
  	{ name: 'FocusRefetchConfig', description: 'Configuration for focus refetch middleware.', type: 'interface' },
  	{ name: 'FocusRefetchConfig.visibilityOnly', description: 'Only refetch on visibilitychange, not window.focus.', type: 'property', default: 'false' },
  	{ name: 'FocusRefetchConfig.minStaleSeconds', description: 'Minimum age in seconds before a query is considered stale.', type: 'property', default: '30' },
  	{ name: 'offlineQueueMiddleware(config?)', description: 'Buffers mutations in localStorage when offline, replays on online event.', type: 'function' },
  	{ name: 'OfflineQueueConfig', description: 'Configuration for offline queue middleware.', type: 'interface' },
  	{ name: 'OfflineQueueConfig.storageKey', description: 'localStorage key for persisted queue.', type: 'property', default: '__dumbql_offline_queue' },
  	{ name: 'OfflineQueueConfig.maxQueue', description: 'Maximum number of queued mutations.', type: 'property', default: '50' },
  	{ name: 'OfflineQueueConfig.autoReplay', description: 'Automatically replay queue on online event.', type: 'property', default: 'true' },
  	{ name: 'provideOfflineQueue(config?)', description: 'Angular provider for the offline queue service.', type: 'function' },
  	{ name: 'OfflineQueueService', description: 'Injectable queue manager for offline mutations.', type: 'class' },
  	{ name: 'OfflineQueueService.queue', description: 'Read-only array of queued mutations.', type: 'property' },
  	{ name: 'OfflineQueueService.size', description: 'Number of queued mutations.', type: 'property' },
  	{ name: 'OfflineQueueService.enqueue(query, variables)', description: 'Adds a mutation to the offline queue.', type: 'method' },
  	{ name: 'OfflineQueueService.replay()', description: 'Replays all queued mutations and returns results.', type: 'method' },
  	{ name: 'OfflineQueueService.clear()', description: 'Clears all queued mutations.', type: 'method' },
  	{ name: 'OfflineQueueService.remove(id)', description: 'Removes a specific mutation from the queue by ID.', type: 'method' },
  	{ name: 'autoMockMiddleware(config?)', description: 'Generates mock GraphQL responses from a schema or field defaults.', type: 'function' },
  	{ name: 'AutoMockConfig', description: 'Configuration for auto-mock middleware.', type: 'interface' },
  	{ name: 'AutoMockConfig.schema', description: 'Schema SDL string for type-aware mocking.', type: 'property', default: '—' },
  	{ name: 'AutoMockConfig.mocks', description: 'Custom mock resolvers keyed by type name.', type: 'property', default: '—' },
  	{ name: 'AutoMockConfig.delay', description: 'Simulated network delay in ms.', type: 'property', default: '0' },
  	{ name: 'AutoMockConfig.passthrough', description: 'Fall through to real network if mock generation fails.', type: 'property', default: 'true' },
  	{ name: 'MockResolver', description: 'Signature for custom mock resolver functions.', type: 'type' },
  	{ name: 'errorHandlerMiddleware(config)', description: 'Catches errors and allows custom handling with optional recoverability.', type: 'function' },
  	{ name: 'ErrorHandlerConfig', description: 'Configuration for error handler middleware.', type: 'interface' },
  	{ name: 'ErrorHandlerConfig.handle(error)', description: 'Custom error handler returning boolean or Promise.', type: 'property' },
  	{ name: 'ErrorHandlerConfig.fallbackMessage', description: 'Fallback message when error has no message.', type: 'property', default: 'An error occurred' },
  	{ name: 'rateLimitMiddleware(config?)', description: 'Sliding-window rate limiter per request key.', type: 'function' },
  	{ name: 'RateLimitConfig', description: 'Configuration for rate limit middleware.', type: 'interface' },
  	{ name: 'RateLimitConfig.maxRequests', description: 'Max requests allowed per window.', type: 'property', default: '10' },
  	{ name: 'RateLimitConfig.windowMs', description: 'Time window in milliseconds.', type: 'property', default: '1000' },
  	{ name: 'RateLimitConfig.key(request)', description: 'Function to derive a rate-limit key from the request.', type: 'property', default: '() => "default"' },
  	{ name: 'dedupMiddleware()', description: 'Deduplicates in-flight queries sharing the same query + variables.', type: 'function' },
  	{ name: 'costEstimationMiddleware(config?)', description: 'Estimates query complexity and warns or blocks expensive queries.', type: 'function' },
  	{ name: 'CostEstimationConfig', description: 'Configuration for cost estimation middleware.', type: 'interface' },
  	{ name: 'CostEstimationConfig.maxCost', description: 'Maximum allowed cost before blocking.', type: 'property', default: '1000' },
  	{ name: 'CostEstimationConfig.warnAt', description: 'Cost threshold for console warnings.', type: 'property', default: '500' },
  	{ name: 'CostEstimationConfig.depthFactor', description: 'Multiplier per nesting level.', type: 'property', default: '0.5' },
  	{ name: 'CostEstimationConfig.mode', description: 'Action when cost exceeds max: block, warn, or pass.', type: 'property', default: 'warn' },
  	{ name: 'estimateQueryCost(query, depthFactor?)', description: 'Analyzes query string and returns detailed cost breakdown.', type: 'function' },
  	{ name: 'QueryCost', description: 'Query complexity analysis result.', type: 'interface' },
  	{ name: 'QueryCost.fields', description: 'Raw field count.', type: 'property' },
  	{ name: 'QueryCost.depth', description: 'Maximum nesting depth.', type: 'property' },
  	{ name: 'QueryCost.cost', description: 'Weighted cost = sum of (1 + depth × depthFactor) per field.', type: 'property' },
  	{ name: 'QueryCost.fragments', description: 'Number of fragment spreads.', type: 'property' },
  	{ name: 'QueryCost.aliases', description: 'Number of aliased fields.', type: 'property' },
  	{ name: 'QueryCost.details', description: 'Human-readable per-field breakdown.', type: 'property' },
  ];

  protected readonly tocSections: TocSection[] = [
  	{ id: 'auth-refresh', title: 'authRefreshMiddleware' },
  	{ id: 'retry-exchange', title: 'retryExchange' },
  	{ id: 'focus-refetch', title: 'focusRefetchMiddleware' },
  	{ id: 'offline-queue', title: 'offlineQueueMiddleware' },
  	{ id: 'auto-mock', title: 'autoMockMiddleware' },
  	{ id: 'error-handler', title: 'errorHandlerMiddleware' },
  	{ id: 'rate-limit', title: 'rateLimitMiddleware' },
  	{ id: 'dedup', title: 'dedupMiddleware' },
  	{ id: 'cost-estimation', title: 'costEstimationMiddleware' },
  	{ id: 'composing', title: 'Composing Middlewares' },
  ];

  constructor() {
  	this.tocService.sections.set(this.tocSections);
  }

  protected readonly authRefreshCode = `import { authRefreshMiddleware } from '@dumbql/middlewares';

const middleware = authRefreshMiddleware({
  refreshToken: () => fetch('/auth/refresh').then(r => r.json()),
});`;

  protected readonly retryExchangeCode = `import { retryExchange } from '@dumbql/middlewares';

const middleware = retryExchange({
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
});`;

  protected readonly focusRefetchCode = `import { focusRefetchMiddleware } from '@dumbql/middlewares';

const middleware = focusRefetchMiddleware({
  minStaleSeconds: 30,
});`;

  protected readonly offlineQueueCode = `import { offlineQueueMiddleware } from '@dumbql/middlewares';
import { provideOfflineQueue } from '@dumbql/middlewares/angular';

// Provider (Angular only):
export const appConfig = {
  providers: [provideOfflineQueue({ maxQueue: 50 })],
};

const middleware = offlineQueueMiddleware();`;

  protected readonly autoMockCode = `import { autoMockMiddleware } from '@dumbql/middlewares';

const middleware = autoMockMiddleware({
  schema: fs.readFileSync('schema.graphql', 'utf-8'),
  mocks: {
    User: () => ({ name: 'Mock User' }),
  },
  delay: 200,
});`;

  protected readonly errorHandlerCode = `import { errorHandlerMiddleware } from '@dumbql/middlewares';

const middleware = errorHandlerMiddleware({
  handle: (error) => {
    notifyUser(error.message);
    return true; // recoverable
  },
  fallbackMessage: 'Something went wrong',
});`;

  protected readonly rateLimitCode = `import { rateLimitMiddleware } from '@dumbql/middlewares';

const middleware = rateLimitMiddleware({
  maxRequests: 10,
  windowMs: 1000,
});`;

  protected readonly dedupCode = `import { dedupMiddleware } from '@dumbql/middlewares';

const middleware = dedupMiddleware();`;

  protected readonly costEstimationCode = `import { costEstimationMiddleware } from '@dumbql/middlewares';

const middleware = costEstimationMiddleware({
  maxCost: 1000,
  mode: 'block',
});`;

  protected readonly composingMiddlewaresCode = `import { composeMiddlewares, createHttpLink } from '@dumbql/core';
import { authRefreshMiddleware, retryExchange, focusRefetchMiddleware, offlineQueueMiddleware, autoMockMiddleware, errorHandlerMiddleware, rateLimitMiddleware, dedupMiddleware, costEstimationMiddleware } from '@dumbql/middlewares';

const link = composeMiddlewares(
  authRefreshMiddleware({ refreshToken: () => getToken() }),
  retryExchange({ maxRetries: 3 }),
  focusRefetchMiddleware(),
  offlineQueueMiddleware(),
  autoMockMiddleware(),
  errorHandlerMiddleware({ handle: () => true }),
  rateLimitMiddleware(),
  dedupMiddleware(),
  costEstimationMiddleware(),
  createHttpLink({ uri: '/graphql' }),
);`;
}
