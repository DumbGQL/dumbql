export interface CacheEntity {
  __typename: string;
  id: string;
  [key: string]: unknown;
}

export interface OptimisticUpdate {
  id: string;
  apply: (cache: Map<string, CacheEntity>) => void;
  rollback: (previous: Map<string, CacheEntity>) => void;
}

export class NormalizedCache {
  private entities = new Map<string, CacheEntity>();
  private optimistics = new Map<string, OptimisticUpdate>();

  key(typename: string, id: string): string {
  	return `${typename}:${id}`;
  }

  get(typename: string, id: string): CacheEntity | undefined {
  	return this.entities.get(this.key(typename, id));
  }

  set(entity: CacheEntity): void {
  	if (entity.__typename && entity.id) {
  		this.entities.set(this.key(entity.__typename, entity.id), entity);
  	}
  }

  merge(entity: Partial<CacheEntity> & { __typename: string; id: string }): void {
  	const k = this.key(entity.__typename, entity.id);
  	const existing = this.entities.get(k) ?? {} as CacheEntity;
  	this.entities.set(k, { ...existing, ...entity });
  }

  remove(typename: string, id: string): void {
  	this.entities.delete(this.key(typename, id));
  }

  all(): Map<string, CacheEntity> {
  	return new Map(this.entities);
  }

  clear(): void {
  	this.entities.clear();
  	this.optimistics.clear();
  }

  applyOptimistic(update: OptimisticUpdate): void {
  	this.optimistics.set(update.id, update);
  	const snapshot = new Map(this.entities);
  	update.apply(this.entities);
  	this.optimistics.set(update.id, {
  		...update,
  		rollback: () => {
  			this.entities = new Map(snapshot);
  		},
  	});
  }

  rollbackOptimistic(id: string): void {
  	const update = this.optimistics.get(id);
  	if (update) {
  		update.rollback(this.entities);
  		this.optimistics.delete(id);
  	}
  }

  commitOptimistic(id: string): void {
  	this.optimistics.delete(id);
  }

  snapshot(): string {
  	return JSON.stringify(Array.from(this.entities.entries()));
  }

  restore(json: string): void {
  	this.entities = new Map(JSON.parse(json));
  }

  gc(): void {
  	// no-op: entities persist until explicitly removed
  	// future: reference counting
  }

  count(): number {
  	return this.entities.size;
  }
}
