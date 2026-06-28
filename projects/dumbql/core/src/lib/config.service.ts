import { Injectable, inject, type Provider } from '@angular/core';
import {
	DUMBQL_CONFIG,
	type DumbqlConfig,
	type CacheConfig,
	type SubscriptionsConfig,
	type PersistedQueriesConfig,
	type UploadConfig,
	type DebugConfig,
	type PaginationConfig,
	type SsrConfig,
	provideGraphql,
} from './dumbql-config';
import type { DevtoolsConfig } from './devtools';

export function provideDumbql(config: Partial<DumbqlConfig>): Provider[] {
	return provideGraphql(config);
}

@Injectable({ providedIn: 'root' })
export class DumbqlConfigService {
	private readonly config: DumbqlConfig = inject(DUMBQL_CONFIG, { optional: true }) ?? { endpoint: '/graphql' };

	get all(): DumbqlConfig {
		return this.config;
	}

	get core() {
		return {
			endpoint: this.config.endpoint,
			headers: this.config.headers,
			errorPolicy: this.config.errorPolicy ?? 'none',
			retryCount: this.config.retryCount ?? 0,
			retryDelay: this.config.retryDelay ?? 1000,
			dedup: this.config.dedup ?? false,
			batchWindow: this.config.batchWindow ?? 0,
			middleware: this.config.middleware,
			devAuth: this.config.devAuth,
		};
	}

	get cache(): CacheConfig {
		return this.config.cache ?? {};
	}

	get subscriptions(): SubscriptionsConfig {
		return this.config.subscriptions ?? {};
	}

	get persistedQueries(): PersistedQueriesConfig {
		return this.config.persistedQueries ?? {};
	}

	get upload(): UploadConfig {
		return this.config.upload ?? {};
	}

	get debug(): DebugConfig {
		if (typeof this.config.debug === 'boolean') {
			return { logOperations: this.config.debug, logTiming: this.config.debug, logCache: this.config.debug };
		}
		return this.config.debug ?? {};
	}

	get pagination(): PaginationConfig {
		return this.config.pagination ?? {};
	}

	get ssr(): SsrConfig {
		return this.config.ssr ?? {};
	}

	get devtools(): DevtoolsConfig {
		return typeof this.config.devtools === 'boolean' ? {} : this.config.devtools ?? {};
	}

	get isDevtoolsEnabled(): boolean {
		return this.config.devtools === true
			|| (typeof this.config.devtools === 'object' && this.config.devtools.autoConnect !== false);
	}

	get isDebugEnabled(): boolean {
		return this.config.debug === true
			|| (typeof this.config.debug === 'object' && Object.values(this.config.debug).some(Boolean));
	}
}
