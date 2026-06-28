import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, type Observable } from 'rxjs';
import { NormalizedCache, type CacheEntity, type OptimisticUpdate } from './normalized-cache';
import { CacheGc } from './cache-gc';
import { CachePersistenceService } from './cache-persist';

export interface LocalStateEntry<T = unknown> {
  key: string;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  readonly cache = new NormalizedCache();
  readonly gc = new CacheGc(this.cache);
  private localState = new Map<string, BehaviorSubject<unknown>>();
  private persistSvc: CachePersistenceService | null = null;

  constructor() {
  	try {
  		const svc = inject(CachePersistenceService, { optional: true });
  		if (svc) {
  			this.persistSvc = svc;
  			const restored = svc.restore();
  			if (restored) {
  				for (const [, entity] of restored) {
  					this.cache.set(entity);
  				}
  			}
  		}
  	} catch {
  		// persist service not configured
  	}
  }

  query(typename: string, id: string): CacheEntity | undefined {
  	return this.cache.get(typename, id);
  }

  write(entity: CacheEntity): void {
  	this.cache.set(entity);
  }

  merge(entity: Partial<CacheEntity> & { __typename: string; id: string }): void {
  	this.cache.merge(entity);
  }

  evict(typename: string, id: string): void {
  	this.cache.remove(typename, id);
  }

  applyOptimistic(update: OptimisticUpdate): void {
  	this.cache.applyOptimistic(update);
  }

  rollbackOptimistic(id: string): void {
  	this.cache.rollbackOptimistic(id);
  }

  commitOptimistic(id: string): void {
  	this.cache.commitOptimistic(id);
  }

  readLocal(key: string): unknown {
  	return this.localState.get(key)?.value;
  }

  watchLocal(key: string): Observable<unknown> {
  	const existing = this.localState.get(key);
  	if (existing) {
  		return existing.asObservable();
  	}
  	const subj = new BehaviorSubject<unknown>(undefined);
  	this.localState.set(key, subj);
  	return subj.asObservable();
  }

  writeLocal<T>(key: string, value: T): void {
  	const existing = this.localState.get(key);
  	if (existing) {
  		existing.next(value);
  	} else {
  		this.localState.set(key, new BehaviorSubject<unknown>(value));
  	}
  }

  clearLocalState(): void {
  	this.localState.clear();
  }

  serialize(): string {
  	return JSON.stringify({
  		entities: Array.from(this.cache.all().entries()),
  		localState: Array.from(this.localState.entries()).map(([k, v]) => [k, v.value]),
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

  collectGarbage(): number {
  	return this.gc.sweep();
  }

  persist(): void {
  	this.persistSvc?.persist(this.cache.all());
  }
}
