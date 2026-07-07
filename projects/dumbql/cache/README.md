<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/core/assets/logo.svg" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/cache</h1>

<p align="center"><b>Normalized in-memory entity cache for GraphQL — __typename:id keying, GC, persistence, optimistic updates.</b></p>

<p align="center">
  <a href="#how-it-works">How It Works</a> •
  <a href="#install">Install</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#normalized-cache">NormalizedCache</a> •
  <a href="#cache-store">CacheStore</a> •
  <a href="#garbage-collection">GC</a> •
  <a href="#type-policies">Type Policies</a> •
  <a href="#persistence">Persistence</a> •
  <a href="#optimistic-updates">Optimistic Updates</a> •
  <a href="#local-state">Local State</a>
</p>

---

## How It Works

Every GraphQL response is **normalized** into a flat dictionary of entities, keyed by `TypeName:id`. Instead of storing nested response trees, the cache stores each object once and references it by key.

```
Response:                    NormalizedCache (flat Map):
┌──────────────────┐        ┌──────────────────────────┐
│ {                │        │ "Todo:1" → {             │
│   todos: [       │   ──►  │   __typename: "Todo",    │
│     { id:1,      │        │   id: "1",               │
│       title:"A", │        │   title: "A",             │
│       author: {  │        │   done: false             │
│         id:1,    │        │ }                        │
│         name:"B" │        │ "User:1" → {             │
│       }          │        │   __typename: "User",    │
│     }            │        │   id: "1",               │
│   ]              │        │   name: "B"              │
│ }                │        │ }                        │
└──────────────────┘        └──────────────────────────┘
```

**Benefits:** no data duplication, automatic updates (mutate `User:1` → all queries referencing it see the change), consistent cache across the app.

### Layers

```
┌─────────────────────────────────────────────────────┐
│                   CacheService                       │  ← Angular DI wrapper
│   watchLocal() returns Observable, auto-persist     │
├─────────────────────────────────────────────────────┤
│                    CacheStore                        │  ← Orchestrator
│   query / write / merge / evict / optimistic / gc  │
│   local state / persist / serialize                 │
├─────────────────────────────────────────────────────┤
│  NormalizedCache    CacheGc    CachePersistence     │  ← Core primitives
│  entity store       ref-count  localStorage/memory  │
│  + type policies    + TTL      + version/maxAge     │
└─────────────────────────────────────────────────────┘
```

---

## Install

```bash
npm install @dumbql/cache
```

Zero dependencies for framework-agnostic usage.

---

## Quick Start

### Framework-agnostic

```typescript
import { CacheStore, createCache } from '@dumbql/cache';

const cache = createCache();
// or: new CacheStore()

// Write after a query
cache.write({ __typename: 'Todo', id: '1', title: 'Hello', done: false });

// Read later
const todo = cache.query('Todo', '1'); // => { __typename: 'Todo', id: '1', ... }

// Watch local UI state
cache.writeLocal('sidebarOpen', true);
const val = cache.readLocal('sidebarOpen'); // true
```

### Angular

```typescript
import { provideCacheService } from '@dumbql/cache/angular';
import { provideCachePersistence } from '@dumbql/cache/angular';

bootstrapApplication(App, {
  providers: [provideCacheService(), provideCachePersistence({ storageKey: 'my_cache' })],
});

// Anywhere in your app:
class TodoService {
  private cache = inject(CacheService);

  loadTodos() {
    this.graphql
      .query(gql`
        {
          todos {
            id
            title
          }
        }
      `)
      .subscribe((res) => {
        for (const todo of res.data.todos) {
          this.cache.write(todo);
        }
      });
  }
}
```

---

## NormalizedCache

`NormalizedCache` is the low-level entity store. It stores entities in a flat `Map<string, CacheEntity>` keyed by `TypeName:id`.

```typescript
import { NormalizedCache } from '@dumbql/cache';

const nc = new NormalizedCache();

// Store
nc.set({ __typename: 'Todo', id: '1', title: 'Dune', done: false });

// Read single
const todo = nc.get('Todo', '1');

// Read all of type
const allTodos = nc.get('Todo'); // Todo[] | undefined

// Partial merge
nc.merge({ __typename: 'Todo', id: '1', done: true });

// Remove
nc.remove('Todo', '1');

// Snapshot / restore (serialization)
const json = nc.snapshot();
nc.restore(json);
```

