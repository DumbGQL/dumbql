---
name: doc-verify
description: >
  Use this skill before writing any code that uses an external library, framework, protocol,
  or API. Trigger automatically when about to use: any library import, any framework feature,
  any protocol implementation, any configuration format, any CLI tool flag. Also triggers on
  "/doc", "/verify-api", "проверь документацию", "это точно правильный апи?", "убедись что
  метод существует". CRITICAL: never write API calls, method signatures, config keys, or
  protocol fields from memory — always verify against official documentation or RFC first.
  The #1 source of hallucinated code is invented API surfaces. This skill prevents that.
---

# Doc Verify

Verify every API against official documentation before writing code that uses it.
No invented method names. No guessed config keys. No assumed function signatures.

**The rule**: if you're not 100% certain a method/type/config key exists in the current
version — look it up before writing it. Takes 10 seconds. Saves hours of debugging.

---

## Context Budget

| Step                  | Max tokens                                |
| --------------------- | ----------------------------------------- |
| Web search            | 3 results, snippets only                  |
| web_fetch (docs page) | `text_content_token_limit: 800`           |
| RFC fetch             | targeted section only, 500 tokens         |
| Extracted fact        | 1-3 lines                                 |
| After verification    | purge, retain only the verified signature |

---

## When to Verify

### Always verify (no exceptions):

- **New library usage** — first time using a package in this session
- **Specific method/function call** — any call where you're not certain of exact signature
- **Config file keys** — any key in golangci.yml, angular.json, tsconfig, Dockerfile, etc.
- **CLI flags** — any flag passed to a tool (go build flags, docker flags, ng flags)
- **Protocol fields** — any field in HTTP headers, WebSocket frames, gRPC metadata
- **RFC-defined formats** — JWT, OAuth2, WebRTC, HLS, RTMP, TLS, HTTP/2, WebSockets
- **GraphQL schema syntax** — directives, scalar types, federation annotations
- **Version-specific APIs** — anything that might differ between major versions

### Skip verification for:

- Standard library basics that haven't changed in years (`fmt.Println`, `len()`, `console.log`)
- Code you just wrote in this session (you know it exists)
- Things already verified earlier in this session (cached — see §Session Cache)

---

## Phase 1 — Identify What Needs Verification

Before writing a code block, scan it mentally:

```
For each external symbol used:
  - Is this a method/function from a library?
  - Is this a config key?
  - Is this a protocol field or RFC-defined value?
  - Am I certain this exists in the current version?

If uncertain about ANY of them → verify before writing.
```

List what needs verification:

```
NEEDS VERIFY:
  - taiga-ui: TuiInputModule selector name (v4 renamed things)
  - gqlgen: correct annotation for custom scalars
  - pgx: PoolConfig field names (v4 vs v5 API changed)
```

---

## Phase 2 — Find the Right Source

Read `references/doc-sources.md` for official URLs by technology.

Priority order for sources:

1. **Official docs** — pkg.go.dev, angular.io, docs.rs, pypi docs, npm package README
2. **Official GitHub** — source code is ground truth when docs are unclear
3. **RFC** — for protocols, formats, standards (tools.ietf.org/html/rfc\*)
4. **Changelog/migration guide** — for version-specific API changes
5. **Web search** — only if official docs not findable directly

### Search pattern for finding docs

```
"<library> <method/feature> docs site:<official-domain>"
"<library> v<version> <feature> API reference"
"RFC <number> <field name>"
```

---

## Phase 3 — Fetch and Extract

Fetch the relevant docs page with token limit:

```javascript
web_fetch(url, { text_content_token_limit: 800 });
```

Extract ONLY what's needed:

- Exact function/method signature
- Exact config key name and type
- Exact RFC field name and format
- Version where it was introduced/changed

**One fact per fetch.** Don't load the entire docs page looking for multiple things.
Make separate targeted fetches.

After extracting → purge the fetched content. Keep only the verified fact.

---

## Phase 4 — Version Check

Always verify the API exists in the **project's actual version**, not just "latest".

```bash
# Check what version is actually used
# Go
grep "<package>" go.mod | head -5

# Node
grep "<package>" package.json | head -5

# Rust
grep "<crate>" Cargo.toml | head -5

# Python
grep "<package>" pyproject.toml requirements.txt 2>/dev/null | head -5
```

If the docs page you found is for a different version than what's in the project —
find the version-specific docs or changelog.

---

## Phase 5 — Write with Verified API

Now write the code using only verified signatures.

Mark verified items in your mental model:

```
VERIFIED:
  - TuiInputComponent (not TuiInputModule — v4 changed to standalone)
  - @scalar(name: "DateTime") — correct gqlgen annotation
  - pgxpool.Config{MaxConns: 10} — v5 field name confirmed
```

If something cannot be verified (docs offline, no internet, obscure library):

- Write the code with a comment: `// TODO: verify API — used from memory`
- Flag it explicitly so the user knows to double-check
- Never silently use unverified API

---

## Session Cache

To avoid re-fetching the same docs multiple times per session, maintain a mental cache:

```
SESSION VERIFIED:
  [taiga-ui@4] TuiInputComponent — standalone, selector: tui-input
  [pgx@5] pgxpool.New(ctx, connString) — returns (*Pool, error)
  [gqlgen] @goModel(model: "...") — correct directive syntax
```

