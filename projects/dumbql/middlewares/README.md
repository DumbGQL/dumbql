# @dumbql/middlewares

Pre‑built middleware functions for the DumbQL request pipeline.

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
  refreshToken: () => fetch('/refresh', …).then(r => r.json()),
  isUnauthorized: (status) => status === 401,
});
```

### `retryExchange(config?)`

Retries failed requests with exponential backoff + jitter.

```typescript
import { retryExchange } from '@dumbql/middlewares';

const middleware = retryExchange({
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 10_000,
});
```

### `focusRefetchMiddleware(config?)`

Refetches stale queries on `visibilitychange` or `window.focus`.

```typescript
import { focusRefetchMiddleware } from '@dumbql/middlewares';

const middleware = focusRefetchMiddleware({
  minStaleSeconds: 30,
});
```

### `offlineQueueMiddleware()`

Buffers mutations in localStorage when offline, replays on `online` event.

```typescript
import { offlineQueueMiddleware, provideOfflineQueue } from '@dumbql/middlewares';

bootstrapApplication(App, {
  providers: [provideOfflineQueue({ maxQueue: 50 })],
});

const middleware = offlineQueueMiddleware();
```

## Applying Middleware

```typescript
provideDumbql({
  endpoint: '/graphql',
  middleware: [
    authRefreshMiddleware({ refreshToken: … }),
    retryExchange(),
    focusRefetchMiddleware(),
    offlineQueueMiddleware(),
  ],
}),
```

## Dependencies

`@angular/core`, `@dumbql/core`, `rxjs`
