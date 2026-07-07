import type { CacheEntity } from './normalized-cache';

export interface CacheWriteEvent {
  entity: CacheEntity;
  key: string;
}

export interface CacheEvictEvent {
  typename: string;
  id: string;
  entity?: CacheEntity;
}

export interface CacheGcSweepEvent {
  evicted: string[];
  refCounts: Record<string, number>;
}

export interface CacheOptimisticEvent {
  action: 'apply' | 'rollback' | 'commit';
  id: string;
}

export interface CacheClearEvent {
  entityCount: number;
}

export interface CacheReadEvent {
  typename: string;
  id: string;
  hit: boolean;
}

export interface CacheMergeEvent {
  entity: Partial<CacheEntity> & { __typename: string; id?: string };
  key: string;
  existed: boolean;
}

export type CacheEvent =
  | { type: 'write'; data: CacheWriteEvent }
  | { type: 'evict'; data: CacheEvictEvent }
  | { type: 'gcSweep'; data: CacheGcSweepEvent }
  | { type: 'optimistic'; data: CacheOptimisticEvent }
  | { type: 'clear'; data: CacheClearEvent }
  | { type: 'read'; data: CacheReadEvent }
  | { type: 'merge'; data: CacheMergeEvent };

export type CacheEventListener = (event: CacheEvent) => void;

export class CacheEvents {
  private listeners = new Set<CacheEventListener>();

  on(listener: CacheEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: CacheEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}
