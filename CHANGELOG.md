# Changelog

## [1.1.6] — 2026-07-01

### Added
- **`@dumbql/dev-server` `--static` flag** — serve pre-built static files instead of proxying to a dev server.
  - Usage: `dumbql-dev --port 4200 --static dist/browser`
  - All PNA/CORS headers are applied to static responses

### Changed
- **StackBlitz starters** — `dumbql-dev` starts immediately, loads loading page while `ng build` / `vite build` runs in background via `spawn.cmd` config. When build completes, static files are served automatically.
  - `package.json` start: just `dumbql-dev --port 4200`
  - `dumbql.config.json`: `{ spawn: { cmd: "ng build" }, staticDir: "dist/browser" }`
  - No dev server (ng serve/vite) involved — prevents the "port answers before build ready" race condition
  - No hardcoded localhost URLs — all traffic through StackBlitz public HTTPS URL, no PNA block

### Fixed
- **StackBlitz preview white page** — credentialless iframe blocks all `localhost:*` requests at the browser level (PNA). Build + static approach keeps all traffic on a single container port through StackBlitz's HTTPS proxy. dumbql-dev starts immediately so the port is always open, serving loading page until build finishes.

## [1.1.7] — 2026-07-01

### Changed
- **`staticDir` auto-detection** — when `staticDir` is set, the server now checks both `index.html` and `browser/index.html` inside the directory. Handles both Angular output structures (`dist/` or `dist/browser/`).

## [1.1.5] — 2026-07-01

### Added
- **Proxy content-aware buffering** — proxy now buffers HTML responses and checks for meaningful content before forwarding. If `ng serve`/Vite returns an empty stub page (as happens during initial build), the proxy shows the loading page instead.

## [1.1.4] — 2026-07-01

### Added
- **`@dumbql/dev-server` `--static` flag** — initial implementation.

## [1.1.3] — 2026-07-01

### Added
- **`@dumbql/dev-server`** — unified development server with mock GraphQL backend + proxy to any frontend dev server:
  - CLI — `npx dumbql-dev --proxy http://localhost:4200`
  - Configuration via `dumbql.config.json` with inline schema support
  - `createDevServer()` / `startDevServer()` programmatic API
  - `--rewrite` flag for URL rewriting in StackBlitz/Codespaces/WebContainers (PNA fix)
  - Auto-detection of StackBlitz, Codespaces, and local environments via `env-analyzer.ts`
- **`@dumbql/dev-server` docs page** — `/docs/dev-server` with CLI options, config example, and API reference
- **Per-package "since" badge** — each package page now shows the version it was introduced (e.g., `since v0.0.1` or `since v1.1.0`)
- **Zoneless Angular starter** — switched from `provideZoneChangeDetection` to `provideZonelessChangeDetection()`, removed `zone.js` dependency
- **Improved starters** — `start` command simplified to just `dumbql-dev` (spawn.cmd handles frontend server), version ranges bumped to latest

### Changed
- File-based starters (angular/react/vue) now use `dumbql-dev` as the sole start command instead of separate terminals
- Version dropdown migrated to `tuiComboBox` with read-only input, docs-themed styling
- Non-existent versions removed from version selector (0.0.9, 0.0.11, 0.0.12, 0.0.2-rc.1, 0.0.2-rc.2)
- `@dumbql/dev-server` version bumped `^1.0.0` → `^1.1.3` in all starters

### Fixed
- **CI `package-lock.json`** — regenerated lock file to remove stale workspace symlink entries that caused `npm ci` to fail with "Missing: @dumbql/cache@1.0.3 from lock file"
- **StackBlitz preview fix** — all three StackBlitz starters (Angular, React, Vue) now start with just `dumbql-dev` and spawn the frontend dev server internally via `spawn.cmd`. StackBlitz auto-detects port 4000 first, so the preview opens through the proxy with URL rewriting enabled (`proxy.rewrite: true`), avoiding PNA/CORS blocks from `credentialless` iframes
- **URL rewriting** — proxy now uses `ProxyConfig.target` dynamically instead of hardcoded `localhost:4200`, works for any frontend framework (React/Vue/Angular)
- **Version service** — `allVersions` list updated to include `1.1.x` releases

