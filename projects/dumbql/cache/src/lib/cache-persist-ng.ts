import { InjectionToken, type Provider, ENVIRONMENT_INITIALIZER } from '@angular/core';
import { CachePersistence, type CachePersistConfig } from './cache-persist';

export type { CachePersistConfig };

export const NG_CACHE_PERSIST_CONFIG = new InjectionToken<CachePersistConfig>('NG_CACHE_PERSIST_CONFIG');

export class CachePersistenceService {
	private inner: CachePersistence;

	constructor(config?: CachePersistConfig) {
		this.inner = new CachePersistence(config ?? {});
	}

	persist(data: [string, Record<string, unknown>][]): void {
		this.inner.persist(data);
	}

	persistThrottled(data: [string, Record<string, unknown>][], delay?: number): void {
		this.inner.persistThrottled(data, delay);
	}

	restore(): [string, Record<string, unknown>][] | null {
		return this.inner.restore();
	}

	clear(): void {
		this.inner.clear();
	}
}

export function provideCachePersistence(config?: CachePersistConfig): Provider[] {
	const service = new CachePersistenceService(config);
	return [
		{ provide: CachePersistenceService, useValue: service },
		{
			provide: ENVIRONMENT_INITIALIZER,
			multi: true,
			useValue: () => service,
		},
	];
}
