<p align="center">
  <img src="https://raw.githubusercontent.com/DumbGQL/dumbql/main/projects/dumbql/core/assets/logo.svg" alt="DumbQL" width="160"/>
</p>

<h1 align="center">@dumbql/core</h1>

<p align="center"><b>Central GraphQL client for Angular — query, mutate, middleware, pipes, directives, and more.</b></p>

---

## Features

- `GraphqlService` — query, mutate, refetch, poll, setEndpoint
- Middleware pipeline — auth, logging, devtools, cache, custom
- Standalone functions — `query()`, `mutate()`, `refetch()`, `poll()` (injection‑free)
- Result helpers — `isSuccess`, `isError`, `unwrap`, `unwrapOrThrow`, `mapResult`
- `gql` tag — `parse()`-based `DocumentNode` creation
- `TypedDocumentNode<TResult, TVars>` — phantom‑typed documents
- Angular pipes — `GqlPipe`, `GraphqlDataPipe`, `GraphqlErrorPipe`, and more
- Reactive variables — `makeVar<T>()`, `ReactiveVar<T>`
- Client directive — `@client` field resolution
- Router integration — `guardedRoute()`, `provideDumbqlRouter()`
- Auto‑refetch — `mutationCachePolicy()`, `provideAutoRefetch()`
- DevTools — `DevtoolsService`, `devtoolsMiddleware`
- Schema service — `SchemaService`, `provideSchemaFetch()`
- Request batching, deduplication, retry
- Plugin system — `DumbqlPlugin` with `onInit` + `getMiddleware`
- `ng add` schematics — interactive setup

## Install

```bash
ng add @dumbql/core
# or
npm install @dumbql/core
```

## Quick Start

```typescript
import { provideDumbql } from '@dumbql/core';

bootstrapApplication(App, {
  providers: [provideDumbql({ endpoint: '/graphql' })],
});
```

```typescript
import { Component, inject } from '@angular/core';
import { GraphqlService, gql, isSuccess, unwrap } from '@dumbql/core';

@Component({ template: '...' })
class TodosComponent {
  private graphql = inject(GraphqlService);
  todos$ = this.graphql.query<{ todos: Todo[] }>(
    gql`query Todos { todos { id title } }`,
  ).pipe(
    isSuccess(),
    unwrap(),
  );
}
```

## API Overview

| Export | Description |
|--------|-------------|
| `GraphqlService` | Core service — query, mutate, refetch, poll |
| `provideDumbql(config)` | Provider for `DumbqlConfig` |
| `DumbqlConfig` | Unified config interface |
| `gql\`…\`` | Template tag for `DocumentNode` |
| `query(doc, vars?)` | Standalone query → `QueryHandle<T>` |
| `mutate(doc, vars?, opts?)` | Standalone mutation |
| `refetch(handle)` | Re‑execute a `QueryHandle` |
| `poll(doc, vars?, interval?)` | Polling query |
| `isSuccess()` / `isError()` | RxJS operators for `GraphQLResult` |
| `unwrap()` / `unwrapOrThrow()` | Extract data from result |
| `mapResult(fn)` | Map over success data |
| `hasPartialErrors()` / `getGraphQLErrors()` | Error helpers |
| `GraphqlEndpoint` / `provideEndpoint` | Multi‑endpoint support |
| `makeVar<T>(initial)` | Reactive variable |
| `cacheMiddleware(policies?)` | Query caching + entity merging |
| `mutationCachePolicy()` | Mutation eviction policy |
| `clientDirectiveMiddleware()` | `@client` field handling |
| `streamingMiddleware()` | `@defer` / `@stream` support |
| `provideDumbqlRouter()` | Router guard integration |
| `guardedRoute(path, guards)` | Guarded route config |
| `DumbqlQueryDirective` | Structural directive with query context |
| `DevtoolsService` | DevTools extension communication |
| `gqlPipe` / `GraphqlDataPipe` / `GraphqlErrorPipe` | Angular pipes |

## Sub‑packages

| Package | Purpose |
|---------|---------|
| `@dumbql/cache` | Normalized entity cache |
| `@dumbql/middlewares` | Auth, retry, offline queue, focus refetch |
| `@dumbql/subscriptions` | WebSocket subscriptions |
| `@dumbql/file-upload` | Multipart uploads |
| `@dumbql/pagination` | Cursor + offset pagination |
| `@dumbql/persisted-queries` | APQ middleware |
| `@dumbql/fragments` | Fragment definitions |
| `@dumbql/ssr` | Server‑side rendering |
| `@dumbql/debugging` | Debug utilities |
| `@dumbql/testing` | Mock backend |
| `@dumbql/downloader` | Schema download (Node.js) |
| `@dumbql/codegen` | TypeScript codegen |

## Dependencies

`@angular/common`, `@angular/core`, `@dumbql/cache`, `graphql`, `rxjs`
