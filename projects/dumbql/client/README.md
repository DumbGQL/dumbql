<p align="center">
  <img src="../../../public/logos/logo.png" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/client</h1>

<p align="center"><b>Framework-agnostic GraphQL client — fetch-based core for React, Vue, Svelte, or any JS app.</b></p>

---

## Features

- **`DumbqlClient`** — query, mutate, refetch, streaming (`@defer`/`@stream`)
- **`createClient(config)`** — factory function, zero-config
- **Middleware pipeline** — auth, logging, devtools, cache, custom (Promise-based, no RxJS)
- **`gql` tag** — `parse()`-based `DocumentNode` creation
- **`TypedDocumentNode<TResult, TVars>`** — phantom-typed documents
- **Normalized cache** — entity deduplication, TTL, partial updates
- **Result helpers** — `isSuccess`, `isError`, `unwrap`, `unwrapOrThrow`, `mapResult`
- **File upload** — multipart upload via `FormData`
- **Request batching, deduplication, retry**
- **Streaming** — `@defer`/`@stream` multipart/mixed responses
- **No framework dependencies** — pure TypeScript, works everywhere

## Install

```bash
npm install @dumbql/client
```

## Quick Start

```typescript
import { createClient, gql, isSuccess } from '@dumbql/client';

const client = createClient({ endpoint: '/graphql' });

const GET_TODOS = gql`query Todos { todos { id title } }`;

const result = await client.query<{ todos: Todo[] }>(GET_TODOS);
if (isSuccess(result)) {
  console.log(result.data.todos);
}
```

## API Overview

| Export | Description |
|--------|-------------|
| `DumbqlClient` | Core class — query, mutate, refetch |
| `createClient(config)` | Factory for `DumbqlClient` |
| `gql\`…\`` | Template tag for `DocumentNode` |
| `isSuccess(result)` / `isError(result)` | Result type guards |
| `unwrap(result)` / `unwrapOrThrow(result)` | Extract data from result |
| `mapResult(result, fn)` | Map over success data |
| `hasPartialErrors(result)` / `getGraphQLErrors(result)` | Error helpers |
| `getNetworkError(result)` | Network error info |
| `authMiddleware(token)` | Bearer token middleware |
| `devAuthMiddleware(token?)` | Dev authentication middleware |
| `loggingMiddleware(label?)` | Request logging middleware |
| `applyMiddleware(mw, final)` | Build middleware chain |
| `ClientCache` / `NormalizedCache` | Entity cache with local state |

## Middleware

```typescript
import { createClient, authMiddleware, loggingMiddleware } from '@dumbql/client';

const client = createClient({
  endpoint: '/graphql',
  middleware: [
    authMiddleware('my-token'),
    loggingMiddleware('Todos'),
  ],
});
```

## Cache Integration

```typescript
import { createClient, ClientCache } from '@dumbql/client';

const cache = new ClientCache();
const client = createClient({
  endpoint: '/graphql',
  cache: { enabled: true, maxAge: 30000 },
}, cache);
```

## Streaming

```typescript
const stream = client.queryStream(gql`query Stream { ... }`);

for await (const part of stream) {
  if (isSuccess(part)) {
    // incremental data
  }
}
```

## Dependencies

`graphql`
