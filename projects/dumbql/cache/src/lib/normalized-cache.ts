export interface CacheEntity {
  __typename: string;
  id?: string;
  [key: string]: unknown;
}

export interface OptimisticUpdate {
  id: string;
  apply: (cache: Map<string, CacheEntity>) => void;
  rollback: (previous: Map<string, CacheEntity>) => void;
}

let inlineCounter = 0;

function inlineKey(typename: string): string {
  return `${typename}:__inline__${++inlineCounter}`;
}

export class NormalizedCache {
  private entities = new Map<string, CacheEntity>();
  private optimistics = new Map<string, OptimisticUpdate>();

  /** Build a cache key for a typed id. */
  key(typename: string, id: string): string {
  	return `${typename}:${id}`;
  }

  get<T extends CacheEntity = CacheEntity>(typename: string, id: string): T | undefined;
  get<T extends CacheEntity = CacheEntity>(typename: string): T[] | undefined;
  get<T extends CacheEntity = CacheEntity>(typename: string, id?: string): T | T[] | undefined {
  	if (id !== undefined) {
  		return this.entities.get(this.key(typename, id)) as T | undefined;
  	}
  	const results: T[] = [];
  	const prefix = `${typename}:__inline__`;
  	for (const [k, v] of this.entities) {
  		if (k.startsWith(prefix) || k.startsWith(`${typename}:`)) {
  			results.push(v as T);
  		}
  	}
  	return results.length ? results : undefined;
  }

  /**
   * Store an entity.
   * - With `id`: stored as `TypeName:id`
   * - Without `id`: stored as `TypeName:__inline__N` (no data loss)
   */
  set(entity: CacheEntity): void {
  	if (!entity.__typename) return;
  	const t = entity.__typename;
  	const k = entity.id ? this.key(t, entity.id) : inlineKey(t);
  	this.entities.set(k, entity);
  }

  /**
   * Merge partial fields into an existing entity.
   * Creates one with `id: '__inline__N'` if no id given.
   */
  merge(entity: Partial<CacheEntity> & { __typename: string; id?: string }): void {
  	const k = entity.id
  		? this.key(entity.__typename, entity.id)
  		: inlineKey(entity.__typename);
  	const existing = this.entities.get(k) ?? { __typename: entity.__typename } as CacheEntity;
  	this.entities.set(k, { ...existing, ...entity });
  }

  remove(typename: string, id?: string): void {
  	if (id !== undefined) {
  		this.entities.delete(this.key(typename, id));
  		return;
  	}
  	// Remove all entities of this type
  	for (const key of this.entities.keys()) {
  		if (key.startsWith(`${typename}:`)) {
  			this.entities.delete(key);
  		}
  	}
  }

  all(): Map<string, CacheEntity> {
  	return new Map(this.entities);
  }

  clear(): void {
  	this.entities.clear();
  	this.optimistics.clear();
  }

  /**
   * Apply an optimistic update with key-level rollback.
   * Only keys that were actually changed by `apply()` are restored on rollback,
   * preserving changes from other concurrent optimistic updates.
   *
   * NOTE: If two optimistic updates modify the **same entity key**, rolling back
   * the first one will revert its changes and may overwrite the second one's.
   * This is a known limitation — avoid concurrent optimistics on the same key,
   * or always commit/rollback in LIFO order.
   */
  applyOptimistic(update: OptimisticUpdate): void {
  	const before = new Map(this.entities);
  	update.apply(this.entities);

  	// Compute only the keys that changed
  	const changed = new Map<string, CacheEntity | undefined>();
  	for (const [k, v] of this.entities) {
  		const prev = before.get(k);
  		if (prev !== v) {
  			changed.set(k, prev);
  		}
  	}
  	for (const [k, v] of before) {
  		if (!this.entities.has(k)) {
  			changed.set(k, v);
  		}
  	}

  	this.optimistics.set(update.id, {
  		...update,
  		rollback: () => {
  			for (const [k, prevVal] of changed) {
  				if (prevVal === undefined) {
  					this.entities.delete(k);
  				} else {
  					this.entities.set(k, prevVal);
  				}
  			}
  			this.optimistics.delete(update.id);
  		},
  	});
  }

  rollbackOptimistic(id: string): void {
  	const update = this.optimistics.get(id);
  	if (update) {
  		update.rollback(this.entities);
  	}
  }

  commitOptimistic(id: string): void {
  	this.optimistics.delete(id);
  }

  snapshot(): string {
  	return JSON.stringify({
  		entities: Array.from(this.entities.entries()),
  		inlineCounter,
  	});
  }

  restore(json: string): void {
  	const data = JSON.parse(json);
  	this.entities = new Map(data.entities);
  	inlineCounter = data.inlineCounter ?? 0;
  }

  count(): number {
  	return this.entities.size;
  }
}
