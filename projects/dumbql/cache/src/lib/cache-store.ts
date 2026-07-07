import { NormalizedCache, type CacheEntity, type OptimisticUpdate, type TypePolicy } from './normalized-cache';
import { CacheGc } from './cache-gc';
import { CachePersistence, type CachePersistConfig } from './cache-persist';
import { CacheEvents } from './cache-events';
import { CacheMetrics } from './cache-metrics';

export interface CacheStoreConfig {
	persist?: CachePersistence | CachePersistConfig;
	typePolicies?: Record<string, TypePolicy>;
}

export class CacheStore {
	readonly cache: NormalizedCache;
	readonly gc: CacheGc;
	readonly events: CacheEvents;
	readonly metrics: CacheMetrics;
	private localState = new Map<string, unknown>();
	private localStateListeners = new Map<string, Set<() => void>>();
	private localStateTypes = new Map<string, Set<string>>();
	private persistSvc: CachePersistence | null = null;

	constructor(config?: CacheStoreConfig) {
		this.cache = new NormalizedCache(config?.typePolicies);
		this.gc = new CacheGc(this.cache);
		this.events = new CacheEvents();
		this.metrics = new CacheMetrics();
		if (config?.persist) {
			const svc = config.persist instanceof CachePersistence
				? config.persist
				: new CachePersistence(config.persist);
			this.persistSvc = svc;
			const restored = svc.restore();
			if (restored) {
				for (const [key, value] of restored) {
					if (key.startsWith('__local__')) {
						this.writeLocal(key.slice(9), value);
					} else {
						this.cache.set(value as CacheEntity);
					}
				}
			}
		}
	}

	query(typename: string, id: string): CacheEntity | undefined {
		const entity = this.cache.get(typename, id);
		this.metrics.recordRead(entity !== undefined);
		this.events.emit({ type: 'read', data: { typename, id, hit: entity !== undefined } });
		return entity;
	}

	write(entity: CacheEntity): void {
		this.cache.set(entity);
		this.metrics.recordWrite();
		this.events.emit({ type: 'write', data: { entity, key: `${entity.__typename}:${entity.id ?? ''}` } });
	}

	merge(entity: Partial<CacheEntity> & { __typename: string; id: string }): void {
		const key = `${entity.__typename}:${entity.id}`;
		const existed = this.cache.get(entity.__typename, entity.id) !== undefined;
		this.cache.merge(entity);
		this.metrics.recordMerge();
		this.events.emit({ type: 'merge', data: { entity, key, existed } });
	}

	evict(typename: string, id: string): void {
		const entity = this.cache.get(typename, id);
		this.cache.remove(typename, id);
		this.metrics.recordEviction();
		this.events.emit({ type: 'evict', data: { typename, id, entity } });
	}

	applyOptimistic(update: OptimisticUpdate): void {
		this.cache.applyOptimistic(update);
		this.events.emit({ type: 'optimistic', data: { action: 'apply', id: update.id } });
	}

	rollbackOptimistic(id: string): void {
		this.cache.rollbackOptimistic(id);
		this.events.emit({ type: 'optimistic', data: { action: 'rollback', id } });
	}

	commitOptimistic(id: string): void {
		this.cache.commitOptimistic(id);
		this.events.emit({ type: 'optimistic', data: { action: 'commit', id } });
	}

	readLocal(key: string): unknown {
		return this.localState.get(key);
	}

	watchLocal(key: string, listener: () => void): () => void {
		const existing = this.localStateListeners.get(key);
		if (existing) {
			existing.add(listener);
		} else {
			this.localStateListeners.set(key, new Set([listener]));
		}
		return () => {
			this.localStateListeners.get(key)?.delete(listener);
		};
	}

	writeLocal<T>(key: string, value: T): void {
		this.localState.set(key, value);
		const listeners = this.localStateListeners.get(key);
		if (listeners) {
			for (const listener of listeners) {
				listener();
			}
		}
	}

	clearLocalState(): void {
		this.localState.clear();
		this.localStateListeners.clear();
		this.localStateTypes.clear();
	}

	writeLocalWithTypes<T>(key: string, value: T, types: Set<string>): void {
		this.localStateTypes.set(key, types);
		this.writeLocal(key, value);
	}

	clearLocalStateByTypes(types: string[]): void {
		if (types.length === 0) return;
		const typeSet = new Set(types);
		const toDelete: string[] = [];
		for (const [key, tracked] of this.localStateTypes) {
			for (const t of tracked) {
				if (typeSet.has(t)) {
					toDelete.push(key);
					break;
				}
			}
		}
		for (const key of toDelete) {
			this.localState.delete(key);
			this.localStateTypes.delete(key);
		}
	}

	serialize(): string {
		return JSON.stringify({
			entities: Array.from(this.cache.all().entries()),
			localState: Array.from(this.localState.entries()),
		});
	}

	deserialize(json: string): void {
		const data = JSON.parse(json);
		for (const [, entity] of data.entities) {
			this.cache.set(entity);
		}
		for (const [key, value] of data.localState) {
			this.writeLocal(key, value);
		}
	}

	setTypePolicies(policies: Record<string, TypePolicy>): void {
		this.cache.setTypePolicies(policies);
	}

	collectGarbage(): number {
		const evicted = this.gc.sweep();
		if (evicted > 0) {
			this.metrics.recordGcRun(evicted);
			const refCounts: Record<string, number> = {};
			for (const typename of this.getEntityTypes()) {
				const entities = this.cache.get(typename);
				if (entities) {
					for (const e of entities) {
						if (e.id) {
							refCounts[`${e.__typename}:${e.id}`] = this.gc.refCountOf(e.__typename, e.id);
						}
					}
				}
			}
			this.events.emit({ type: 'gcSweep', data: { evicted: [], refCounts } });
		}
		return evicted;
	}

	persist(): void {
		if (!this.persistSvc) return;
		const data: [string, Record<string, unknown>][] = [];
		for (const [k, v] of this.cache.all()) {
			data.push([k, v as unknown as Record<string, unknown>]);
		}
		for (const [key, value] of this.localState) {
			data.push([`__local__${key}`, { value }]);
		}
		this.persistSvc.persist(data);
	}

	getMetricsSnapshot(): ReturnType<CacheMetrics['snapshot']> {
		let refCountTotal = 0;
		let danglingCount = 0;
		for (const typename of this.getEntityTypes()) {
			const entities = this.cache.get(typename);
			if (entities) {
				for (const e of entities) {
					if (e.id) {
						const rc = this.gc.refCountOf(e.__typename, e.id);
						if (rc === 0) danglingCount++;
						refCountTotal += rc;
					}
				}
			}
		}
		const sizeEstimate = new Blob([this.serialize()]).size;
		return this.metrics.snapshot(
			this.cache.count(),
			refCountTotal,
			danglingCount,
			this.cache.count(), // optimisticCount is approximate
			this.localState.size,
			sizeEstimate,
		);
	}

	private getEntityTypes(): string[] {
		const types = new Set<string>();
		for (const key of this.cache.all().keys()) {
			const idx = key.indexOf(':');
			if (idx !== -1) types.add(key.slice(0, idx));
		}
		return Array.from(types);
	}
}

export function createCache(config?: CacheStoreConfig): CacheStore {
	return new CacheStore(config);
}
