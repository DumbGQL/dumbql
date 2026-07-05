import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, timer, switchMap, tap, Subscriber } from 'rxjs';
import { print, type DocumentNode, type TypedDocumentNode, type TypedQueryString } from './gql';
import { gql } from './gql';
import {
  DUMBQL_CONFIG,
  GRAPHQL_CACHE,
  type GraphqlCacheLike,
  type DumbqlConfig,
  type OnErrorServiceConfig,
} from './dumbql-config';
import {
  applyMiddleware,
  type GraphqlRequestContext,
  devAuthMiddleware,
  hasFiles,
  type GraphqlMiddleware,
} from './middleware';
import { cacheMiddleware } from './cache-middleware';

export { gql };

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface NetworkErrorInfo {
  message: string;
  status?: number;
  statusText?: string;
}

export type ErrorCode = 'NO_DATA' | 'GRAPHQL_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';

export type GraphQLResult<T> =
  | { status: 'success'; data: T; graphQLErrors?: GraphQLError[] }
  | {
      status: 'error';
      error: string;
      errorCode?: ErrorCode;
      graphQLErrors?: GraphQLError[];
      networkError?: NetworkErrorInfo;
    };

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

type ErrorPolicy = 'none' | 'all' | 'ignore';

interface FileEntry {
  path: string;
  file: Blob;
}

