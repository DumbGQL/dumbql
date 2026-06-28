# @dumbql/cache

Normalized in-memory entity cache for DumbQL. Uses `__typename:id` keying, supports GC, localStorage persistence, and optimistic updates.

## Install

```bash
npm install @dumbql/cache
```

## Quick Start

```typescript
import { CacheService, provideCachePersistence } from '@dumbql/cache';

// The cache is provided in root — just inject
class MyService {
  private cache = inject(CacheService);

  query() {
    const entity = this.cache.get('Todo:123');
    this.cache.watch('Todo:123').subscribe(console.log);
  }
}

// Enable persistence (optional)
bootstrapApplication(App, {
  providers: [provideCachePersistence()],
});
```

## API

| Export | Description |
|--------|-------------|
| `CacheService` | Injectable service wrapping `NormalizedCache` with GC, local state, and persistence |
| `NormalizedCache` | Core entity store — `get`, `set`, `merge`, `remove`, `applyOptimistic`, etc. |
| `CacheGc` | Reference-counting GC with TTL eviction |
| `CachePersistenceService` | Serializes cache to localStorage with versioning and throttling |
| `provideCachePersistence(config?)` | Provider for persistence |
| `CACHE_PERSIST_CONFIG` | Injection token for persist config |

```typescript
interface CachePersistConfig {
  version?: number;
  maxAge?: number;       // ms, default 24h
  debounceMs?: number;   // write throttle, default 1000
  storageKey?: string;   // default 'dumbql_cache'
}
```

## Optimistic Updates

```typescript
cache.applyOptimistic('opt-1', { 'Todo:new': { __typename: 'Todo', id: 'new', title: '…' } });
cache.commitOptimistic('opt-1');   // make permanent
cache.rollbackOptimistic('opt-1'); // discard
```

## Local State

```typescript
cache.writeLocal('isOpen', signal(false));
const val = cache.watchLocal('isOpen'); // Signal
```

## Dependencies

`@angular/core`, `rxjs`
