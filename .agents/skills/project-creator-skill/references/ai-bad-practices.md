# AI Bad Practices — Reference Checklist

Use this file during Phase 2.5 (AI Audit) to identify bad patterns in user code.

---

## 🔴 CRITICAL — Fix Before Shipping

### API Key Hardcoded in Source

**Detect**: string literals matching `sk-`, `sk-ant-`, `AIza`, `Bearer `, API key patterns in `.ts`, `.go`, `.py`, `.rs`, `.js`, `.env` committed to repo
**Why bad**: Key leaks in git history, logs, error messages. Rotated keys break the app.
**Fix**: Use environment variables. Load via `os.Getenv`, `process.env`, `std::env::var`.

```go
// ❌ Bad
client := anthropic.NewClient("sk-ant-abc123")

// ✅ Good
client := anthropic.NewClient(os.Getenv("ANTHROPIC_API_KEY"))
```

---

### No Error Handling on LLM Calls

**Detect**: LLM API calls without try/catch, without checking error return, without status code check
**Why bad**: Rate limits, network errors, and model overload are common. Unhandled = silent failure or panic.
**Fix**: Always handle errors. Implement retry with exponential backoff for 429/529.

```typescript
// ❌ Bad
const response = await anthropic.messages.create({ ... });
return response.content[0].text;

// ✅ Good
try {
  const response = await anthropic.messages.create({ ... });
  return response.content[0].text;
} catch (err) {
  if (err.status === 429) { /* retry with backoff */ }
  throw err;
}
```

---

### No Token / Cost Limit Set

**Detect**: `max_tokens` missing or set to model maximum; no budget tracking
**Why bad**: A single runaway prompt can cost hundreds of dollars.
**Fix**: Always set `max_tokens` to the minimum needed for the task.

---

### User Input Injected Directly into System Prompt

**Detect**: string concatenation of user input into system prompt or prompt template without sanitization
**Why bad**: Prompt injection — user can override instructions, exfiltrate system prompt, bypass safety.
**Fix**: Separate system and user content. Never interpolate raw user input into system prompt.

```python
# ❌ Bad
system = f"You are a helpful assistant. User context: {user_input}"

# ✅ Good
system = "You are a helpful assistant."
messages = [{"role": "user", "content": user_input}]
```

---

## 🟡 WARNING — Should Fix

### System Prompt Hardcoded in Business Logic

**Detect**: Long string literals with LLM instructions embedded in service/handler code
**Why bad**: Hard to iterate, can't A/B test, not version controlled separately, leaks into logs.
**Fix**: Move prompts to separate files (`prompts/`, `internal/prompts/`). Load at startup.

---

### No Timeout on LLM Call

**Detect**: HTTP client or SDK call without timeout context
**Why bad**: LLM calls can hang for minutes. No timeout = thread/goroutine leak.
**Fix**: Always wrap with a context timeout (30–120s depending on use case).

```go
// ❌ Bad
resp, err := client.Messages.New(context.Background(), params)

// ✅ Good
ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
defer cancel()
resp, err := client.Messages.New(ctx, params)
```

---

### Using Deprecated or Sunset Model Name

**Detect**: Model strings like `gpt-4`, `claude-2`, `claude-instant-1`, `text-davinci-003`, `gpt-3.5-turbo-0301`
**Why bad**: Deprecated models get removed without warning, breaking prod.
**Fix**: Use current stable model names. Pin to dated snapshot versions for stability.

---

### Logging Full LLM Response in Production

**Detect**: `console.log(response)`, `log.Printf("%+v", resp)`, `print(response)` on full API response objects
**Why bad**: Leaks user data, PII, conversation history into log aggregators.
**Fix**: Log only metadata (model, usage tokens, latency). Never log message content in prod.

---

### Unbounded Conversation History

**Detect**: Array/slice of messages growing without truncation, passed entirely to each LLM call
**Why bad**: Context window overflow crashes the call. Token cost grows linearly with session length.
**Fix**: Implement sliding window, summarization, or max-message truncation.

---

### No Retry Logic for Transient Errors