## [0.0.3-rc.1] — 2026-06-30

### Added
- **FieldPolicy (typePolicies) support** in `@dumbql/cache`:
  - `TypePolicy` interface with `keyFields` (composite keys via dot-separated values) and custom `merge` functions
  - `NormalizedCache.setTypePolicies()` — configure policies at runtime
  - `CacheStore.setTypePolicies()` / `CacheService.setTypePolicies()` — wired through the stack
  - Angular `cacheMiddleware` wires `typePolicies` from `DumbqlConfig.cache.typePolicies` on first request (guarded by `WeakSet<Injector>`)
  - Client `cacheMiddleware` wires `typePolicies` from `CacheConfig.typePolicies` eagerly
  - 8 FieldPolicy tests in `src/app/cache/field-policy.spec.ts`
- **`@dumbql/codegen` CLI** — `npx dumbql-codegen` with flags:
  - `--watch` / `-w` — watches `schema.json` and `.graphql` files, regenerates on change with 300ms debounce
  - `--schema-only` — only generate schema types from `schema.json`
  - `--documents-only` — only generate typed documents from `.graphql` files
  - `--config, -c <path>` / `--output, -o <dir>` / `--help`
- **Typed documents from `.graphql` files** — `findGraphqlFiles()`, `parseGraphqlFile()`, `generateTypedDocumentsCode()`, `generateIndexCode()` API
- **`generateTypedDocumentsCode`** now accepts `string` (full TS source, auto-extracts type names) in addition to `string[]`
- **`tools/generate-types.mjs`** refactored to use `@dumbql/codegen` library instead of duplicating schema generation / merge logic; now generates typed documents from `.graphql` files

### Changed
- Version bumped from `0.0.2-rc.4` → `0.0.3-rc.1` across all 18 packages

## [0.0.2-rc.4] — 2026-06-29

### Added
- **React/Vue hooks v2** — all three hooks (`useQuery`, `useMutation`, `useSubscription`) now accept an options object with:
  - `onCompleted` / `onError` callbacks for side effects
  - `errorCode` in return value for typed error handling
  - `useQuery`: `networkStatus`, `called`, `fetchMore`, `pollInterval`, `skip` options
  - `useMutation`: `called`, `update` callback (writes to cache after mutation), `errorCode`
  - `useSubscription`: `onNext`, `onComplete` callbacks, `errorCode`
- **`useLiveQuery`** — new hook for React and Vue that executes an initial HTTP query then opens a WebSocket subscription for real-time updates. Accepts `onCompleted`/`onError` callbacks, `wsEndpoint`, `shouldSubscribe` options.
- **`GraphqlLiveQuery`** — framework-agnostic class in `@dumbql/subscriptions` that does initial fetch + WebSocket subscription for live queries
- **DevTools Panel** — in-app overlay for debugging (`@dumbql/debugging`):
  - Toggle with `Ctrl+Shift+D`
  - **Queries tab** — history with timing, type, status, fields, operation name
  - **Cache tab** — normalized cache snapshot with typename, id, fields
  - **Errors tab** — filtered error entries
  - `provideDevToolsPanel()` provider, `<dumbql-devtools-panel>` component
- **`getCacheService()`** — public method on `DumbqlClient` to access the underlying `CacheStore` (needed for mutation `update` callbacks)
- **`@dumbql/apollo-adapter`** — migration helper package:
  - `fromApolloCache()` — wraps Apollo InMemoryCache into a CacheStore-compatible interface
  - `createMigrationGuide()` — returns a map of Apollo→DumbQL API equivalents
- **Apollo adapter** added to build order in `scripts/build-packages.mjs`

### Changed
- **Backward-incompatible**: `useQuery`, `useMutation`, `useSubscription` in `@dumbql/react` and `@dumbql/vue` now accept an options object as second argument instead of positional `variables`. Update: `useQuery(doc, { variables })` instead of `useQuery(doc, variables)`.
- Version bumped from `0.0.2-rc.2` → `0.0.2-rc.4` across all 19 packages

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