If already in cache → use it directly, skip fetch.
Cache expires: when the session ends or when a new version is detected.

---

## RFC Verification

For protocol implementations — always check the RFC.

### Common RFCs for your stack:

| Protocol/Format | RFC                       |
| --------------- | ------------------------- |
| HTTP/1.1        | RFC 7230-7235             |
| HTTP/2          | RFC 7540                  |
| WebSockets      | RFC 6455                  |
| JWT             | RFC 7519                  |
| OAuth2          | RFC 6749                  |
| TLS 1.3         | RFC 8446                  |
| HLS             | Apple HLS spec (not IETF) |
| RTMP            | Adobe RTMP spec           |
| WebRTC          | RFC 8825-8835             |
| gRPC            | grpc.io spec              |
| WHIP/WHEP       | draft-ietf-wish-whip      |

```bash
# Fetch specific RFC section
web_fetch("https://tools.ietf.org/html/rfc<N>#section-<X>",
  { text_content_token_limit: 500 })
```

---

## My Project Rules

Rules derived from actual project decisions. Agents must follow these without needing to verify:

### Go

- **pgx v5** — use `pgxpool.New(ctx, connString)`, NOT `pgxpool.Connect()`
- **pgx v5 scan** — use `pgx.CollectRows(rows, pgx.RowToStructByName[T])` for struct scan
- **gqlgen** — `//go:generate go run github.com/99designs/gqlgen generate` in tools.go
- **gqlgen scalars** — define in `gqlgen.yml` under `models:`, use `@goModel` directive
- **modernc.org/sqlite** — pure Go, no CGO needed, import as `_ "modernc.org/sqlite"`
- **Mutex** — always `defer mu.Unlock()` immediately after `mu.Lock()`
- **Context** — always first parameter, `context.Background()` only at program entry
- **Errors** — wrap with `fmt.Errorf("operation: %w", err)`, check with `errors.Is/As`

### Angular + Taiga UI

- **Taiga UI version** — v4 (standalone components, no modules)
- **TuiButton** — `import { TuiButton } from '@taiga-ui/core'` (not TuiButtonModule)
- **TuiInput** — `import { TuiInput } from '@taiga-ui/kit'`
- **inject()** — always `inject(Service)` never constructor injection
- **Signals** — `signal()`, `computed()`, `effect()`, `toSignal()` — no BehaviorSubject
- **Inputs** — `input()` / `input.required()` — no `@Input()` decorator
- **Outputs** — `output()` — no `@Output() EventEmitter`
- **Apollo Angular** — `Apollo.watchQuery()` returns `QueryRef`, `.valueChanges` is Observable
- **Apollo + signals** — wrap with `toSignal(apollo.watchQuery(...).valueChanges)`

### GraphQL / gqlgen

- **Resolver naming** — `<Type><Field>Resolver` e.g. `QueryUsersResolver`
- **Custom scalars** — define in schema + gqlgen.yml + implement `MarshalJSON/UnmarshalJSON`
- **Subscriptions** — use `<-chan *model.Type` return type in resolver interface
- **Dataloader** — use `graph/generated` package, configure in `gqlgen.yml`

### PostgreSQL / pgx

- **Connection** — always pooled: `pgxpool.New()` not single `pgx.Connect()`
- **Transactions** — `pool.BeginTx(ctx, pgx.TxOptions{})`, always `defer tx.Rollback(ctx)`
- **Scanning** — `pgx.CollectRows` for slices, `pgx.RowToStructByName` for struct mapping
- **Migrations** — Flyway or goose, never `DDL auto` / `CREATE TABLE IF NOT EXISTS` in app code

### Docker

- **Multi-stage always** — never single-stage with build tools in prod image
- **Base images** — pin versions: `golang:1.22-alpine3.20` not `golang:latest`
- **Non-root** — always add non-root user, switch with `USER`
- **Distroless** — prefer `gcr.io/distroless/static-debian12` for Go final stage

### Git / CI

- **Conventional commits** — `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- **GitLab** — primary VCS, handle: `deprecated-guy`
- **Branch naming** — `feat/<name>`, `fix/<name>`, `chore/<name>`
- **CI order** — always: lint → test → build (never skip lint)

---

## Cross-Skill: tsx-types

When generating any TypeScript or TSX code — read and apply `tsx-types` skill rules:

- No `any`, no `as T`, no `object`, no `Function`
- Props typed with explicit types, event handlers with payload types
- External data starts as `unknown`, narrowed with type guards
- Discriminated unions for variant state
- `as const` for literal types

If `tsx-types` skill is loaded in this session — defer to it entirely for type decisions.

## Rules

- **Never** write an external API call without verifying it exists in the correct version
- **Never** guess a config key — fetch the schema or docs
- **Never** implement a protocol field from memory — check the RFC
- **Always** check the project's actual dependency version before fetching docs
- **Always** use `text_content_token_limit: 800` on web_fetch — never load full pages
- **Always** purge fetched content after extracting the needed fact
- **Always** mark unverifiable code with `// TODO: verify API`
- **Cache** verified facts within the session — don't re-fetch the same docs