**Detect**: Single LLM call with no retry wrapper, no backoff
**Why bad**: 429 (rate limit), 529 (overload), 503 (timeout) are routine — not retrying = fragile.
**Fix**: Retry 3× with exponential backoff + jitter on 429/529/503.

---

### Streaming Response Not Handled

**Detect**: `stream: true` set but response consumed as non-streaming, or vice versa
**Why bad**: Streaming and non-streaming have different response shapes — causes parse errors or hangs.

---

## 🔵 INFO — Worth Noting

### Temperature Not Set Explicitly

**Detect**: No `temperature` param in generation calls
**Why**: Default varies by model/provider. For deterministic tasks (classification, extraction) set `temperature: 0`. For creative tasks set explicitly. Implicit default = unpredictable behavior across model upgrades.

---

### No Structured Output / JSON Mode for Parseable Responses

**Detect**: Parsing LLM plain text output with regex or string split
**Why**: Fragile. Use `response_format: { type: "json_object" }` or tool use / structured outputs.

---

### AI Config Files Committed Without Review

**Detect**: `.cursor/rules`, `AGENTS.md`, `.github/copilot-instructions.md` present in repo
**Why**: These files instruct AI coding assistants. If compromised or poorly written, they can introduce bad patterns silently across the whole codebase.
**Recommendation**: Review these files in PRs like code. Add them to CODEOWNERS.

---

### Using AI-Generated Code Without Tests

**Detect**: Large blobs of generated code (often visible via git blame / PR size) with no accompanying tests
**Why**: AI-generated code has higher error rates than human-reviewed code. Untested = unknown correctness.
**Recommendation**: Require tests for all AI-generated code paths.

---

## Angular-Specific Bad Practices

### Using `any` / `as SomeType` / unsafe type assertions

**Detect**: `any`, `as SomeType`, `as unknown as SomeType`, `: any` in `.ts` Angular files
**Severity**: warning
**Why bad**: Defeats TypeScript's type system entirely. `as T` is a lie to the compiler — it doesn't validate, it just suppresses errors. Runtime crashes instead of compile-time errors.
**Fix**: Use type guards, `unknown` + narrowing, or schema validation (zod/valibot) for external data.

```ts
// ❌ Bad
const user = response as User;
const val: any = getData();

// ✅ Good
function isUser(val: unknown): val is User {
  return typeof val === 'object' && val !== null && 'id' in val;
}
const user = isUser(response) ? response : null;
```

---

### Constructor-based dependency injection in Angular

**Detect**: `constructor(private readonly service: SomeService)` in Angular components/directives/pipes
**Severity**: info
**Why bad**: Verbose boilerplate, doesn't work in functional contexts (guards, resolvers as functions), harder to tree-shake, mixing concerns.
**Fix**: Use `inject()` at field initializer level.

```ts
// ❌ Bad
constructor(private readonly userService: UserService) {}

// ✅ Good
private readonly userService = inject(UserService);
```

---

### BehaviorSubject/Subject for component-local state

**Detect**: `new BehaviorSubject(...)` or `new Subject()` inside `@Component` class for state that doesn't cross component boundaries
**Severity**: info
**Why bad**: Signals are the Angular-native primitive for reactive component state. BehaviorSubject requires manual subscription management, async pipe, and teardown.
**Fix**: Use `signal()` for local state, `computed()` for derived state, `effect()` for side effects.

```ts
// ❌ Bad
count$ = new BehaviorSubject(0);

// ✅ Good
readonly count = signal(0);
```

---

### `@Input()` / `@Output() EventEmitter` in modern Angular

**Detect**: `@Input()` decorator, `@Output() name = new EventEmitter()` in components
**Severity**: info (Angular 17+)
**Why bad**: Signal inputs/outputs integrate with the signals graph — change detection is more granular and efficient. EventEmitter is legacy.
**Fix**: `input()`, `input.required()`, `output()`.

---

## Go Concurrency Bad Practices

### Mutex unlock without defer

