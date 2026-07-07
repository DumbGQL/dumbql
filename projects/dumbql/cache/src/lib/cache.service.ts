import { BehaviorSubject, Observable } from 'rxjs';
import { type CacheEntity, type OptimisticUpdate, type TypePolicy } from './normalized-cache';
import { CacheStore } from './cache-store';
import { CachePersistenceService } from './cache-persist-ng';
import { type CacheEvent, CacheEvents } from './cache-events';
import { type CacheMetricsSnapshot, CacheMetrics } from './cache-metrics';
import { type Provider } from '@angular/core';
import { GRAPHQL_CACHE } from './tokens';
import { filter } from 'rxjs/operators';

export class CacheService {
	private store = new CacheStore();
	readonly cache = this.store.cache;
	readonly gc = this.store.gc;
	readonly events: CacheEvents;
	readonly metrics: CacheMetrics;

	private localStateSubject = new Map<string, BehaviorSubject<unknown>>();
	private persistSvc: CachePersistenceService | null = null;

	constructor(persistSvc?: CachePersistenceService | null) {
		this.events = this.store.events;
		this.metrics = this.store.metrics;
		this.persistSvc = persistSvc ?? null;
		if (this.persistSvc) {
			const restored = this.persistSvc.restore();
			if (restored) {
				for (const [key, value] of restored) {
					if (key.startsWith('__local__')) {
						this.writeLocal(key.slice(9), value);
					} else {
						this.store.cache.set(value as CacheEntity);
					}
				}
			}
		}
	}

	query(typename: string, id: string): CacheEntity | undefined {
		return this.store.query(typename, id);
	}

	write(entity: CacheEntity): void {
		this.store.write(entity);
	}

	merge(entity: Partial<CacheEntity> & { __typename: string; id: string }): void {
		this.store.merge(entity);
	}

	evict(typename: string, id: string): void {
		this.store.evict(typename, id);
	}

	applyOptimistic(update: OptimisticUpdate): void {
		this.store.applyOptimistic(update);
	}

	rollbackOptimistic(id: string): void {
		this.store.rollbackOptimistic(id);
	}

	commitOptimistic(id: string): void {
		this.store.commitOptimistic(id);
	}

	readLocal(key: string): unknown {
		return this.store.readLocal(key);
	}

	watchLocal(key: string): Observable<unknown> {
		const existing = this.localStateSubject.get(key);
		if (existing) {
			return existing.asObservable();
		}
		const subj = new BehaviorSubject<unknown>(this.store.readLocal(key));
		this.localStateSubject.set(key, subj);
		this.store.watchLocal(key, () => {
			subj.next(this.store.readLocal(key));
		});
		return subj.asObservable();
	}

	writeLocal<T>(key: string, value: T): void {
		this.store.writeLocal(key, value);
	}

	clearLocalState(): void {
		this.localStateSubject.clear();
		this.store.clearLocalState();
	}

	writeLocalWithTypes<T>(key: string, value: T, types: Set<string>): void {
		this.store.writeLocalWithTypes(key, value, types);
	}

	clearLocalStateByTypes(types: string[]): void {
		this.store.clearLocalStateByTypes(types);
	}

	serialize(): string {
		return this.store.serialize();
	}

	deserialize(json: string): void {
		this.store.deserialize(json);
	}

	setTypePolicies(policies: Record<string, TypePolicy>): void {
		this.store.setTypePolicies(policies);
	}

	collectGarbage(): number {
		return this.store.collectGarbage();
	}

	persist(): void {
		if (!this.persistSvc) return;
		const data: [string, Record<string, unknown>][] = [];
		for (const [k, v] of this.store.cache.all()) {
			data.push([k, v as unknown as Record<string, unknown>]);
		}
		for (const [k, v] of this.localStateSubject) {
			data.push([`__local__${k}`, { value: v.value }]);
		}
		this.persistSvc.persist(data);
	}

	onEvent(): Observable<CacheEvent> {
		return new Observable<CacheEvent>((subscriber) => {
			const unsubscribe = this.events.on((event) => subscriber.next(event));
			return () => unsubscribe();
		});
	}

	onWrite(): Observable<CacheEvent & { type: 'write' }> {
		return this.onEvent().pipe(filter((e): e is CacheEvent & { type: 'write' } => e.type === 'write'));
	}

	onEvict(): Observable<CacheEvent & { type: 'evict' }> {
		return this.onEvent().pipe(filter((e): e is CacheEvent & { type: 'evict' } => e.type === 'evict'));
	}

	onGcSweep(): Observable<CacheEvent & { type: 'gcSweep' }> {
		return this.onEvent().pipe(filter((e): e is CacheEvent & { type: 'gcSweep' } => e.type === 'gcSweep'));
	}

	onOptimistic(): Observable<CacheEvent & { type: 'optimistic' }> {
		return this.onEvent().pipe(filter((e): e is CacheEvent & { type: 'optimistic' } => e.type === 'optimistic'));
	}

	getMetricsSnapshot(): CacheMetricsSnapshot {
		return this.store.getMetricsSnapshot();
	}
}

export function provideCacheService(persistSvc?: CachePersistenceService): Provider[] {
	const service = new CacheService(persistSvc);
	return [
		{ provide: CacheService, useValue: service },
		{ provide: GRAPHQL_CACHE, useExisting: CacheService },
	];
}
