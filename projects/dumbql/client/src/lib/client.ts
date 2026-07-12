import { print, type DocumentNode, type TypedDocumentNode } from './gql';
import {
	applyMiddleware,
	devAuthMiddleware,
	hasFiles,
	type GraphqlRequestContext,
	type GraphqlMiddleware,
} from './middleware';
import { cacheMiddleware } from './cache-middleware';
import type { GraphQLResult, GraphQLResponse } from './result';
import type { ClientConfig } from './config';
import type { CacheStore } from '@dumbql/cache';

export type { ClientConfig };

const dedupCache = new Map<string, Promise<GraphQLResult<unknown>>>();

interface BatchEntry {
	readonly request: GraphqlRequestContext;
	readonly resolve: (result: GraphQLResult<unknown>) => void;
}

interface FileEntry {
	readonly path: string;
	readonly file: Blob;
}

export class DumbqlClient {
	private _endpoint: string;
	private errorPolicy: 'none' | 'all' | 'ignore';
	private showErrorsOnSuccess: boolean;
	private retryCount: number;
	private retryDelay: number;
	private batchWindow: number;
	private dedupEnabled: boolean;
	private pipeline: (request: GraphqlRequestContext) => Promise<GraphQLResult<unknown>>;
	private _cacheService: CacheStore | null = null;

