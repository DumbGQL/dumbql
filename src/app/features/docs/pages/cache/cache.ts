import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TuiBadge, TuiChip, TuiTab, TuiTabs } from '@taiga-ui/kit';
import { DocsToc } from '../../../../shared/ui/docs-toc/docs-toc';
import type { TocSection } from '../../../../shared/ui/docs-toc/docs-toc';
import { AnchorDirective } from '../../../../shared/ui/anchor-heading/anchor-heading.directive';
import { DocsApiTable, type ApiEntry } from '../../../../shared/ui/docs-api-table/docs-api-table';
import { DocsStackblitzStarterComponent, type StarterCodes } from '../../../../shared/ui/docs-stackblitz-starter';
import { TocService } from '../../../../shared/services/toc.service';
import { VersionService } from '../../../../shared/services/version.service';

@Component({
  selector: 'app-docs-cache',
  standalone: true,
  imports: [TuiBadge, TuiChip, TuiTabs, TuiTab, DocsToc, AnchorDirective, DocsApiTable, DocsStackblitzStarterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cache.html',
  styleUrl: './cache.scss',
})
export class DocsCache {
  private readonly tocService = inject(TocService);

  protected readonly versionService = inject(VersionService);

  protected readonly packageSince = this.versionService.getPackageSince('@dumbql/cache');

  protected readonly githubUrl = 'https://github.com/DumbGQL/dumbql/tree/main/projects/dumbql/cache/src/lib';

  protected selectedTabIndex = 0;

  protected readonly tabs = ['Docs', 'API', 'Starters'];

  protected readonly tocSections: TocSection[] = [
    { id: 'how-it-works', title: 'How It Works' },
    { id: 'normalized-cache', title: 'NormalizedCache' },
    { id: 'cache-service', title: 'CacheService' },
    { id: 'garbage-collection', title: 'Garbage Collection' },
    { id: 'persistence', title: 'Persistence' },
    { id: 'optimistic-updates', title: 'Optimistic Updates' },
    { id: 'type-policies', title: 'Type Policies' },
    { id: 'local-state', title: 'Local State' },
    { id: 'common-patterns', title: 'Common Patterns' },
  ];

  constructor() {
    this.tocService.sections.set(this.tocSections);
  }

  protected readonly apiEntries: ApiEntry[] = [
    // ── Core Classes ──
    {
      name: 'NormalizedCache',
      description:
        'Low-level normalized entity store. Stores entities in a flat Map<string, CacheEntity> keyed by `TypeName:id`.',
      type: 'class',
    },
    {
      name: 'NormalizedCache.constructor',
      description: 'Creates a new store with optional type policies.',
      type: 'constructor',
      default: 'typePolicies?: Record<string, TypePolicy>',
    },
    {
      name: 'NormalizedCache.get(typename, id?)',
      description: 'Get entity by typename+id, or all entities of a type when id is omitted.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.set(entity)',
      description: 'Store an entity. Overwrites if same key exists.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.merge(entity)',
      description: 'Partial merge — only updates fields present in the input.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.remove(typename, id?)',
      description: 'Remove entity(ies). If id is omitted, removes all of the given typename.',
      type: 'method',
    },
    { name: 'NormalizedCache.all()', description: 'Returns the underlying Map<string, CacheEntity>.', type: 'method' },
    { name: 'NormalizedCache.clear()', description: 'Removes all entities from the store.', type: 'method' },
    { name: 'NormalizedCache.count()', description: 'Returns the number of entities in the store.', type: 'method' },
    {
      name: 'NormalizedCache.has(typename, id)',
      description: 'Returns true if an entity with the given key exists.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.key(typename, id)',
      description: 'Builds the internal key string (`TypeName:id`).',
      type: 'method',
    },
    { name: 'NormalizedCache.snapshot()', description: 'Serializes all entities to a JSON string.', type: 'method' },
    {
      name: 'NormalizedCache.restore(json)',
      description: 'Deserializes and restores entities from a JSON string. Appends to existing data.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.setTypePolicies(policies)',
      description: 'Updates type policies after construction.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.applyOptimistic(update)',
      description: 'Applies an optimistic update on top of current cache.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.rollbackOptimistic(id)',
      description: 'Removes the top-most optimistic layer by id, restoring previous state.',
      type: 'method',
    },
    {
      name: 'NormalizedCache.commitOptimistic(id)',
      description: 'Permanently merges the optimistic layer into the base cache, then removes it.',
      type: 'method',
    },

    // ── CacheStore ──
    {
      name: 'CacheStore',
      description:
        'High-level orchestrator that combines NormalizedCache, CacheGc, local state, and optional persistence.',
      type: 'class',
    },
    {
      name: 'CacheStore.constructor',
      description: 'Creates a CacheStore with optional config.',
      type: 'constructor',
      default: 'config?: CacheStoreConfig',
    },
    {
      name: 'CacheStore.cache',
      description: 'Public readonly reference to the underlying NormalizedCache.',
      type: 'property',
    },
    {
      name: 'CacheStore.gc',
      description: 'Public readonly reference to the underlying CacheGc instance.',
      type: 'property',
    },
    {
      name: 'CacheStore.write(entity)',
      description: 'Writes an entity to the cache with normalization. Tracks GC reference.',
      type: 'method',
    },
    {
      name: 'CacheStore.query(typename, id)',
      description: 'Reads a single entity. Tracks GC reference. Returns undefined if not found.',
      type: 'method',
    },
    {
      name: 'CacheStore.merge(entity)',
      description: 'Partial merge of an entity. Tracks GC reference.',
      type: 'method',
    },
    {
      name: 'CacheStore.evict(typename, id)',
      description: 'Removes an entity and releases its GC reference.',
      type: 'method',
    },
    {
      name: 'CacheStore.persist()',
      description: 'Writes the full cache snapshot (entities + local state) to the persistence layer.',
      type: 'method',
    },
    { name: 'CacheStore.serialize()', description: 'Returns the cache as a JSON string.', type: 'method' },
    {
      name: 'CacheStore.deserialize(json)',
      description: 'Restores cache from a JSON string. Appends to existing data.',
      type: 'method',
    },
    {
      name: 'CacheStore.collectGarbage()',
      description: 'Runs GC sweep and returns the number of evicted entities.',
      type: 'method',
    },
    {
      name: 'CacheStore.applyOptimistic(update)',
      description: 'Applies an optimistic update with key-level change tracking.',
      type: 'method',
    },
    {
      name: 'CacheStore.rollbackOptimistic(id)',
      description: 'Rolls back an optimistic update by id.',
      type: 'method',
    },
    {
      name: 'CacheStore.commitOptimistic(id)',
      description: 'Permanently commits an optimistic update.',
      type: 'method',
    },
    { name: 'CacheStore.readLocal(key)', description: 'Reads a local state value by key.', type: 'method' },
    {
      name: 'CacheStore.writeLocal(key, value)',
      description: 'Writes a local state value. Triggers watchLocal listeners.',
      type: 'method',
    },
    {
      name: 'CacheStore.watchLocal(key, listener)',
      description: 'Subscribes to local state changes. Returns unsubscribe function.',
      type: 'method',
    },
    {
      name: 'CacheStore.writeLocalWithTypes(key, value, types)',
      description: 'Writes local state scoped to a set of GraphQL type names.',
      type: 'method',
    },
    { name: 'CacheStore.clearLocalState()', description: 'Clears all local state values.', type: 'method' },
    {
      name: 'CacheStore.clearLocalStateByTypes(types)',
      description: 'Clears local state values scoped to the given type names.',
      type: 'method',
    },
    { name: 'CacheStore.setTypePolicies(policies)', description: 'Replaces type policies at runtime.', type: 'method' },
    {
      name: 'createCache(config?)',
      description: 'Factory function that returns a new CacheStore instance.',
      type: 'function',
    },

    // ── Angular Service ──
    {
      name: 'CacheService',
      description:
        'Angular `@Injectable()` wrapper around CacheStore. Exposes the same methods plus RxJS watchLocal().',
      type: 'class',
    },
    {
      name: 'CacheService.constructor',
      description: 'Accepts an optional CachePersistenceService for auto-restore on init.',
      type: 'constructor',
      default: 'persistSvc?: CachePersistenceService | null',
    },
    {
      name: 'CacheService.cache',
      description: 'Public readonly reference to the underlying NormalizedCache.',
      type: 'property',
    },
    {
      name: 'CacheService.gc',
      description: 'Public readonly reference to the underlying CacheGc instance.',
      type: 'property',
    },
    {
      name: 'CacheService.write(entity)',
      description: 'Writes an entity with normalization and GC tracking.',
      type: 'method',
    },
    {
      name: 'CacheService.query(typename, id)',
      description: 'Reads a single entity with GC tracking.',
      type: 'method',
    },
    { name: 'CacheService.merge(entity)', description: 'Partial merge with GC tracking.', type: 'method' },
    { name: 'CacheService.evict(typename, id)', description: 'Evicts an entity from the cache.', type: 'method' },
    { name: 'CacheService.persist()', description: 'Persists cache to the configured storage.', type: 'method' },
    { name: 'CacheService.serialize()', description: 'Serializes cache to JSON string.', type: 'method' },
    { name: 'CacheService.deserialize(json)', description: 'Restores cache from JSON string.', type: 'method' },
    { name: 'CacheService.collectGarbage()', description: 'Runs GC sweep, returns evicted count.', type: 'method' },
    { name: 'CacheService.applyOptimistic(update)', description: 'Applies an optimistic update.', type: 'method' },
    { name: 'CacheService.rollbackOptimistic(id)', description: 'Rolls back an optimistic update.', type: 'method' },
    { name: 'CacheService.commitOptimistic(id)', description: 'Commits an optimistic update.', type: 'method' },
    { name: 'CacheService.readLocal(key)', description: 'Reads a local state value.', type: 'method' },
    {
      name: 'CacheService.watchLocal(key)',
      description: 'Returns an `Observable<unknown>` that emits the current value and all subsequent changes.',
      type: 'method',
    },
    { name: 'CacheService.writeLocal(key, value)', description: 'Writes a local state value.', type: 'method' },
    {
      name: 'CacheService.writeLocalWithTypes(key, value, types)',
      description: 'Writes local state scoped to a set of GraphQL type names.',
      type: 'method',
    },
    { name: 'CacheService.clearLocalState()', description: 'Clears all local state.', type: 'method' },
    {
      name: 'CacheService.clearLocalStateByTypes(types)',
      description: 'Clears local state for the given type names.',
      type: 'method',
    },
    { name: 'CacheService.setTypePolicies(policies)', description: 'Sets type policies at runtime.', type: 'method' },
    {
      name: 'provideCacheService(persistSvc?)',
      description: 'Angular provider for CacheService. Also provides GRAPHQL_CACHE token.',
      type: 'function',
    },
    {
      name: 'provideCachePersistence(config?)',
      description: 'Angular provider for CachePersistenceService with auto-init.',
      type: 'function',
    },

    // ── Garbage Collector ──
    { name: 'CacheGc', description: 'Reference-counting garbage collector with optional TTL eviction.', type: 'class' },
    {
      name: 'CacheGc.constructor',
      description: 'Creates a GC instance bound to a NormalizedCache.',
      type: 'constructor',
      default: 'cache: NormalizedCache, ttlMs?: number',
    },
    {
      name: 'CacheGc.track(entities)',
      description: 'Increments reference count for each entity. Called when a query uses an entity.',
      type: 'method',
    },
    {
      name: 'CacheGc.release(entities)',
      description: 'Decrements reference count for each entity. Called when a query disposes.',
      type: 'method',
    },
    {
      name: 'CacheGc.sweep()',
      description:
        'Evicts entities with zero references that have exceeded the TTL. Returns count of evicted entities.',
      type: 'method',
    },
    {
      name: 'CacheGc.refCountOf(typename, id)',
      description: 'Returns the current reference count for a specific entity.',
      type: 'method',
    },

    // ── Persistence ──
    {
      name: 'CachePersistence',
      description: 'Zero-dependency persistence layer using localStorage with memory fallback.',
      type: 'class',
    },
    {
      name: 'CachePersistence.constructor',
      description: 'Creates a persistence instance.',
      type: 'constructor',
      default: 'config?: CachePersistConfig',
    },
    { name: 'CachePersistence.persist(data)', description: 'Stores data to the underlying storage.', type: 'method' },
    {
      name: 'CachePersistence.persistThrottled(data, delay?)',
      description: 'Throttled persist (batching writes). Default delay is 1000ms.',
      type: 'method',
    },
    {
      name: 'CachePersistence.restore()',
      description: 'Loads data from storage. Returns `[string, Record<string, unknown>][] | null`.',
      type: 'method',
    },
    { name: 'CachePersistence.clear()', description: 'Clears all data from storage.', type: 'method' },

    // ── Interfaces ──
    {
      name: 'CacheEntity',
      description: 'Entity interface. Must have at minimum `__typename` and optionally `id`.',
      type: 'interface',
    },
    { name: 'CacheStoreConfig', description: 'CacheStore construction options.', type: 'interface' },
    {
      name: 'CacheStoreConfig.persist',
      description: 'Persistence config — a CachePersistence instance or plain CachePersistConfig object.',
      type: 'property',
      default: 'undefined',
    },
    {
      name: 'CacheStoreConfig.typePolicies',
      description: 'Type policies for custom cache key and merge logic.',
      type: 'property',
      default: 'undefined',
    },
    { name: 'CachePersistConfig', description: 'Persistence configuration options.', type: 'interface' },
    {
      name: 'CachePersistConfig.storageKey',
      description: 'Key prefix used in localStorage.',
      type: 'property',
      default: "'dumbql_cache'",
    },
    {
      name: 'CachePersistConfig.throttle',
      description: 'Minimum interval (ms) between consecutive persist writes.',
      type: 'property',
      default: '1000',
    },
    {
      name: 'CachePersistConfig.version',
      description: 'Schema version string. Persisted data with a different version is discarded on restore.',
      type: 'property',
      default: 'undefined',
    },
    {
      name: 'CachePersistConfig.maxAge',
      description: 'Maximum age (ms) of persisted data. Data older than this is discarded on restore.',
      type: 'property',
      default: 'undefined',
    },
    {
      name: 'CachePersistConfig.storage',
      description: 'Storage backend override: `"localStorage"` (default) or `"memory"`.',
      type: 'property',
      default: "'localStorage'",
    },
    { name: 'TypePolicy', description: 'Customizes caching behavior for a specific GraphQL type.', type: 'interface' },
    {
      name: 'TypePolicy.keyFields',
      description: 'Array of field names used to build the cache key instead of `id`. Example: `["slug"]`.',
      type: 'property',
      default: 'undefined',
    },
    {
      name: 'TypePolicy.merge',
      description:
        'Custom merge strategy: `"append"`, `"prepend"`, or a function `(existing, incoming, options) => result`.',
      type: 'property',
      default: 'undefined',
    },
    {
      name: 'OptimisticUpdate',
      description: 'Describes an optimistic update with apply and rollback callbacks.',
      type: 'interface',
    },
    {
      name: 'OptimisticUpdate.id',
      description: 'Unique identifier for this optimistic update.',
      type: 'property',
      default: '—',
    },
    {
      name: 'OptimisticUpdate.apply',
      description:
        'Function that mutates the cache to reflect the optimistic state. Signature: `(cache: Map<string, CacheEntity>) => void`.',
      type: 'property',
      default: '—',
    },
    {
      name: 'OptimisticUpdate.rollback',
      description:
        'Function that restores the cache to the previous state. Signature: `(previous: Map<string, CacheEntity>) => void`.',
      type: 'property',
      default: '—',
    },
  ];

  protected readonly normalizedCacheCode = `import { NormalizedCache } from '@dumbql/cache';

const nc = new NormalizedCache();

// Store entities — keys are built automatically
nc.set({ __typename: 'Todo', id: '1', title: 'Dune', done: false });

// Read single
const todo = nc.get('Todo', '1');

// Read all entities of a type
const allTodos = nc.get('Todo');

// Partial merge
nc.merge({ __typename: 'Todo', id: '1', done: true });

// Remove
nc.remove('Todo', '1');

// Snapshot / restore for serialization
const json = nc.snapshot();
nc.restore(json);

console.log(nc.count()); // number of entities in store`;

  protected readonly howItWorksCode = `// 1. Server returns nested response
const serverData = {
  todos: [
    { id: '1', title: 'Hello', author: { id: '1', name: 'Alice' } },
    { id: '2', title: 'World', author: { id: '1', name: 'Alice' } },
  ],
};

// 2. Each object is stored flat, keyed by __typename:id
cache.write({ __typename: 'Todo', id: '1', title: 'Hello', author: { __typename: 'User', id: '1' } });
cache.write({ __typename: 'Todo', id: '2', title: 'World', author: { __typename: 'User', id: '1' } });
cache.write({ __typename: 'User', id: '1', name: 'Alice' });

// 3. Query result now only stores references
// todos → [Todo:1, Todo:2], Todo:1.author → User:1

// 4. Mutate User:1 — all queries see the change automatically
cache.merge({ __typename: 'User', id: '1', name: 'Alice (updated)' });

// 5. No data duplication: User:1 stored once, referenced from both todos`;

  protected readonly cacheServiceCode = `import { provideCacheService, provideCachePersistence } from '@dumbql/cache/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbqlCore({ link: createHttpLink({ uri: '/graphql' }) }),
    provideCacheService(),
    provideCachePersistence({ storageKey: 'my_cache', version: '1' }),
  ],
};

// In any component:
class TodoList {
  private cache = inject(CacheService);
  private graphql = inject(GraphqlService);

  load() {
    this.graphql.query(gql\`{ todos { id title done } }\`).subscribe(res => {
      for (const todo of res.data.todos) {
        this.cache.write(todo);
      }
    });
  }
}`;

  protected readonly gcCode = `import { CacheGc } from '@dumbql/cache';

const gc = new CacheGc(normalizedCache, 60_000); // 60s TTL

// Increment reference when a query result uses an entity
gc.track([{ __typename: 'Todo', id: '1' }]);

// Decrement when the query is no longer subscribed
gc.release([{ __typename: 'Todo', id: '1' }]);

// Evict entities dangling beyond TTL
const evicted = gc.sweep(); // number of entities removed

// Check ref count
console.log(gc.refCountOf('Todo', '1')); // 0 after release+sweep`;

  protected readonly persistenceCode = `import { CachePersistence, createCache } from '@dumbql/cache';

// With versioning and max age
const persist = new CachePersistence({
  storageKey: 'my_cache',   // localStorage key
  version: 'v2',            // bump to invalidate old caches
  maxAge: 3600_000,         // auto-evict after 1 hour
  throttle: 500,            // debounce writes
  storage: 'localStorage',
});

const cache = createCache({ persist });
// Automatically restores on creation

// Manual persist
cache.persist();

// Clear persisted data
persist.clear();`;

  protected readonly optimisticCode = `const cache = inject(CacheService);

cache.applyOptimistic({
  id: 'opt-like-42',
  apply: (entities) => {
    const post = entities.get('Post:42');
    if (post) {
      entities.set('Post:42', {
        ...post,
        likes: (post.likes as number) + 1,
      });
    }
  },
  rollback: () => {
    // Keys changed by apply() are restored automatically
  },
});

// On success:
cache.commitOptimistic('opt-like-42');
// On error:
cache.rollbackOptimistic('opt-like-42');`;

  protected readonly typePoliciesCode = `import { CacheStore } from '@dumbql/cache';

const cache = new CacheStore({
  typePolicies: {
    // Custom key: use 'slug' instead of 'id'
    Post: {
      keyFields: ['slug'],
    },
    // Compound key: locale + key
    Translation: {
      keyFields: ['locale', 'key'],
    },
    // Pagination: append incoming items
    PaginatedPosts: {
      merge: (existing, incoming) => ({
        ...incoming,
        items: [...(existing?.items ?? []), ...incoming.items],
      }),
    },
    // Built-in modes
    LogEntries: { merge: 'append' },
    Notifications: { merge: 'prepend' },
  },
});`;

  protected readonly localStateCode = `import { CacheStore } from '@dumbql/cache';

const cache = new CacheStore();

// Store UI state alongside entities
cache.writeLocal('sidebarOpen', true);
cache.writeLocal('filter', { status: 'active', search: '' });

// Read
const open = cache.readLocal('sidebarOpen');

// Watch for changes
cache.watchLocal('filter', () => {
  console.log('filter:', cache.readLocal('filter'));
});

// Scoped local state — auto-cleared with entity types
cache.writeLocalWithTypes('selectedPost', '42', new Set(['Post']));
cache.clearLocalStateByTypes(['Post']); // also clears 'selectedPost'`;

  protected readonly commonPatternsPaginationCode = `// Type policy for cursor-based pagination
const cache = new CacheStore({
  typePolicies: {
    PostConnection: {
      merge: (existing, incoming, { args }) => {
        if (!args?.after) return incoming; // first page, replace
        return {
          ...incoming,
          edges: [...(existing?.edges ?? []), ...incoming.edges],
        };
      },
    },
  },
});

// After each page fetch:
cache.merge(pageData);`;

  protected readonly cacheStarters: StarterCodes = {
    vanilla: `import { createCache, NormalizedCache } from '@dumbql/cache';

// Create a cache store
const cache = createCache();

// Write an entity — normalized by __typename + id
cache.write({ __typename: 'Todo', id: '1', title: 'Hello', done: false });

// Partial merge — only updates provided fields
cache.merge({ __typename: 'Todo', id: '1', done: true });

// Read entity
const todo = cache.query('Todo', '1');
console.log(todo); // { __typename: 'Todo', id: '1', title: 'Hello', done: true }

// Use NormalizedCache directly for low-level access
const nc = new NormalizedCache();
nc.set({ __typename: 'Book', id: '42', title: 'Dune' });
nc.set({ __typename: 'Book', id: '43', title: 'Neuromancer' });
console.log(nc.get('Book')); // all Book entities
console.log(nc.count()); // 2
`,
    angular: `import { provideCacheService, CacheService } from '@dumbql/cache/angular';
import { provideDumbql } from '@dumbql/core';
import { createHttpLink } from '@dumbql/core/link';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDumbql({ link: createHttpLink({ uri: '/graphql' }) }),
    provideCacheService(),
  ],
};

// In a component:
@Component({ ... })
export class TodoListComponent {
  private cache = inject(CacheService);

  loadTodos() {
    const todos = this.cache.query('Todo');
    console.log(todos);
  }

  updateTodo() {
    this.cache.merge({ __typename: 'Todo', id: '1', done: true });
  }
}
`,
    react: `import { DumbqlProvider, useCache, useQuery, gql } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

function TodoList() {
  const cacheStore = useCache();

  const { data } = useQuery(gql\`{ todos { id title done } }\`, {
    onCompleted(result) {
      for (const todo of result.data.todos) {
        cacheStore?.write(todo);
      }
    },
  });

  return <pre>{JSON.stringify(cacheStore?.query('Todo'), null, 2)}</pre>;
}

function App() {
  return (
    <DumbqlProvider client={client} cache={cache}>
      <TodoList />
    </DumbqlProvider>
  );
}
`,
    vue: `import { createDumbqlPlugin, useCache, useQuery, gql } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';
import { createApp } from 'vue';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();
const app = createApp(App);
app.use(createDumbqlPlugin(client, cache));

// In a component:
<script setup lang="ts">
const cacheStore = useCache();
const { data } = useQuery(gql\`{ todos { id title done } }\`);

watch(data, (val) => {
  if (val?.todos) {
    for (const todo of val.todos) {
      cacheStore?.write(todo);
    }
  }
});
</script>

<template>
  <pre>{{ cacheStore?.query('Todo') }}</pre>
</template>
`,
  };

  protected readonly commonPatternsReactiveCode = `// Angular: reactive local state with RxJS
@Component({ ... })
class SidebarComponent {
  private cache = inject(CacheService);
  readonly isOpen$ = this.cache.watchLocal('sidebarOpen');

  toggle() {
    const current = this.cache.readLocal('sidebarOpen');
    this.cache.writeLocal('sidebarOpen', !current);
  }
}`;
}
