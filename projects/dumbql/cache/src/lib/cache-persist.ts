import { Injectable, inject, InjectionToken, type Provider, ENVIRONMENT_INITIALIZER } from '@angular/core';
import { type CacheEntity } from './normalized-cache';

export interface CachePersistConfig {
  storageKey?: string;
  throttle?: number;
  version?: string;
  maxAge?: number;
}

export const CACHE_PERSIST_CONFIG = new InjectionToken<CachePersistConfig>('CACHE_PERSIST_CONFIG');

function serializeEntities(entities: Map<string, CacheEntity>): string {
	return JSON.stringify(Array.from(entities.entries()));
}

function deserializeEntities(json: string): Map<string, CacheEntity> {
	return new Map(JSON.parse(json));
}

@Injectable()
export class CachePersistenceService {
  private key: string;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
  	const config = inject(CACHE_PERSIST_CONFIG, { optional: true }) ?? {};
  	this.key = config.storageKey ?? '__dumbql_cache';
  }

  persist(entities: Map<string, CacheEntity>): void {
  	try {
  		localStorage.setItem(this.key, serializeEntities(entities));
  	} catch {
  		// storage full or unavailable
  	}
  }

  persistThrottled(entities: Map<string, CacheEntity>, delay = 1000): void {
  	if (this.timer) clearTimeout(this.timer);
  	this.timer = setTimeout(() => {
  		this.persist(entities);
  		this.timer = null;
  	}, delay);
  }

  restore(): Map<string, CacheEntity> | null {
  	try {
  		const raw = localStorage.getItem(this.key);
  		if (!raw) return null;
  		return deserializeEntities(raw);
  	} catch {
  		return null;
  	}
  }

  clear(): void {
  	try {
  		localStorage.removeItem(this.key);
  	} catch {
  		// ignore
  	}
  }
}

export function provideCachePersistence(config?: CachePersistConfig): Provider[] {
	return [
		...(config ? [{ provide: CACHE_PERSIST_CONFIG, useValue: config }] : []),
		CachePersistenceService,
		{
			provide: ENVIRONMENT_INITIALIZER,
			multi: true,
			useValue: () => inject(CachePersistenceService),
		},
	];
}
