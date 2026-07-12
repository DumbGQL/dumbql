import type { GraphqlMiddleware } from './middleware';

// ─── Cache ──────────────────────────────────────────────────────────────────

export interface CacheConfig {
	readonly enabled?: boolean;
	readonly maxAge?: number;
	readonly serialize?: boolean;
	readonly typePolicies?: Readonly<
		Record<
			string,
			{
				readonly keyFields?: readonly string[];
				readonly merge?:
					| 'append'
					| 'prepend'
					| ((
							existing: unknown[] | undefined,
							incoming: unknown[],
							options?: { readonly args?: Record<string, unknown> },
					  ) => unknown[]);
			}
		>
	>;
	readonly schema?: SchemaConfig;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface SchemaConfig {
	readonly data?: Record<string, unknown>;
	readonly url?: string;
	readonly headers?: Record<string, string>;
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export interface SubscriptionsConfig {
	readonly wsEndpoint?: string;
	readonly reconnect?: boolean;
	readonly reconnectInterval?: number;
	readonly lazy?: boolean;
}

// ─── Persisted Queries ──────────────────────────────────────────────────────

export interface PersistedQueriesConfig {
	readonly enabled?: boolean;
	readonly hash?: 'sha256' | 'simple';
	readonly autoPersist?: boolean;
	/** Send hash-only requests via GET instead of POST to enable CDN caching.
	 *  Only applies when `hash` is set and the query body is empty (hash-only). */
	readonly useGetForHashedQueries?: boolean;
}

// ─── Retry Exchange ─────────────────────────────────────────────────────────

export interface RetryExchangeConfig {
	readonly maxRetries?: number;
	readonly initialDelay?: number;
	readonly maxDelay?: number;
	readonly exponent?: number;
	readonly jitter?: boolean;
	readonly shouldRetry?: (result: unknown, attempt: number) => boolean;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export interface MiddlewareConfig {
	readonly onError?: (error: string) => void;
}

// ─── Client Config ──────────────────────────────────────────────────────────

export interface ClientConfig {
	readonly endpoint?: string;
	readonly url?: string;
	readonly headers?: Record<string, string | (() => string)>;
	readonly errorPolicy?: 'none' | 'all' | 'ignore';
	readonly showErrorsOnSuccess?: boolean;
	readonly retryCount?: number;
	readonly retryDelay?: number;
	readonly dedup?: boolean;
	readonly batchWindow?: number;
	readonly middleware?: GraphqlMiddleware[];
	readonly retryExchange?: RetryExchangeConfig;
	readonly devAuth?: {
		readonly token?: string;
		readonly enabled?: boolean;
	};
	readonly onError?: (error: string) => void;
	/**
	 * Custom error handler. Receives every error during query execution.
	 * Called before `onError` — useful for logging, metrics, or custom toast.
	 */
	readonly errorHandler?: { handle(error: unknown): boolean | Promise<boolean> };
	readonly subscriptions?: SubscriptionsConfig;
	readonly cache?: CacheConfig;
	readonly persistedQueries?: PersistedQueriesConfig;
}
