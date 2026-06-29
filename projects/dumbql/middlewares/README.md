<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/core/assets/logo.svg" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/middlewares</h1>

<p align="center">Pre-built middleware functions for the DumbQL request pipeline — auth refresh, retry, focus refetch, offline queue.</p>

---

## Install

```bash
npm install @dumbql/middlewares
```

## Middlewares

### `authRefreshMiddleware(config)`

Intercepts 401 responses, queues concurrent requests, calls `refreshToken()`, then replays them with the new token.

```typescript
import { authRefreshMiddleware } from '@dumbql/middlewares';

const middleware = authRefreshMiddleware({
  refreshToken: () => fetch('/refresh').then(r => r.json()),
});
```

### `retryExchange(config?)`

Retries failed requests with exponential backoff + jitter.

```typescript
import { retryExchange } from '@dumbql/middlewares';

const middleware = retryExchange({
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10000,
});
```

### `focusRefetchMiddleware(config?)`

Refetches stale queries on `visibilitychange` or `window.focus`.

```typescript
import { focusRefetchMiddleware } from '@dumbql/middlewares';

const middleware = focusRefetchMiddleware({ minStaleSeconds: 30 });
```

### `offlineQueueMiddleware(config?)`

Buffers mutations in localStorage when offline, replays on `online` event.

```typescript
import { offlineQueueMiddleware } from '@dumbql/middlewares';
import { provideOfflineQueue } from '@dumbql/middlewares/angular';

const middleware = offlineQueueMiddleware({ maxQueue: 50 });
```

## API

### `@dumbql/middlewares` (agnostic)

| Export | Description |
|--------|-------------|
| `authRefreshMiddleware(config)` | Auth token refresh on 401 |
| `retryExchange(config?)` | Exponential backoff retry |
| `focusRefetchMiddleware(config?)` | Refetch on focus |
| `offlineQueueMiddleware(config?)` | Offline mutation queue |

### `@dumbql/middlewares/angular` (Angular)

| Export | Description |
|--------|-------------|
| `OfflineQueueService` | Injectable queue manager |
| `provideOfflineQueue(config?)` | Provider for offline queue |
| `OfflineQueueConfig` | Configuration interface |

## Dependencies

- Core (`@dumbql/middlewares`): `@dumbql/core`, `rxjs`
- Angular (`@dumbql/middlewares/angular`): additionally `@angular/core`