### Key Building

| Scenario                                            | Key                                 |
| --------------------------------------------------- | ----------------------------------- |
| Entity with `id`                                    | `Todo:1`                            |
| Custom keyFields: `keyFields: ['slug']`             | `Post:my-post-slug`                 |
| Multiple keyFields: `keyFields: ['locale', 'slug']` | `Translation:en.hello`              |
| No `id`, no keyFields                               | `Todo:__inline__1` (auto-increment) |

---

## CacheStore

`CacheStore` combines `NormalizedCache` + `CacheGc` + local state + persistence into a single orchestrator.

```typescript
import { CacheStore, createCache } from '@dumbql/cache';

const cache = createCache({
  typePolicies: { ... },
  persist: { storageKey: 'my_cache' },
});

// Convenience methods (delegate to NormalizedCache)
cache.query('Todo', '1');
cache.write(entity);
cache.merge(entity);
cache.evict('Todo', '1');

// Optimistic updates
cache.applyOptimistic(update);
cache.commitOptimistic('opt-1');
cache.rollbackOptimistic('opt-1');

// Local state
cache.writeLocal('filter', 'active');
cache.readLocal('filter');
cache.watchLocal('filter', () => { ... });

// Serialization
const json = cache.serialize();
cache.deserialize(json);

// Persistence
cache.persist();

// Garbage collection
cache.collectGarbage();
```

### Factory

```typescript
function createCache(config?: CacheStoreConfig): CacheStore;
```

---

## Garbage Collection

`CacheGc` uses **reference counting** with **TTL eviction**.

### How it works

1. **`track(entities)`** — increments refcount for entity keys. Called when a query result references entities.
2. **`release(entities)`** — decrements refcount. When refcount reaches 0, the entity is marked as **dangling** with a timestamp.
3. **`sweep()`** — evicts all entities that have been dangling longer than `ttlMs` (default: 60s).

```typescript
import { CacheGc } from '@dumbql/cache';

const gc = new CacheGc(normalizedCache, 30_000); // 30s TTL

gc.track([{ __typename: 'Todo', id: '1' }]);
gc.release([{ __typename: 'Todo', id: '1' }]);

// After 30+ seconds:
const evicted = gc.sweep(); // 1 — Todo:1 was removed
console.log(gc.refCountOf('Todo', '1')); // 0
```

**Key behavior:** an entity is never evicted while its refcount > 0, even if `sweep()` is called. This prevents accidental data loss.

---

## Type Policies

Type policies customize how specific GraphQL types are stored and merged.

### keyFields

Controls which field(s) form the cache key. Default: `id`.

```typescript
provideCacheService({
  typePolicies: {
    Post: {
      keyFields: ['slug'], // key becomes "Post:my-slug"
    },
    Translation: {
      keyFields: ['locale', 'key'], // key becomes "Translation:en.hello"
    },
  },
});
```

### merge

Controls how partial data is merged into existing entities.

```typescript
provideCacheService({
  typePolicies: {
    // Simple array merge for pagination
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
});
```

### Custom merge function

```typescript
merge: (existing, incoming, options?: { args?: Record<string, unknown> }) => {
  // Fully custom logic
  return merged;
};
```

---

## Persistence

Cache data can be persisted across page reloads.

### Configuration

```typescript
import { CachePersistence, createCache } from '@dumbql/cache';

const persist = new CachePersistence({
  storageKey: 'my_cache', // localStorage key (default: '__dumbql_cache')
  version: 'v2', // bump to invalidate old caches
  maxAge: 3600_000, // auto-evict after 1 hour
  throttle: 500, // debounce persist calls (ms)
  storage: 'localStorage', // or 'memory'
});

const cache = createCache({ persist });
// Automatically restores on creation
```

### Throttled persist

```typescript
cache.persist(); // writes immediately
// Or use the throttle from CachePersistence:
persist.persistThrottled(data, 1000); // debounced
```

### Version invalidation

When `version` changes, old persisted data is silently discarded and the storage key is cleared. This prevents errors from incompatible cache shapes after an update.

---

## Optimistic Updates

Optimistic updates let you apply changes to the cache immediately, before the server responds, and roll them back on error.

