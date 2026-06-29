<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/core/assets/logo.svg" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/cache</h1>

<p align="center"><b>Normalized in-memory entity cache for GraphQL — __typename:id keying, GC, persistence, optimistic updates.</b></p>

---

## Install

```bash
npm install @dumbql/cache
```

## Quick Start (Framework-agnostic)

```typescript
import { CacheStore, createCache } from '@dumbql/cache';

const cache = createCache();
// or: new CacheStore();
```

## Angular

```typescript
import { CacheService } from '@dumbql/cache/angular';
import { provideCachePersistence } from '@dumbql/cache/angular';

// Import via Angular DI (providedIn: 'root')
class MyService {
  private cache = inject(CacheService);
}

// Enable persistence (optional)
bootstrapApplication(App, {
  providers: [provideCachePersistence()],
});
```

// Write entities
cache.write({ __typename: 'Todo', id: '1', title: 'Hello' });

// Read
const todo = cache.query('Todo', '1');

// Watch local state
const unsub = cache.watchLocal('isOpen', () => {
  console.log('isOpen changed:', cache.readLocal('isOpen'));
});
cache.writeLocal('isOpen', true);

unsub(); // cleanup
```

## API Overview

### Framework-agnostic (`@dumbql/cache`)

| Export | Description |
|--------|-------------|
| `CacheStore` | Plain cache — normalized entities, local state, GC, persistence |
| `createCache(config?)` | Factory function |
| `NormalizedCache` | Low-level entity store — `get`, `set`, `merge`, `remove`, `applyOptimistic` |
| `CacheGc` | Reference-counting GC with TTL eviction |
| `CachePersistence` | Storage persistence (localStorage with memory fallback) |
| `CACHE_PERSIST_CONFIG` | Symbol for custom persist config |

### Angular (`@dumbql/cache/angular`)

| Export | Description |
|--------|-------------|
| `CacheService` | `@Injectable({ providedIn: 'root' })` — DI-compatible wrapper |
| `CachePersistenceService` | `@Injectable()` — Angular persistence service |
| `NG_CACHE_PERSIST_CONFIG` | `InjectionToken` for persist config |
| `provideCachePersistence(config?)` | Provider for persistence + auto-init |

## Normalized Cache

```typescript
const nc = new NormalizedCache();

nc.set({ __typename: 'Todo', id: '1', title: 'Hello' });
nc.merge({ __typename: 'Todo', id: '1', done: true });

const entity = nc.get('Todo', '1');
nc.remove('Todo', '1');
```

## Persistence

```typescript
import { CachePersistence } from '@dumbql/cache';

const persist = new CachePersistence({ storageKey: 'my_cache' });
const cache = createCache({ persist });
// Automatically restores on creation, persists via cache.persist()
```

## Optimistic Updates

```typescript
cache.applyOptimistic({
  id: 'opt-1',
  apply: (entities) => entities.set('Todo:new', { __typename: 'Todo', id: 'new', title: '…' }),
  rollback: (prev) => {},
});
cache.commitOptimistic('opt-1');
// or cache.rollbackOptimistic('opt-1');
```

## Dependencies

None (zero-dependency)
