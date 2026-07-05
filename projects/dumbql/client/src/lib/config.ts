import type { GraphqlMiddleware } from './middleware';

// ─── Cache ──────────────────────────────────────────────────────────────────

export interface CacheConfig {
  enabled?: boolean;
  maxAge?: number;
  serialize?: boolean;
  typePolicies?: Record<string, {
    keyFields?: string[];
    merge?: 'append' | 'prepend' | ((
      existing: unknown[] | undefined,
      incoming: unknown[],
      options?: { args?: Record<string, unknown> }
    ) => unknown[]);
  }>;
  schema?: SchemaConfig;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface SchemaConfig {
  data?: Record<string, unknown>;
  url?: string;
  headers?: Record<string, string>;
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

export interface SubscriptionsConfig {
  wsEndpoint?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  lazy?: boolean;
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

// ─── Retry Exchange ─────────────────────────────────────────────────────────

export interface RetryExchangeConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  exponent?: number;
  jitter?: boolean;
  shouldRetry?: (result: unknown, attempt: number) => boolean;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export interface MiddlewareConfig {
  onError?: (error: string) => void;
}

// ─── Client Config ──────────────────────────────────────────────────────────

export interface ClientConfig {
  endpoint?: string;
  url?: string;
  headers?: Record<string, string | (() => string)>;
  errorPolicy?: 'none' | 'all' | 'ignore';
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
  onError?: (error: string) => void;
  /**
   * Custom error handler. Receives every error during query execution.
   * Called before `onError` — useful for logging, metrics, or custom toast.
   */
  errorHandler?: { handle(error: unknown): boolean | Promise<boolean> };
  subscriptions?: SubscriptionsConfig;
  cache?: CacheConfig;
  persistedQueries?: PersistedQueriesConfig;
}