**Detect**: `mu.Lock()` followed by `mu.Unlock()` without `defer` between them
**Severity**: critical
**Why bad**: Any early return, added code path, or panic between Lock and Unlock leaks the lock permanently — deadlock.
**Fix**: Always `defer mu.Unlock()` immediately after `mu.Lock()`.

```go
// ❌ Bad
mu.Lock()
if err != nil {
    return err // lock never released
}
mu.Unlock()

// ✅ Good
mu.Lock()
defer mu.Unlock()
if err != nil {
    return err // defer fires, lock released
}
```

---

### Goroutine without context cancellation

**Detect**: `go func()` body without `ctx.Done()` select case or context propagation
**Severity**: warning
**Why bad**: Goroutine leaks. No way to stop the goroutine on shutdown, test teardown, or request cancellation.
**Fix**: Pass context, select on `ctx.Done()`.

---

### sync.WaitGroup Done not deferred

**Detect**: `wg.Done()` called without `defer` inside goroutine
**Severity**: warning
**Why bad**: Early returns skip Done → WaitGroup counter never reaches zero → deadlock on Wait().
**Fix**: `defer wg.Done()` as first line of goroutine body.

---

### Mutex copied by value

**Detect**: function parameter of struct type containing `sync.Mutex` or `sync.RWMutex` passed by value (not pointer)
**Severity**: critical
**Why bad**: Copying a mutex copies its internal state — the copy starts unlocked even if the original was locked. go vet catches this but not everyone runs it.
**Fix**: Always pass structs containing mutexes by pointer.

---

### Missing -race in test commands

**Detect**: `go test` without `-race` flag in Makefile, CI, or scripts
**Severity**: warning
**Why bad**: Data races are invisible without the race detector. They cause intermittent bugs that are nearly impossible to reproduce.
**Fix**: Always run `go test -race ./...` at minimum in CI.

---

## Angular — Component Architecture Bad Practices

### Inline template or styles in @Component decorator

**Detect**: `template:` or `styles:` properties in `@Component({ })` decorator (not `templateUrl`/`styleUrl`)
**Severity**: warning
**Why bad**: Template and styles mixed into class file — can't diff, can't reuse, editor support weaker, violates single responsibility.
**Fix**: Always use `templateUrl` and `styleUrl`. Enforced by `@angular-eslint/component-max-inline-declarations`.

```ts
// ❌ Bad
@Component({ template: `<div>...</div>`, styles: [`:host {}`] })

// ✅ Good
@Component({ templateUrl: './foo.component.html', styleUrl: './foo.component.scss' })
```

---

### Component nesting exceeds MAX_NESTING_DEPTH

**Detect**: Component at depth N rendering a component that renders another component, where N+2 > MAX_NESTING_DEPTH
**Severity**: warning
**How to detect**: Trace `imports: []` array of components — if a component imports another component which itself imports components, count the chain depth
**Why bad**: Deep nesting creates tightly coupled trees, makes change detection harder to reason about, and makes components impossible to reuse in isolation.
**Fix**: Extract deep leaf components to `shared/ui/` — flat, purely presentational, no children.

---

### Leaf component injecting services or containing business logic

**Detect**: Component in `shared/ui/` (depth 3) with `inject(SomeService)` or signal state beyond simple `input()`/`output()`
**Severity**: warning
**Why bad**: Leaf components should be purely presentational. Business logic in leaves makes them impossible to reuse across features.
**Fix**: Move service injection and state to depth-1 or depth-2 component. Pass data down via `input()`.

---

### Smart component (depth 1) containing presentational markup directly

**Detect**: Page/route component with significant HTML markup inline rather than delegating to child components
**Severity**: info
**Why bad**: Page components become monolithic. Hard to test, hard to reuse sections.
**Fix**: Extract visual sections into depth-2 feature components. Page component should primarily be orchestration.

---

### Missing @depth JSDoc on components

**Detect**: `@Component` class without `@depth` JSDoc comment
**Severity**: info
**Why**: Without explicit depth annotation, nesting violations are caught only at review time, not during development.
**Fix**: Add `/** @depth N — description */` above every component class.
