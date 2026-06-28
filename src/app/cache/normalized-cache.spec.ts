import { describe, it, expect } from 'vitest';
import { NormalizedCache } from '@dumbql/cache';

describe('NormalizedCache', () => {
  function createCache(): NormalizedCache {
    return new NormalizedCache();
  }

  const user1 = { __typename: 'User', id: '1', name: 'Alice', age: 30 };
  const user2 = { __typename: 'User', id: '2', name: 'Bob', age: 25 };
  const post1 = { __typename: 'Post', id: '10', title: 'Hello' };

  describe('key', () => {
    it('generates composite key from typename and id', () => {
      const cache = createCache();
      expect(cache.key('User', '1')).toBe('User:1');
      expect(cache.key('Post', 'abc')).toBe('Post:abc');
    });
  });

  describe('set / get', () => {
    it('stores and retrieves entities by typename + id', () => {
      const cache = createCache();
      cache.set(user1);
      expect(cache.get('User', '1')).toEqual(user1);
    });

    it('returns undefined for missing entity', () => {
      const cache = createCache();
      expect(cache.get('User', 'nonexistent')).toBeUndefined();
    });

    it('overwrites existing entity with same key', () => {
      const cache = createCache();
      cache.set(user1);
      cache.set({ ...user1, age: 31 });
      expect(cache.get('User', '1')!['age']).toBe(31);
    });

    it('stores entities with different types separately', () => {
      const cache = createCache();
      cache.set(user1);
      cache.set(post1);
      expect(cache.get('User', '1')).toEqual(user1);
      expect(cache.get('Post', '10')).toEqual(post1);
    });

    it('ignores entity without __typename', () => {
      const cache = createCache();
      cache.set({ id: '1', name: 'no-type' } as never);
      expect(cache.get('User', '1')).toBeUndefined();
      expect(cache.count()).toBe(0);
    });

    it('ignores entity without id', () => {
      const cache = createCache();
      cache.set({ __typename: 'User', name: 'no-id' } as never);
      expect(cache.count()).toBe(0);
    });
  });

  describe('merge', () => {
    it('adds new entity when key does not exist', () => {
      const cache = createCache();
      cache.merge({ __typename: 'User', id: '1', name: 'Alice' });
      expect(cache.get('User', '1')).toEqual({ __typename: 'User', id: '1', name: 'Alice' });
    });

    it('deep-merges fields into existing entity', () => {
      const cache = createCache();
      cache.set(user1);
      cache.merge({ __typename: 'User', id: '1', age: 31, role: 'admin' });
      const merged = cache.get('User', '1')!;
      expect(merged['name']).toBe('Alice');
      expect(merged['age']).toBe(31);
      expect(merged['role']).toBe('admin');
    });

    it('overwrites existing field with new value', () => {
      const cache = createCache();
      cache.set(user1);
      cache.merge({ __typename: 'User', id: '1', name: 'Alicia' });
      expect(cache.get('User', '1')!['name']).toBe('Alicia');
    });
  });

  describe('remove', () => {
    it('removes entity from cache', () => {
      const cache = createCache();
      cache.set(user1);
      cache.remove('User', '1');
      expect(cache.get('User', '1')).toBeUndefined();
    });

    it('does nothing when removing nonexistent entity', () => {
      const cache = createCache();
      expect(() => cache.remove('User', 'ghost')).not.toThrow();
    });
  });

  describe('all', () => {
    it('returns all entities as a map copy', () => {
      const cache = createCache();
      cache.set(user1);
      cache.set(user2);
      const all = cache.all();
      expect(all.size).toBe(2);
      expect(all.get('User:1')).toEqual(user1);
      expect(all.get('User:2')).toEqual(user2);
    });

    it('returns a copy not a reference', () => {
      const cache = createCache();
      cache.set(user1);
      const all = cache.all();
      all.clear();
      expect(cache.count()).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all entities and optimistic updates', () => {
      const cache = createCache();
      cache.set(user1);
      cache.set(user2);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => entities.set('Custom:1', { __typename: 'Custom', id: '1' }),
        rollback: () => {},
      });
      // applyOptimistic adds one more entity via apply()
      expect(cache.count()).toBe(3);
      cache.clear();
      expect(cache.count()).toBe(0);
      expect(cache.get('User', '1')).toBeUndefined();
    });
  });

  describe('optimistic updates', () => {
    it('applyOptimistic applies mutation to entities', () => {
      const cache = createCache();
      cache.set(user1);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => {
          const e = entities.get('User:1')!;
          entities.set('User:1', { ...e, name: 'Optimistic Alice' });
        },
        rollback: () => {},
      });
      expect(cache.get('User', '1')!['name']).toBe('Optimistic Alice');
    });

    it('rollbackOptimistic restores previous state', () => {
      const cache = createCache();
      cache.set(user1);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => {
          const e = entities.get('User:1')!;
          entities.set('User:1', { ...e, name: 'Optimistic Alice' });
        },
        rollback: () => {},
      });
      cache.rollbackOptimistic('opt-1');
      expect(cache.get('User', '1')!['name']).toBe('Alice');
    });

    it('commitOptimistic keeps changes and removes tracking', () => {
      const cache = createCache();
      cache.set(user1);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => {
          const e = entities.get('User:1')!;
          entities.set('User:1', { ...e, name: 'Committed' });
        },
        rollback: () => {},
      });
      cache.commitOptimistic('opt-1');
      expect(cache.get('User', '1')!['name']).toBe('Committed');
    });

    it('can apply multiple optimistic updates', () => {
      const cache = createCache();
      cache.set(user1);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => {
          const e = entities.get('User:1')!;
          entities.set('User:1', { ...e, name: 'First' });
        },
        rollback: () => {},
      });
      cache.applyOptimistic({
        id: 'opt-2',
        apply: (entities) => {
          const e = entities.get('User:1')!;
          entities.set('User:1', { ...e, name: 'Second' });
        },
        rollback: () => {},
      });
      expect(cache.get('User', '1')!['name']).toBe('Second');
    });

    it('rollback of first optimistic reverts to snapshot before both', () => {
      const cache = createCache();
      cache.set(user1);
      cache.applyOptimistic({
        id: 'opt-1',
        apply: (entities) => entities.set('User:1', { ...user1, name: 'First' }),
        rollback: () => {},
      });
      cache.applyOptimistic({
        id: 'opt-2',
        apply: (entities) => entities.set('User:1', { ...user1, name: 'Second' }),
        rollback: () => {},
      });
      cache.rollbackOptimistic('opt-1');
      expect(cache.get('User', '1')!['name']).toBe('Alice');
    });
  });

  describe('snapshot / restore', () => {
    it('serializes and deserializes entities', () => {
      const cache = createCache();
      cache.set(user1);
      cache.set(user2);
      const json = cache.snapshot();
      const cache2 = createCache();
      cache2.restore(json);
      expect(cache2.count()).toBe(2);
      expect(cache2.get('User', '1')).toEqual(user1);
      expect(cache2.get('User', '2')).toEqual(user2);
    });

    it('restore replaces all entities', () => {
      const cache = createCache();
      cache.set(user1);
      cache.restore(JSON.stringify([['Post:10', post1]]));
      expect(cache.count()).toBe(1);
      expect(cache.get('Post', '10')).toEqual(post1);
      expect(cache.get('User', '1')).toBeUndefined();
    });
  });

  describe('count', () => {
    it('returns correct entity count', () => {
      const cache = createCache();
      expect(cache.count()).toBe(0);
      cache.set(user1);
      expect(cache.count()).toBe(1);
      cache.set(user2);
      expect(cache.count()).toBe(2);
      cache.remove('User', '1');
      expect(cache.count()).toBe(1);
    });
  });

  describe('gc', () => {
    it('is a no-op stub', () => {
      const cache = createCache();
      cache.set(user1);
      expect(() => cache.gc()).not.toThrow();
      expect(cache.count()).toBe(1);
    });
  });
});
