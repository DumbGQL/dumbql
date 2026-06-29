# Changelog

## [0.0.2-alpha.1] — 2026-06-29

### Added
- **`@dumbql/errors`** — typed error classes for GraphQL, network, cache, validation errors with `ErrorHandler` (#542e556)
  - `DumbqlError` — base class with `code`, `timestamp`, `context`, `toJSON()`
  - `GraphQLError` — server-side GraphQL errors (locations, path, extensions)
  - `NetworkError` — network failures (timeout, offline, HTTP, DNS, abort)
  - `CacheError` — cache issues (miss, serialization, GC, persistence)
  - `ValidationError` — client validation (missing variables, invalid query, type mismatch)
  - `ErrorHandler` — middleware-style handler: `on(code, fn)` with async `handle(error)`
- **`errorCode` on results** — `GraphQLResult` error variant now has `errorCode?: ErrorCode` field (`'NO_DATA' | 'GRAPHQL_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN'`) for easy switching on error type (#542e556)
- **`errorHandler` config option** — `errorHandler?: { handle(error: unknown): boolean | Promise<boolean> }` in both `@dumbql/core` (`GraphqlCoreConfig`) and `@dumbql/client` (`ClientConfig`), called before `onError` callback (#542e556)
- **`errorHandlerMiddleware()`** — new middleware in `@dumbql/middlewares` that catches pipeline errors and routes through custom handler (#542e556)

### Fixed
- **CI release workflow** — two bugs fixed (#a10da8d):
  - `scripts/build-packages.mjs`: `linkPackage()` now creates `node_modules/@dumbql/` parent directory before symlink (crashed on fresh CI)
  - `.github/workflows/release.yml`: `require()` paths prefixed with `./` — without it Node.js resolves them as module names, not relative paths
- **`scripts/version.mjs`** — dry-run no longer writes files (previous behavior wrote to dist even with `--dry-run`)
- **GraphQLResult type** — error variant no longer includes nullable `data` field when server returns `{"data": null, "errors": [...]}` (already worked correctly, confirmed by review)

### Changed
- Version bumped from `0.0.2-rc.2` → `0.0.2-alpha.1` across all 17 packages
- README updated with auto-mock, prefetch, playground, starters as adoption reasons

### Starters
- **React StackBlitz starter** at `starters/react/` — Vite + React 18 + `@dumbql/react` + mock backend
- **Vue StackBlitz starter** at `starters/vue/` — Vite + Vue 3 + `@dumbql/vue` + mock backend
- Docs getting-started replaced "coming soon" placeholders with live StackBlitz links

## [0.0.2-rc.2] — 2026-06-29

### Added
- **Auto-mock middleware** — `autoMockMiddleware(config)` in `@dumbql/middlewares` — schema-driven or heuristic mock data generation with custom resolvers, simulated delay, and passthrough mode
- **Prefetch resolver** — `prefetchedRoute(route, prefetch)` and `fromPrefeched(route, key)` in `@dumbql/core` — Angular Router `ResolveFn` that executes queries before route activation, resolves data into `ActivatedRoute.data`
- **GraphQL Playground** at `/playground` — standalone component with query/variables/headers editors, execute button, JSON response viewer, execution history
- NPM_TOKEN added to GitHub repo secrets

### Changed
- Version bumped from `0.0.2-rc.1` → `0.0.2-rc.2` across all 16 packages

## [0.0.2-rc.1] — 2026-06-28

### Added
- Initial public release candidate
- `@dumbql/cache` — normalized in-memory entity cache with GC, persistence, optimistic updates
- `@dumbql/core` — Angular GraphQL service with middleware pipeline, directives, pipes
- `@dumbql/client` — framework-agnostic GraphQL client
- `@dumbql/react` — React bindings
- `@dumbql/vue` — Vue bindings
- 12 additional packages: codegen, debugging, downloader, file-upload, fragments, middlewares, pagination, persisted-queries, ssr, subscriptions, testing
