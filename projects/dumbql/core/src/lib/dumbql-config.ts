import { InjectionToken, type Provider, type AbstractType } from '@angular/core';
import type { Observable } from 'rxjs';
import type { GraphqlMiddleware } from './middleware';
import type { EndpointsYaml } from './endpoints-config';
export interface RetryExchangeConfig {
	maxRetries?: number;
	initialDelay?: number;
	maxDelay?: number;
	exponent?: number;
	jitter?: boolean;
	shouldRetry?: (result: unknown, attempt: number) => boolean;
}

import type { DevtoolsConfig } from './devtools';

// ─── Core ───────────────────────────────────────────────────────────────────

export interface OnErrorServiceConfig {
	/** The Angular service token to inject (e.g. TuiAlertService) */
	provide: AbstractType<unknown> | InjectionToken<unknown>;
	/**
	 * Called with the injected service and error message.
	 * Return an Observable — the library subscribes and auto-manages the subscription.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	use: (service: any, error: string) => Observable<unknown>;
}

export interface GraphqlCoreConfig {
	endpoint?: string;
	url?: string;
	headers?: Record<string, string | (() => string)>;
	errorPolicy?: 'none' | 'all' | 'ignore';
	/**
	 * When true, includes `graphQLErrors` on successful results even when the
	 * errorPolicy would normally strip them. Useful for detecting partial errors
	 * (e.g. server returns data + errors) without having to switch to `'all'`.
	 */
	showErrorsOnSuccess?: boolean;
	retryCount?: number;
	retryDelay?: number;
	dedup?: boolean;
	batchWindow?: number;
	middleware?: GraphqlMiddleware[];
	retryExchange?: RetryExchangeConfig;
	devAuth?: {
		token?: string;
		enabled?: boolean;
	};
	/**
	 * Enable multi-endpoint mode. When true, requires an `endpoints.yml` file
	 * to be provided via `provideMultiEndpoint()`. Queries and mutations must
	 * then specify an endpoint name.
	 */
	multiEndpoint?: boolean;
	/**
	 * Path to the endpoints YAML configuration file. Only used when
	 * `multiEndpoint: true`. Defaults to `./endpoints.yml`.
	 */
	endpoints?: string;
	/**
	 * Error notification config.
	 * - Simple callback: `(error: string) => void`
	 * - Service-based: `{ provide: TuiAlertService, use: (svc, err) => svc.open(err) }`
	 *   The library injects the service, calls `use()`, and manages the subscription.
	 *
	 * @example
	 * ```typescript
	 * onError: {
	 *   provide: TuiAlertService,
	 *   use: (alerts, err) => alerts.open(err, { label: 'GraphQL Error' }),
	 * }
	 * ```
	 */
	onError?: ((error: string) => void) | OnErrorServiceConfig;
	/**
	 * Custom error handler. Receives every error during query execution.
	 * Called before `onError` — useful for logging, metrics, or custom toast.
	 *
	 * @example
	 * ```typescript
	 * errorHandler: {
	 *   handle(error) { console.error('[GraphQL]', error); return true; }
	 * }
	 * ```
	 */
	errorHandler?: { handle(error: unknown): boolean | Promise<boolean> };
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export interface SubscriptionsConfig {
	wsEndpoint?: string;
	reconnect?: boolean;
	reconnectInterval?: number;
	lazy?: boolean;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface SchemaConfig {
	/** Inline schema data (e.g. from downloaded introspection JSON) */
	data?: Record<string, unknown>;
	/** Fetch schema from this URL at startup */
	url?: string;
	/** Custom headers for schema fetch */
	headers?: Record<string, string>;
}

// ─── Cache ──────────────────────────────────────────────────────────────────

export interface CacheConfig {
	enabled?: boolean;
	maxAge?: number;
	serialize?: boolean;
	typePolicies?: Record<
		string,
		{
			keyFields?: string[];
			merge?:
				| 'append'
				| 'prepend'
				| ((
						existing: unknown[] | undefined,
						incoming: unknown[],
						options?: { args?: Record<string, unknown> },
				  ) => unknown[]);
		}
	>;
	/** Schema used for type policy validation */
	schema?: SchemaConfig;
}

// ─── Persisted Queries ──────────────────────────────────────────────────────

export interface PersistedQueriesConfig {
	enabled?: boolean;
	hash?: 'sha256' | 'simple';
	autoPersist?: boolean;
	/** Send hash-only requests via GET instead of POST to enable CDN caching.
	 *  Only applies when `hash` is set and the query body is empty (hash-only). */
	useGetForHashedQueries?: boolean;
}

// ─── File Upload ────────────────────────────────────────────────────────────

export interface UploadConfig {
	maxFiles?: number;
	maxFileSize?: number;
}

// ─── Debug ──────────────────────────────────────────────────────────────────

export interface DebugConfig {
	logOperations?: boolean;
	logTiming?: boolean;
	logCache?: boolean;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationConfig {
	defaultLimit?: number;
	debounceMs?: number;
}

// ─── Testing ─────────────────────────────────────────────────────────────────

export interface TestingConfig {
	enabled?: boolean;
}

// ─── SSR ────────────────────────────────────────────────────────────────────

export interface SsrConfig {
	transferState?: boolean;
	cacheTtl?: number;
}

// ─── Telemetry / OpenTelemetry ───────────────────────────────────────────────

export interface TelemetryConfig {
	enabled?: boolean;
	/** OpenTelemetry tracing configuration */
	tracing?: {
		enabled?: boolean;
		exporter?: 'console' | 'otlp';
		endpoint?: string;
		serviceName?: string;
	};
	/** Middleware-level tracing tags */
	tags?: Record<string, string>;
}

// ─── Codegen (CLI-only, ignored at runtime) ─────────────────────────────────

export interface CodegenConfig {
	schema: {
		endpoint: string;
		dir?: string;
		filename?: string;
		autoDownload?: boolean;
		autoDownloadSchema?: boolean;
		headers?: Record<string, string>;
	};
	types: {
		dir: string;
		scalars?: Record<string, string>;
		enumsAsTypes?: boolean;
		maybeValue?: string;
		strictNullability?: boolean;
		operationResultPrefix?: string;
		operationResultSuffix?: string;
		/** When true, only appends new type definitions instead of rewriting the entire file. */
		merge?: boolean;
	};
}

// ─── Unified Config ─────────────────────────────────────────────────────────

export interface DumbqlPlugin {
	name: string;
	onInit?(client: unknown): void;
	getMiddleware?(): unknown;
}

export interface DumbqlConfig extends GraphqlCoreConfig {
	autoDownload?: boolean;
	autoDownloadSchema?: boolean;
	subscriptions?: SubscriptionsConfig;
	cache?: CacheConfig;
	persistedQueries?: PersistedQueriesConfig;
	upload?: UploadConfig;
	debug?: boolean | DebugConfig;
	pagination?: PaginationConfig;
	testing?: TestingConfig;
	ssr?: SsrConfig;
	codegen?: CodegenConfig;
	devtools?: boolean | DevtoolsConfig;
	telemetry?: TelemetryConfig;
	plugins?: DumbqlPlugin[];
}

// ─── Legacy alias ───────────────────────────────────────────────────────────

/** @deprecated Use DumbqlConfig instead */
export type GraphqlConfig = DumbqlConfig;

// ─── Injection token ────────────────────────────────────────────────────────

export const DUMBQL_CONFIG = new InjectionToken<DumbqlConfig>('DUMBQL_CONFIG');

/** @deprecated Use DUMBQL_CONFIG instead */
export const GRAPHQL_CONFIG = DUMBQL_CONFIG;

export { GRAPHQL_CACHE, type GraphqlCacheLike } from '@dumbql/cache';

// ─── Provider ───────────────────────────────────────────────────────────────

export function provideGraphql(config: Partial<DumbqlConfig>): Provider[] {
	const defaults: Partial<DumbqlConfig> = {
		endpoint: '/graphql',
		errorPolicy: 'none',
		retryCount: 0,
		retryDelay: 1000,
		dedup: false,
		batchWindow: 0,
		devAuth: { enabled: true },
	};

	return [{ provide: DUMBQL_CONFIG, useValue: { ...defaults, ...config } }];
}

/**
 * Type-safe config helper with full inference (like Vite's `defineConfig`).
 *
 * @example
 * ```typescript
 * // dumbql.config.ts
 * import { defineConfig } from '@dumbql/core';
 *
 * export default defineConfig({
 *   endpoint: '/graphql',
 *   errorPolicy: 'all',
 *   retryCount: 3,
 *   cache: { enabled: true, maxAge: 60_000 },
 * });
 * ```
 */
export function defineConfig(config: DumbqlConfig): DumbqlConfig {
	return config;
}

/**
 * Type-safe multi-endpoint config helper.
 *
 * @example
 * ```typescript
 * import { defineEndpointsConfig } from '@dumbql/core';
 *
 * export default defineEndpointsConfig({
 *   default_endpoint: 'main',
 *   routes: {
 *     main: { url: 'http://localhost:4000/graphql', errorPolicy: 'none' },
 *     users: { url: 'http://localhost:4001/graphql', errorPolicy: 'all' },
 *   },
 *   groups: {
 *     core: ['main', 'users'],
 *   },
 * });
 * ```
 */
export function defineEndpointsConfig(config: EndpointsYaml): EndpointsYaml {
	return config;
}
