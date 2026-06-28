import type { GraphQLResult } from './result';

export interface GraphqlRequestContext {
  query: string;
  variables: Record<string, unknown>;
  headers: Record<string, string>;
  type: 'query' | 'mutation';
  endpoint?: string;
  extensions?: Record<string, unknown>;
  onTypenamesExtracted?: (typenames: Set<string>) => void;
}

export type GraphqlMiddlewareNext = (request: GraphqlRequestContext) => Promise<GraphQLResult<unknown>>;

export type GraphqlMiddleware = (
  request: GraphqlRequestContext,
  next: GraphqlMiddlewareNext,
) => Promise<GraphQLResult<unknown>>;

export function applyMiddleware(
  middleware: GraphqlMiddleware[],
  final: (request: GraphqlRequestContext) => Promise<GraphQLResult<unknown>>,
): (request: GraphqlRequestContext) => Promise<GraphQLResult<unknown>> {
  if (middleware.length === 0) return final;

  const chain = middleware.reduceRight<GraphqlMiddlewareNext>(
    (next, mw) => (req) => mw(req, next),
    final as GraphqlMiddlewareNext,
  );

  return (request) => chain(request);
}

export function authMiddleware(token: string, headerName = 'Authorization'): GraphqlMiddleware {
  return (request, next) => {
    request.headers[headerName] = /Bearer\s/.test(token) ? token : `Bearer ${token}`;
    return next(request);
  };
}

export function devAuthMiddleware(token?: string): GraphqlMiddleware {
  return (request, next) => {
    const resolved = token
      ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('dev_token') : undefined)
      ?? 'dev-token';
    request.headers['Authorization'] = `Bearer ${resolved}`;
    return next(request);
  };
}

export function loggingMiddleware(label?: string): GraphqlMiddleware {
  return async (request, next) => {
    const start = performance.now();
    const result = await next(request);
    const duration = (performance.now() - start).toFixed(1);
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log(
        `[${label ?? 'GraphQL'}] ${request.type} ${request.query.slice(0, 60)}… ${duration}ms`,
        result,
      );
    }
    return result;
  };
}

function findFiles(value: unknown): boolean {
  if (value instanceof File || value instanceof Blob) return true;
  if (Array.isArray(value)) return value.some((item) => findFiles(item));
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) => findFiles(v));
  }
  return false;
}

export function hasFiles(value: unknown): boolean {
  return findFiles(value);
}
