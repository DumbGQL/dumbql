---
name: verify-output
description: >
  Use this skill automatically after generating any code, configuration, script, or project.
  Trigger after every file write, project scaffold, or "done" claim — do not wait to be asked.
  Also triggers on "/verify", "/run", "проверь что работает", "запусти", "убедись что работает",
  "test it", "does it work". CRITICAL: never say "everything works" or "ready" or "готово"
  without actually running the code and seeing non-error output. If you cannot run it — say so
  explicitly instead of claiming it works. This skill prevents the #1 agent failure mode:
  confidently delivering broken code.
---

# Verify Output

Run what you generate. See it work. Only then say it works.

**The rule**: no "готово", no "everything works", no "should be working" without proof.
Proof = actual terminal output showing the thing running correctly.

---

## Context Budget

| Step | Max tokens |
|---|---|
| Run output | 50 lines (`head -50`) |
| Error analysis | 30 lines targeted |
| Fix attempt | targeted edit only |
| Final proof | 20 lines of output |

---

## When to Trigger

**Automatically** after:
- Any project scaffold completed
- Any new file with runnable code written
- Any configuration file written (docker, CI, nginx, etc.)
- Any "I've finished" / "готово" / "done" moment

**Manually**: `/verify`, `/run`, "запусти это"

---

## Phase 1 — Determine What to Run

Based on what was just generated, decide the verification target:

| Generated | Run |
|---|---|
| Go project | `go build ./...` then `go test ./...` |
| Go single file | `go vet <file>` + `go run <file>` if has main |
| Angular project | `npm run build` (or `ng build`) |
| TypeScript file | `npx tsc --noEmit` |
| Rust project | `cargo build` then `cargo test` |
| Python file/project | `python -m py_compile` + `python -m pytest` if tests exist |
| Dockerfile | `docker build .` |
| docker-compose | `docker compose config` (validate) |
| Shell script | `bash -n <script>` (syntax check) + run if safe |
| Makefile | `make --dry-run` |
| CI config | validate syntax (yamllint / actionlint) |
| nginx config | `nginx -t` |
| SQL migration | syntax check + dry run if possible |

Read `references/run-commands.md` for full command list per tech.

---

## Phase 2 — Run It

Run the verification command. **Always capture output.**

```bash
# Example: Go project
go build ./... 2>&1 | head -50
echo "exit: $?"
```

**Required**: always print `exit: $?` after the command.
Exit code 0 = success. Anything else = failure, go to Phase 3.

### Safety rules before running

- Never run destructive commands (DROP TABLE, rm -rf, format disk)
- Never run network calls to production endpoints
- Never run commands that require real API keys — check for placeholder values first
- If unsure whether safe → run with `--dry-run` or equivalent first

---

## Phase 3 — If It Fails

Do not say "there might be an issue". Fix it.

### Failure response protocol

1. Read the error output (already captured, max 50 lines)
2. Identify root cause — do NOT guess, read the actual error message
3. Fix the specific issue
4. Run again
5. Repeat up to **3 times**

If after 3 attempts it still fails:
- Show the user the exact error output
- Explain what you tried
- Ask for one specific thing needed to proceed
- Do NOT claim it works

### Common failure patterns

Read `references/failure-patterns.md` for known patterns and fixes by tech.

---

## Phase 4 — Smoke Test (beyond compile)

Compile success ≠ works correctly. Run a smoke test:

### Go HTTP server
```bash
# Start in background, test endpoint, kill
go run ./cmd/server & sleep 2
curl -s http://localhost:8080/health | head -5
kill %1
```

### Angular build
```bash
npm run build 2>&1 | tail -10
# Check dist/ was actually created
ls -la dist/ | head -10
```

### Go tests
```bash
go test -v ./... 2>&1 | tail -20
# Must show: ok or PASS — not just "no test files"
```

### Docker
```bash
docker build -t verify-test . 2>&1 | tail -10
docker run --rm verify-test echo "container starts" 2>&1
docker rmi verify-test 2>/dev/null
```

### Python
```bash
python -m pytest -x -q 2>&1 | tail -20
```

---

## Phase 5 — Proof Output

After successful verification, show **actual terminal output** as proof:

```
✓ VERIFIED: go build ./...
  exit: 0

✓ VERIFIED: go test ./...
  ok  github.com/deprecated-guy/strix/internal/auth   0.412s
  ok  github.com/deprecated-guy/strix/internal/streaming  0.318s
  exit: 0

✓ SMOKE TEST: /health endpoint
  {"status":"ok","version":"0.1.0"}
  exit: 0
```

Only after showing this output → say "готово" or "works".

---

## Phase 6 — What NOT to Say Without Proof

These phrases are **banned** without actual terminal output proving it:

| Banned | Replace with |
|---|---|
| "Everything should work" | Show the output |
| "This should compile" | Actually compile it |
| "The tests should pass" | Actually run them |
| "готово" | Show proof first |
| "I believe this is correct" | Run it and show output |
| "This follows best practices so it should work" | Run it |
| "The code looks good" | That's review, not verification |

If you genuinely cannot run something (missing runtime, requires production secrets, etc.):

> "Cannot verify directly — [reason]. Here's what you'd need to run to check: `<command>`"

That's honest. Claiming it works without running it is not.

---

## Context Purge After Verification

After Phase 5:
- Drop all run output beyond the proof snippet
- Drop error messages from failed attempts
- Retain only: proof lines + fix summary
- Continue to next task with clean context

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

- **Never** say "works" / "готово" / "ready" without terminal proof
- **Never** skip verification because "the code looks correct"
- **Never** run destructive or production-affecting commands
- **Always** show exit code
- **Always** show actual output, not a description of output
- **Always** fix failures before claiming done (up to 3 attempts)
- **Always** be honest when something cannot be verified — say why
- **Retry limit**: 3 attempts then escalate to user with exact error