	private batchQueue: BatchEntry[] | null = null;
	private batchTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private config: ClientConfig,
		cache?: CacheStore,
	) {
		this._endpoint = config.endpoint ?? config.url ?? '/graphql';
		this.errorPolicy = config.errorPolicy ?? 'none';
		this.showErrorsOnSuccess = config.showErrorsOnSuccess ?? false;
		this.retryCount = config.retryCount ?? 0;
		this.retryDelay = config.retryDelay ?? 1000;
		this.batchWindow = config.batchWindow ?? 0;
		this.dedupEnabled = config.dedup ?? false;
		this._cacheService = cache ?? null;
		this.pipeline = this.buildPipeline(config);
	}

	setEndpoint(url: string): void {
		this._endpoint = url;
	}

	get endpoint(): string {
		return this._endpoint;
	}

	getCacheService(): CacheStore | null {
		return this._cacheService;
	}

	query<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
		endpoint?: string,
	): Promise<GraphQLResult<TResponse>> {
		const queryStr = print(document);
		if (this.dedupEnabled) {
			return this.withDedup(queryStr, variables,
				() => this.executeQuery<TResponse>(queryStr, variables, endpoint));
		}
		return this.executeQuery<TResponse>(queryStr, variables, endpoint);
	}

	queryStream<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
		endpoint?: string,
	): AsyncIterable<GraphQLResult<TResponse>> {
		const queryStr = print(document);
		return this.executeStreaming(queryStr, variables, endpoint) as AsyncIterable<GraphQLResult<TResponse>>;
	}

	async mutate<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
		endpoint?: string,
	): Promise<GraphQLResult<TResponse>> {
		const query = print(document);
		let result$: Promise<GraphQLResult<TResponse>>;

		if (variables !== undefined && hasFiles(variables)) {
			result$ = this.upload<TResponse>(query, variables, endpoint);
		} else {
			result$ = this.withRetry(() => this.request<TResponse>(query, variables, 'mutation', endpoint));
		}

		const result = await result$;

		if (result.status === 'success' && result.data && this._cacheService) {
			try {
				const typeNames = new Set<string>();
				extractTypeNames(result.data, typeNames);
				if (typeNames.size > 0) {
					this._cacheService.clearLocalStateByTypes(Array.from(typeNames));
				}
			} catch {
				// cache invalidation is best-effort
			}
		}

		return result;
	}

	refetch<TResponse, TVariables extends Record<string, unknown> = Record<string, unknown>>(
		document: DocumentNode | TypedDocumentNode<TResponse, TVariables>,
		variables?: TVariables,
		endpoint?: string,
	): Promise<GraphQLResult<TResponse>> {
		const query = print(document);
		const key = this.dedupKey(query, variables);
		dedupCache.delete(key);
		return this.query<TResponse, TVariables>(document, variables, endpoint);
	}

	private async executeQuery<T>(
		query: string,
		variables?: Record<string, unknown>,
		endpoint?: string,
	): Promise<GraphQLResult<T>> {
		if (this.batchWindow > 0) {
			return this.batchedRequest<T>(query, variables, endpoint);
		}
		return this.withRetry(() => this.request<T>(query, variables, 'query', endpoint));
	}

	private async request<T>(
		query: string,
		variables?: Record<string, unknown>,
		type: 'query' | 'mutation' = 'query',
		endpoint?: string,
	): Promise<GraphQLResult<T>> {
		const context: GraphqlRequestContext = {
			query,
			variables: variables ?? {},
			headers: this.getHeaderMap(),
			type,
			endpoint,
		};
		return this.pipeline(context) as Promise<GraphQLResult<T>>;
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

	private buildPipeline(config: ClientConfig): (request: GraphqlRequestContext) => Promise<GraphQLResult<unknown>> {
		const mw: GraphqlMiddleware[] = [...(config.middleware ?? [])];

		if (config.cache?.enabled !== false && this._cacheService) {
			try {
				mw.push(cacheMiddleware(this._cacheService, config.cache));
			} catch {
				// cache middleware not available
			}
		}

		if (config.devAuth?.enabled !== false) {
			mw.unshift(devAuthMiddleware(config.devAuth?.token));
		}

		return applyMiddleware(mw, (req) => this.executeHttp(req));
	}

	private async executeHttp(request: GraphqlRequestContext): Promise<GraphQLResult<unknown>> {
		try {
			const url = request.endpoint || this._endpoint;

			if (request.method === 'GET') {
				const params = new URLSearchParams();
				params.set('query', request.query);
				if (request.variables && Object.keys(request.variables).length > 0) {
					params.set('variables', JSON.stringify(request.variables));
				}
				if (request.extensions) {
					params.set('extensions', JSON.stringify(request.extensions));
				}
				const response = await fetch(`${url}?${params.toString()}`, {
					method: 'GET',
					headers: request.headers,
				});
				if (!response.ok) {
					return this.toHttpError({
						message: `HTTP ${response.status}`,
						status: response.status,
						statusText: response.statusText,
					});
				}
				const json = (await response.json()) as GraphQLResponse<unknown>;
				return this.toResult(json);
			}

			const body: Record<string, unknown> = { query: request.query, variables: request.variables };
			if (request.extensions) {
				body['extensions'] = request.extensions;
			}
			const response = await fetch(url, {
				method: 'POST',
				headers: request.headers,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				return this.toHttpError({
					message: `HTTP ${response.status}`,
					status: response.status,
					statusText: response.statusText,
				});
			}

			const json = (await response.json()) as GraphQLResponse<unknown>;
			return this.toResult(json);
		} catch (err) {
			return this.toHttpError(err instanceof Error ? err : new Error('Unknown error'));
		}
	}

	private async *executeStreaming(
		query: string,
		variables?: Record<string, unknown>,
		endpoint?: string,
	): AsyncIterable<GraphQLResult<unknown>> {
		const url = endpoint || this._endpoint;
		const headers = this.getHeaderMap();
		const controller = new AbortController();

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
				yield { status: 'error', error: `HTTP ${response.status}` };
				return;
			}

			const contentType = response.headers.get('content-type') ?? '';
			const reader = response.body?.getReader();
			if (!reader) {
				yield { status: 'error', error: 'No response body' };
				return;
			}

			if (contentType.includes('multipart/mixed')) {
				const boundary = this.parseBoundary(contentType);
				if (!boundary) {
					yield { status: 'error', error: 'No boundary in multipart response' };
					return;
				}
				yield* this.readMultipartStream(reader, boundary);
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
				yield this.toResult(json);
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			yield { status: 'error', error: err instanceof Error ? err.message : 'Stream error' };
		}
	}

	private parseBoundary(contentType: string): string | null {
		const match = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
		return match ? (match[1] ?? match[2]) : null;
	}

	private async *readMultipartStream(
		reader: ReadableStreamDefaultReader<Uint8Array>,
		boundary: string,
	): AsyncIterable<GraphQLResult<unknown>> {
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
						yield result;
						const wrapper = parsed as { hasNext?: boolean };
						if (wrapper.hasNext === false) return;
					} catch {
						// skip malformed chunks
					}
				}
			}
		}
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

	private async withRetry<T>(fn: () => Promise<GraphQLResult<T>>): Promise<GraphQLResult<T>> {
		if (this.retryCount <= 0) return fn();

		let lastError: unknown;
		for (let attempt = 0; attempt <= this.retryCount; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;
				if (attempt < this.retryCount) {
					const delay = this.retryDelay * Math.pow(2, attempt);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}
		throw lastError;
	}

	private withDedup<T>(
		query: string,
		variables: Record<string, unknown> | undefined,
		fn: () => Promise<GraphQLResult<T>>,
	): Promise<GraphQLResult<T>> {
		const key = this.dedupKey(query, variables);

		if (dedupCache.has(key)) {
			return dedupCache.get(key) as Promise<GraphQLResult<T>>;
		}

		const promise = fn().finally(() => dedupCache.delete(key));
		dedupCache.set(key, promise);
		return promise;
	}

	private dedupKey(query: string, variables?: Record<string, unknown>): string {
		return `${query}|${JSON.stringify(variables ?? {})}`;
	}

	private batchedRequest<T>(
		query: string,
		variables?: Record<string, unknown>,
		endpoint?: string,
	): Promise<GraphQLResult<T>> {
		return new Promise<GraphQLResult<T>>((resolve) => {
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
				resolve: resolve as (result: GraphQLResult<unknown>) => void,
			});

			if (!this.batchTimer) {
				this.batchTimer = setTimeout(() => this.flushBatch(), this.batchWindow);
			}
		});
	}

	private async flushBatch(): Promise<void> {
		const queue = this.batchQueue;
		this.batchQueue = null;
		this.batchTimer = null;

		if (!queue || queue.length === 0) return;

		if (queue.length === 1) {
			const result = await this.pipeline(queue[0].request);
			queue[0].resolve(result);
			return;
		}

		try {
			const url = queue[0].request.endpoint || this._endpoint;
			const headers = queue[0].request.headers;
			const body = queue.map((item) => ({
				query: item.request.query,
				variables: item.request.variables,
			}));

			const response = await fetch(url, {
				method: 'POST',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorResult = this.toHttpError({
					message: `HTTP ${response.status}`,
					status: response.status,
					statusText: response.statusText,
				});
				for (const item of queue) {
					item.resolve(errorResult);
				}
				return;
			}

			const responses = (await response.json()) as GraphQLResponse<unknown>[];
			for (let i = 0; i < queue.length; i++) {
				const resp = responses[i];
				if (resp) {
					queue[i].resolve(this.toResult(resp));
				} else {
					queue[i].resolve({ status: 'error', error: 'No response in batch' });
				}
			}
		} catch (err) {
			const errorResult = this.toHttpError(err instanceof Error ? err : new Error('Unknown error'));
			for (const item of queue) {
				item.resolve(errorResult);
			}
		}
	}

	private async upload<T>(
		query: string,
		variables: Record<string, unknown>,
		endpoint?: string,
	): Promise<GraphQLResult<T>> {
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
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: this.getHeaderMap(),
				body: formData,
			});

			if (!response.ok) {
				return this.toHttpError({
					message: `HTTP ${response.status}`,
					status: response.status,
					statusText: response.statusText,
				});
			}

			const json = (await response.json()) as GraphQLResponse<T>;
			return this.toResult(json);
		} catch (err) {
			return this.toHttpError(err instanceof Error ? err : new Error('Unknown error'));
		}
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
				const result: {
					status: 'success';
					data: T;
					graphQLErrors?: { message: string; extensions?: Record<string, unknown> }[];
				} = {
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

		const result: {
			status: 'success';
			data: T;
			graphQLErrors?: { message: string; extensions?: Record<string, unknown> }[];
		} = {
			status: 'success',
			data: response.data as T,
		};
		if (this.showErrorsOnSuccess && errorsPayload) {
			result.graphQLErrors = errorsPayload;
		}
		return result;
	}

	private toHttpError<T>(error: { message: string; status?: number; statusText?: string } | Error): GraphQLResult<T> {
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
			error: error.message,
			networkError: { message: error.message, status: error.status, statusText: error.statusText ?? undefined },
		});
	}

	private withErrorNotification(result: GraphQLResult<never> & { status: 'error' }): GraphQLResult<never> {
		const { onError, errorHandler } = this.config;

		if (errorHandler) {
			const err = new Error(result.error);
			const out = errorHandler.handle(err);
			if (out instanceof Promise) {
				out.catch(() => undefined);
			}
		}

		if (onError) {
			onError(result.error);
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

function extractTypeNames(data: unknown, types: Set<string>): void {
	if (!data || typeof data !== 'object') return;
	if (Array.isArray(data)) {
		for (const item of data) extractTypeNames(item, types);
		return;
	}
	const obj = data as Record<string, unknown>;
	if (typeof obj['__typename'] === 'string') {
		types.add(obj['__typename'] as string);
	}
	for (const v of Object.values(obj)) {
		if (v && typeof v === 'object') extractTypeNames(v, types);
	}
}

export function createClient(config: ClientConfig, cache?: CacheStore): DumbqlClient {
	return new DumbqlClient(config, cache);
}