```typescript
cache.applyOptimistic({
  id: 'opt-like-1',
  apply: (entities) => {
    const post = entities.get('Post:42');
    if (post) entities.set('Post:42', { ...post, likes: (post.likes as number) + 1 });
  },
  rollback: (prev) => {
    // prev contains only the keys that changed — restored automatically
  },
});

// Server succeeded:
cache.commitOptimistic('opt-like-1');

// Server errored:
cache.rollbackOptimistic('opt-like-1');
```

### Key-level rollback

The cache captures **only the keys that actually changed** during `apply()`. This means concurrent optimistic updates on different entities don't interfere. If two updates modify the same key, rollback order matters — use LIFO order or commit before applying a new one.

---

## Local State

Store UI-local state alongside normalized entities. Values are **not** normalized — they're stored as-is.

```typescript
// Write
cache.writeLocal('sidebarOpen', true);
cache.writeLocal('filter', { status: 'active', search: 'hello' });

// Read
const val = cache.readLocal('sidebarOpen'); // true

// Watch for changes (framework-agnostic)
cache.watchLocal('filter', () => {
  console.log('filter changed:', cache.readLocal('filter'));
});

// Scoped by types — auto-cleared when entities of those types are evicted
cache.writeLocalWithTypes('selectedPost', postId, new Set(['Post']));
cache.clearLocalStateByTypes(['Post']); // also clears 'selectedPost'
```

### Angular: watchLocal returns Observable

```typescript
class SidebarComponent {
  private cache = inject(CacheService);
  readonly isOpen$ = this.cache.watchLocal('sidebarOpen');
}
```

---

## API Reference

### Framework-agnostic (`@dumbql/cache`)

| Export                 | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| `CacheStore`           | Plain cache — normalized entities, local state, GC, persistence             |
| `createCache(config?)` | Factory function for `CacheStore`                                           |
| `NormalizedCache`      | Low-level entity store — `set`, `get`, `merge`, `remove`, `applyOptimistic` |
| `CacheGc`              | Reference-counting GC with TTL eviction                                     |
| `CachePersistence`     | Storage persistence (localStorage with memory fallback)                     |
| `CACHE_PERSIST_CONFIG` | Symbol for custom persist config                                            |
| `CacheEntity`          | Entity interface (`__typename`, `id?`, `[key: string]`)                     |
| `OptimisticUpdate`     | Optimistic update interface (`id`, `apply`, `rollback`)                     |
| `TypePolicy`           | Type policy interface (`keyFields?`, `merge?`)                              |
| `CacheStoreConfig`     | CacheStore config interface (`persist?`, `typePolicies?`)                   |
| `CachePersistConfig`   | Persistence config interface                                                |

### Angular (`@dumbql/cache/angular`)

| Export                             | Description                                                          |
| ---------------------------------- | -------------------------------------------------------------------- |
| `CacheService`                     | `@Injectable()` — DI-compatible cache wrapper with RxJS `watchLocal` |
| `CachePersistenceService`          | `@Injectable()` — Angular persistence service                        |
| `NG_CACHE_PERSIST_CONFIG`          | `InjectionToken` for persist config                                  |
| `provideCacheService(persistSvc?)` | Provider for `CacheService` + `GRAPHQL_CACHE` token                  |
| `provideCachePersistence(config?)` | Provider for persistence + auto-init                                 |

---

## Full Lifecycle Example

```typescript
import { CacheStore, createCache } from '@dumbql/cache';

// 1. Create with persistence
const cache = createCache({
  typePolicies: {
    PaginatedPosts: { merge: (ex, inc) => ({ ...inc, items: [...(ex?.items ?? []), ...inc.items] }) },
  },
  persist: { storageKey: 'blog_cache', version: '1' },
});

// 2. Write query results
const data = await fetch('/graphql', ...);
for (const post of data.posts) {
  cache.write(post);
}

// 3. Apply optimistic update
cache.applyOptimistic({
  id: 'like-1',
  apply: (entities) => {
    const p = entities.get('Post:1');
    if (p) entities.set('Post:1', { ...p, likes: (p.likes as number) + 1 });
  },
  rollback: () => {},
});

// 4. Read from cache
const post = cache.query('Post', '1');
console.log(post?.likes); // incremented immediately

// 5. Commit or rollback
cache.commitOptimistic('like-1');

// 6. Persist to localStorage
cache.persist();

// 7. Run GC
cache.collectGarbage();
```

## Dependencies

None (zero-dependency). Angular integration requires `@angular/core` (peer, optional).
