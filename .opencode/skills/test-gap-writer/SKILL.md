---
name: test-gap-writer
description: Use whenever the user wants tests written or improved for an existing codebase — "write real tests", "add missing tests", "improve test coverage", "test my code properly", "add edge case tests", "проверь тесты", "напиши нормальные тесты", or similar. Also trigger when reviewing/finishing a feature where testing quality matters. Scans the ENTIRE codebase (not just recently edited files) to find genuinely risky, undertested logic — edge cases, error paths, boundary values, concurrency, nil/empty inputs, security checks — instead of shallow happy-path or coverage-padding tests. ALWAYS produces a prioritized test plan and gets it reviewed by the user BEFORE writing any test code. Works across languages/stacks (Go, TypeScript/Angular, Python, Rust, etc.) via auto-detection. Use instead of just bolting a couple of obvious tests onto a file.
---

# Test Gap Writer

Writes tests that would actually catch bugs, not tests that exist to make a coverage number go up. The whole point of this skill is refusing to stop at the happy path.

## Non-negotiable rule

**Never write test code before the plan (Step 3) has been shown to the user and they've responded.** A gap-analysis plan without that checkpoint is just a to-do list nobody asked for; skipping straight to code defeats the purpose of this skill. The only exception: the user explicitly says "skip the plan, just write them."

## Why "coverage padding" tests are worse than no tests

They give false confidence and rot as documentation. Examples to actively avoid generating:
- Testing a getter/setter or a struct literal — nothing to break
- Calling a function and asserting only "it didn't throw" / "no error" with no check on actual output
- Snapshot tests with no reasoning about what would make the snapshot wrong
- Mocking every dependency so completely that the test only checks the mocks were called, not that the logic is correct
- One test per function that only exercises the first `if` branch

If a candidate test would fall into one of these buckets, don't propose it — or reframe it into something that actually exercises a decision point.

## Workflow

### Step 1 — Detect the stack

Look for, in order of what's present: `go.mod`, `package.json` (+ `angular.json`, jest/karma/vitest config), `pyproject.toml`/`requirements.txt`, `Cargo.toml`, `pom.xml`/`build.gradle`, etc. Multiple can coexist (e.g. Go backend + Angular frontend — this matches the common stack in this user's own projects).

For each stack found, identify:
- Test framework and runner command (`go test ./...`, `ng test`, `pytest`, `cargo test`, ...)
- Existing test file naming convention and directory layout
- Existing test utilities/mocks/fixtures already in the repo — reuse these, don't invent parallel ones

Read `references/go.md`, `references/angular-ts.md`, `references/python.md`, or `references/general.md` depending on what's detected — read only the ones relevant to this repo.

### Step 2 — Map the surface and existing coverage

- Enumerate packages/modules/components and their exported/public functions, methods, HTTP handlers, resolvers, components.
- For anything with existing tests, actually open a sample of them — don't infer quality from file existence. Classify each as: **thorough** (branches + edge cases covered), **happy-path-only**, or **padding** (see list above).
- Skip from further analysis: pure data structs/DTOs, generated code (protobuf, gqlgen generated resolvers before hand-written logic is added, mocks), trivial one-line wrappers.

### Step 3 — Risk-based gap analysis (the core of this skill)

For every function/method that is untested, happy-path-only, or padding-only, look for real branches and failure modes, not just "does it run":

- **Boundary values**: zero, negative, empty string/slice/map, nil/null, max int, off-by-one at loop/array bounds
- **Error paths**: every `if err != nil` / `catch` / `Result::Err` branch — what happens when the downstream call actually fails?
- **Concurrency**: goroutines, shared state, channels, races, context cancellation/timeout, WaitGroup misuse
- **State & side effects**: retries, partial writes, idempotency, resource cleanup (defer/close), ordering dependencies between calls
- **Input validation / security**: auth checks, permission boundaries, injection-prone string building, unescaped output
- **Integration seams**: what happens when a mocked dependency returns malformed data, times out, or is called 0/N times instead of 1
- **Regression risk**: use `git log -p --since="..."` / `git blame` around recently changed or recently-bug-fixed code — recent churn is a strong signal something there is fragile

For each candidate, note: what the happy-path test (if any) already covers vs. what's actually missing, and *why* it matters (what bug would slip through today).

Classify each as **Critical** (silent data corruption, security, crash in prod path) / **Important** (wrong behavior on realistic input) / **Nice-to-have** (defensive, unlikely input).

### Step 4 — Present the plan, then stop

Output a plan grouped by file/module, e.g.:

```
## internal/auth/token.go
Current: ValidateToken has a happy-path test only.
- [Critical] expired token → must return ErrExpired, not silently pass
- [Critical] token signed with wrong key → must reject
- [Important] empty/malformed token string → clear error, no panic
- [Nice-to-have] token valid but for different audience claim
```

End the message by asking the user to confirm, cut, or add items — and explicitly stop there. Do not proceed to Step 5 in the same turn.

### Step 5 — Write the tests (only after plan approval)

- Match the repo's existing conventions exactly: table-driven tests for Go, `TestBed`/component harness for Angular, fixtures/parametrize for pytest, etc. — see the relevant reference file.
- One clear scenario per test case; name tests after the scenario, not "test1", "test2".
- Reuse existing mocks/builders/fixtures in the repo instead of writing new scaffolding when equivalent ones already exist.
- After writing, run the test suite (or the relevant subset) to confirm the new tests compile and that they actually fail against a deliberately broken version if you're unsure they're testing anything real (quick sanity check, not mandatory for every single case).

### Step 6 — Summarize

Report what was added, what was deferred (and why — e.g. "needs a real staging dependency, not mockable cheaply"), and re-run instructions for the user.

## Reference files

- `references/go.md` — table-driven tests, testify, goroutine/race testing, gqlgen resolver testing patterns
- `references/angular-ts.md` — TestBed, signals, spies vs real dependencies, Jest/Jasmine/Karma differences
- `references/python.md` — pytest fixtures/parametrize, mocking patterns
- `references/general.md` — language-agnostic checklist to fall back on for anything else (Rust, Java, etc.)