const dedupCache = new Map<string, Observable<GraphQLResult<unknown>>>();

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly config!: DumbqlConfig;
  private readonly errorPolicy!: ErrorPolicy;
  private readonly showErrorsOnSuccess!: boolean;
  private readonly retryCount!: number;
  private readonly retryDelay!: number;
  private readonly batchWindow!: number;

  private _endpoint: string;
  private batchQueue:
    | {
        request: GraphqlRequestContext;
        resolve: (result: GraphQLResult<unknown>) => void;
      }[]
    | null = null;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly pipeline: (request: GraphqlRequestContext) => Observable<GraphQLResult<unknown>>;

  constructor() {
    const cfg = inject(DUMBQL_CONFIG, { optional: true });
    if (!cfg) {
      throw new Error(
        'DumbQL: provideDumbql() not configured. ' +
          "Add `provideDumbql({ endpoint: '/graphql' })` to your app.config.ts providers array.",
      );
    }
    this.config = cfg;
    this._endpoint = cfg.endpoint || cfg.url || '/graphql';
    this.errorPolicy = cfg.errorPolicy ?? 'none';
    this.showErrorsOnSuccess = cfg.showErrorsOnSuccess ?? false;
    this.retryCount = cfg.retryCount ?? 0;
    this.retryDelay = cfg.retryDelay ?? 1000;
    this.batchWindow = cfg.batchWindow ?? 0;
    this.pipeline = this.buildPipeline();
  }

  /** Change the GraphQL endpoint at runtime. */
  setEndpoint(url: string): void {
    this._endpoint = url;
  }

  /** Current GraphQL endpoint. */
  get endpoint(): string {
    return this._endpoint;
  }

  query<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
    variables?: TVariables,
    endpoint?: string,
  ): Observable<GraphQLResult<TResponse>> {
    const queryStr = typeof document === 'string' ? document : print(document);
    return this.withDedup(queryStr, variables, () => this.executeQuery<TResponse>(queryStr, variables, endpoint));
  }

  /**
   * Execute a query with streaming support (`@defer`/`@stream`).
   * Uses the Fetch API internally for multipart/mixed response handling.
   */
  queryStream<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
    variables?: TVariables,
    endpoint?: string,
  ): Observable<GraphQLResult<TResponse>> {
    const queryStr = typeof document === 'string' ? document : print(document);
    return this.executeStreaming(queryStr, variables, endpoint) as Observable<GraphQLResult<TResponse>>;
  }

  mutate<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
    variables?: TVariables,
    endpoint?: string,
    optimistic?: (cache: GraphqlCacheLike) => string,
  ): Observable<GraphQLResult<TResponse>> {
    const query = typeof document === 'string' ? document : print(document);

    const cache = this.injector.get(GRAPHQL_CACHE, null);

    let optimisticId: string | undefined;
    if (optimistic && cache) {
      optimisticId = optimistic(cache);
    }

    let result$: Observable<GraphQLResult<TResponse>>;

    if (variables !== undefined && hasFiles(variables)) {
      result$ = this.upload<TResponse>(query, variables, endpoint);
    } else {
      result$ = this.withRetry(() => this.request<TResponse>(query, variables, 'mutation', endpoint));
    }

    return result$.pipe(
      tap({
        next: (result) => {
          if (!optimisticId || !cache) return;
          if (result.status === 'success') {
            cache.commitOptimistic(optimisticId);
          } else {
            cache.rollbackOptimistic(optimisticId);
          }
        },
        error: () => {
          if (optimisticId && cache) {
            cache.rollbackOptimistic(optimisticId);
          }
        },
      }),
    );
  }

  refetch<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
    variables?: TVariables,
    endpoint?: string,
  ): Observable<GraphQLResult<TResponse>> {
    const queryStr = typeof document === 'string' ? document : print(document);
    const key = this.dedupKey(queryStr, variables);
    dedupCache.delete(key);
    return this.withDedup(queryStr, variables, () => this.executeQuery<TResponse>(queryStr, variables, endpoint));
  }

  poll<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
    document: TypedQueryString<TResponse, TVariables> | DocumentNode | TypedDocumentNode<TResponse, TVariables>,
    intervalMs: number,
    variables?: TVariables,
    endpoint?: string,
  ): Observable<GraphQLResult<TResponse>> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.refetch(document, variables, endpoint)),
    );
  }

  private executeQuery<T>(
    query: string,
    variables?: Record<string, unknown>,
    endpoint?: string,
  ): Observable<GraphQLResult<T>> {
    if (this.batchWindow > 0) {
      return this.batchedRequest<T>(query, variables, endpoint);
    }
    return this.withRetry(() => this.request<T>(query, variables, 'query', endpoint));
  }

  private request<T>(
    query: string,
    variables?: Record<string, unknown>,
    type: 'query' | 'mutation' = 'query',
    endpoint?: string,
  ): Observable<GraphQLResult<T>> {
    const context: GraphqlRequestContext = {
      query,
      variables: variables ?? {},
      headers: this.getHeaderMap(),
      type,
      endpoint,
    };
    return this.pipeline!(context) as Observable<GraphQLResult<T>>;
  }

  private buildPipeline(): (request: GraphqlRequestContext) => Observable<GraphQLResult<unknown>> {
    const mw = [...(this.config.middleware ?? [])];

    // Execute and register plugins
    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        if (plugin.onInit) {
          try {
            plugin.onInit(this);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`DumbQL: Error initializing plugin ${plugin.name}:`, e);
          }
        }
        if (plugin.getMiddleware) {
          try {
            const pluginMw = plugin.getMiddleware();
            if (Array.isArray(pluginMw)) {
              mw.push(...(pluginMw as GraphqlMiddleware[]));
            } else if (pluginMw) {
              mw.push(pluginMw as GraphqlMiddleware);
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`DumbQL: Error registering middleware for plugin ${plugin.name}:`, e);
          }
        }
      }
    }

    if (this.config.cache?.enabled !== false) {
      try {
        mw.push(cacheMiddleware(this.injector));
      } catch {
        // Cache service or injector not available
      }
    }

    if (this.config.devAuth?.enabled !== false) {
      mw.unshift(devAuthMiddleware(this.config.devAuth?.token));
    }

    return applyMiddleware(mw, (req) => this.executeHttp(req));
  }

  private executeHttp(request: GraphqlRequestContext): Observable<GraphQLResult<unknown>> {
    const headers = new HttpHeaders(request.headers);
    const body: Record<string, unknown> = { query: request.query, variables: request.variables };
    if (request.extensions) {
      body['extensions'] = request.extensions;
    }
    const url = request.endpoint || this._endpoint;
    return this.http.post<GraphQLResponse<unknown>>(url, body, { headers }).pipe(
      map((response) => this.toResult(response)),
      catchError((error: unknown) => of(this.toHttpError(error))),
    );
  }

  /**
   * Execute a query using the Fetch API for streaming (`@defer`/`@stream`).
   * Emits each incremental patch as it arrives.
   */
  executeStreaming(
    query: string,
    variables?: Record<string, unknown>,
    endpoint?: string,
  ): Observable<GraphQLResult<unknown>> {
    return new Observable<GraphQLResult<unknown>>((subscriber: Subscriber<GraphQLResult<unknown>>) => {
      const url = endpoint || this._endpoint;
      const headers = this.getHeaderMap();
      const controller = new AbortController();

      (async () => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              Accept: 'multipart/mixed;boundary=graphql;defer=stream',
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal,
          });

          if (!response.ok) {
            subscriber.next({ status: 'error', error: `HTTP ${response.status}` });
            subscriber.complete();
            return;
          }

          const contentType = response.headers.get('content-type') ?? '';
          const reader = response.body?.getReader();
          if (!reader) {
            subscriber.next({ status: 'error', error: 'No response body' });
            subscriber.complete();
            return;
          }

          if (contentType.includes('multipart/mixed')) {
            const boundary = this.parseBoundary(contentType);
            if (!boundary) {
              subscriber.next({ status: 'error', error: 'No boundary in multipart response' });
              subscriber.complete();
              return;
            }
            await this.readMultipartStream(reader, boundary, subscriber);
          } else {
            const chunks: Uint8Array[] = [];
            let done = false;
            while (!done) {
              const { done: d, value } = await reader.read();
              done = d;
              if (value) chunks.push(value);
            }
            const text = new TextDecoder().decode(this.concatBuffers(chunks));
            const json = JSON.parse(text) as GraphQLResponse<unknown>;
            subscriber.next(this.toResult(json));
            subscriber.complete();
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          subscriber.error(err);
        }
      })();

      return () => controller.abort();
    });
  }

  private parseBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
    return match ? (match[1] ?? match[2]) : null;
  }

  private async readMultipartStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    boundary: string,
    subscriber: Subscriber<GraphQLResult<unknown>>,
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const { done: d, value } = await reader.read();
      done = d;
      if (value) buffer += decoder.decode(value, { stream: !done });

      const parts = buffer.split(`--${boundary}`);
      if (parts.length > 1) {
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed || trimmed === '--') continue;
          const jsonStart = trimmed.indexOf('\n\n');
          if (jsonStart === -1) continue;
          const jsonStr = trimmed.slice(jsonStart + 2).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr) as GraphQLResponse<unknown>;
            const result = this.toResult(parsed);
            subscriber.next(result);
            const wrapper = parsed as { hasNext?: boolean };
            if (wrapper.hasNext === false) {
              subscriber.complete();
              return;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    }

    subscriber.complete();
  }

  private concatBuffers(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  private withRetry<T>(fn: () => Observable<GraphQLResult<T>>): Observable<GraphQLResult<T>> {
    if (this.retryCount <= 0) return fn();

    let attempts = 0;

    const attempt = (): Observable<GraphQLResult<T>> =>
      fn().pipe(
        catchError((error: unknown) => {
          attempts++;
          if (attempts <= this.retryCount) {
            return timer(this.retryDelay * Math.pow(2, attempts - 1)).pipe(map(() => null as never));
          }
          throw error;
        }),
      );

    return attempt();
  }

  private withDedup<T>(
    query: string,
    variables: Record<string, unknown> | undefined,
    fn: () => Observable<GraphQLResult<T>>,
  ): Observable<GraphQLResult<T>> {
    if (!this.config.dedup) return fn();

    const key = this.dedupKey(query, variables);

    if (dedupCache.has(key)) {
      return dedupCache.get(key) as Observable<GraphQLResult<T>>;
    }

    const obs = fn().pipe(shareReplay(1));

    dedupCache.set(key, obs);
    obs.subscribe({
      complete: () => dedupCache.delete(key),
      error: () => dedupCache.delete(key),
    });

    return obs;
  }

  private dedupKey(query: string, variables?: Record<string, unknown>): string {
    return `${query}|${JSON.stringify(variables ?? {})}`;
  }

  private batchedRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    endpoint?: string,
  ): Observable<GraphQLResult<T>> {
    return new Observable<GraphQLResult<T>>((subscriber) => {
      if (!this.batchQueue) {
        this.batchQueue = [];
      }

      const context: GraphqlRequestContext = {
        query,
        variables: variables ?? {},
        headers: this.getHeaderMap(),
        type: 'query',
        endpoint,
      };

      this.batchQueue.push({
        request: context,
        resolve: (result) => {
          subscriber.next(result as GraphQLResult<T>);
          subscriber.complete();
        },
      });

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flushBatch(), this.batchWindow);
      }
    });
  }

  private flushBatch(): void {
    const queue = this.batchQueue;
    this.batchQueue = null;
    this.batchTimer = null;

    if (!queue || queue.length === 0) return;

    const items = queue.map((item) => this.pipeline!(item.request));

    if (queue.length === 1) {
      items[0].subscribe({
        next: (result) => queue[0].resolve(result),
        error: (err) => queue[0].resolve(this.toHttpError(err)),
      });
      return;
    }

    const headers = new HttpHeaders(queue[0].request.headers);
    const body = queue.map((item) => ({
      query: item.request.query,
      variables: item.request.variables,
    }));

    const url = queue[0].request.endpoint || this._endpoint;
    this.http
      .post<GraphQLResponse<unknown>[]>(url, body, { headers })
      .pipe(catchError((error: unknown) => of(queue.map(() => this.toHttpError(error) as GraphQLResponse<unknown>))))
      .subscribe({
        next: (responses) => {
          for (let i = 0; i < queue.length; i++) {
            const resp = responses[i];
            if (resp) {
              queue[i].resolve(this.toResult(resp));
            } else {
              queue[i].resolve({ status: 'error', error: 'No response in batch' });
            }
          }
        },
      });
  }

  private upload<T>(
    query: string,
    variables: Record<string, unknown>,
    endpoint?: string,
  ): Observable<GraphQLResult<T>> {
    const files: FileEntry[] = [];
    const cleanedVariables = replaceFiles(variables, files, []);
    const operations = JSON.stringify({ query, variables: cleanedVariables });
    const map_: Record<string, string[]> = {};

    for (const [index, entry] of files.entries()) {
      map_[String(index)] = [entry.path];
    }

    const formData = new FormData();
    formData.append('operations', operations);
    formData.append('map', JSON.stringify(map_));
    for (const [index, entry] of files.entries()) {
      formData.append(String(index), entry.file);
    }

    const url = endpoint || this._endpoint;
    return this.http.post<GraphQLResponse<T>>(url, formData).pipe(
      map((response) => this.toResult<T>(response)),
      catchError((error: unknown) => of(this.toHttpError<T>(error))),
    );
  }

  private getHeaderMap(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.headers) {
      for (const [key, value] of Object.entries(this.config.headers)) {
        headers[key] = typeof value === 'function' ? value() : value;
      }
    }

    return headers;
  }

  private toResult<T>(response: GraphQLResponse<T>): GraphQLResult<T> {
    const hasErrors = response.errors && response.errors.length > 0;
    const errorsPayload = hasErrors ? response.errors : undefined;

    if (hasErrors && this.errorPolicy === 'none') {
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'GRAPHQL_ERROR',
        error: response.errors![0].message,
        graphQLErrors: response.errors!,
      });
    }

    if (hasErrors && this.errorPolicy === 'ignore') {
      if (response.data != null) {
        const result: { status: 'success'; data: T; graphQLErrors?: GraphQLError[] } = {
          status: 'success',
          data: response.data as T,
        };
        if (this.showErrorsOnSuccess) result.graphQLErrors = response.errors;
        return result;
      }
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'NO_DATA',
        error: 'No data returned',
        graphQLErrors: response.errors!,
      });
    }

    if (hasErrors && this.errorPolicy === 'all') {
      const msgs = response.errors!.map((e) => e.message);
      if (response.data != null) {
        return { status: 'success', data: response.data as T, graphQLErrors: response.errors };
      }
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'NO_DATA',
        error: msgs.join('; '),
        graphQLErrors: response.errors!,
      });
    }

    if (response.data == null) {
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'NO_DATA',
        error: 'No data returned from server',
      });
    }

    const result: { status: 'success'; data: T; graphQLErrors?: GraphQLError[] } = {
      status: 'success',
      data: response.data as T,
    };
    if (this.showErrorsOnSuccess && errorsPayload) {
      result.graphQLErrors = errorsPayload;
    }
    return result;
  }

  private toHttpError<T>(error: unknown): GraphQLResult<T> {
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        const msg = error.error.message;
        return this.withErrorNotification({
          status: 'error',
          errorCode: 'NETWORK_ERROR',
          error: msg,
          networkError: { message: msg, status: 0 },
        });
      }
      let message: string;
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.statusText && error.statusText !== 'OK') {
        message = error.statusText;
      } else {
        message = `HTTP ${error.status}`;
      }
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'NETWORK_ERROR',
        error: message,
        networkError: { message, status: error.status, statusText: error.statusText ?? undefined },
      });
    }
    if (error instanceof Error) {
      return this.withErrorNotification({
        status: 'error',
        errorCode: 'NETWORK_ERROR',
        error: error.message,
        networkError: { message: error.message },
      });
    }
    return this.withErrorNotification({
      status: 'error',
      errorCode: 'NETWORK_ERROR',
      error: 'Unknown error',
      networkError: { message: 'Unknown error' },
    });
  }

  private withErrorNotification(result: GraphQLResult<never> & { status: 'error' }): GraphQLResult<never> {
    const { onError, errorHandler } = this.config;

    if (errorHandler) {
      const err = new Error(result.error);
      const out = errorHandler.handle(err);
      if (out instanceof Promise) {
        out.catch(() => {
          /* void */
        });
      }
    }

    if (!onError) return result;

    const msg = result.error;
    if (typeof onError === 'function') {
      onError(msg);
    } else {
      const svc = onError as OnErrorServiceConfig;
      const instance = this.injector.get(svc.provide);
      const obs = svc.use(instance, msg);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      obs.subscribe({ error: () => {} });
    }

    return result;
  }
}

function replaceFiles(value: unknown, files: FileEntry[], segments: string[]): unknown {
  if (value instanceof File || value instanceof Blob) {
    files.push({ path: `variables.${segments.join('.')}`, file: value });
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => replaceFiles(item, files, [...segments, String(index)]));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = replaceFiles(val, files, [...segments, key]);
    }
    return result;
  }
  return value;
}
