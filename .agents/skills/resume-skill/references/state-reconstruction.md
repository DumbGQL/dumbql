# State Reconstruction Reference

Detailed strategies for recovering task state from different sources.

---

## Reading Chat History

Scan backward from the last message. Extract:

### Task markers (look for these patterns)

```
"create a project"      → scaffolding task
"write a function"      → code generation task
"fix this bug"          → debugging task
"add feature X"         → extension task
"install / set up"      → environment task
```

### Decision markers (extract confirmed choices)

```
"yes, use X"            → technology/library chosen
"no, I prefer Y"        → option rejected
"looks good"            → previous output accepted
"change X to Y"         → correction applied
```

### Progress markers (find last completed step)

```
present_files called    → files were delivered, step complete
"done" / "готово"       → step complete
bash exit code 0        → command succeeded
file created message    → file was written
```

### Interrupt markers (find where it stopped)

```
Message ends with "```" → code block was cut off
Message ends mid-word   → connection dropped during streaming
No response to last msg → agent crashed or timed out
"Error:" with no fix    → tool failed, no recovery attempted
```

---

## Reconstructing File Order

When multiple files are partially created, complete them in this order:

### Go projects
1. `go.mod` — module definition
2. `go.sum` — deps (auto-generated, skip)
3. Types and interfaces (`internal/*/types.go`)
4. Repository layer (`internal/*/repository.go`)
5. Service layer (`internal/*/service.go`)
6. Handlers/controllers (`internal/*/handler.go`)
7. `cmd/*/main.go` — entry point
8. Tests (`*_test.go`)
9. `Makefile`
10. `Dockerfile`
11. `docker-compose.yml`
12. `README.md`

### TypeScript / Angular projects
1. `package.json`
2. `tsconfig.json` / `tsconfig.*.json`
3. `eslint.config.ts`
4. Types (`src/app/shared/types/`)
5. Services (`src/app/core/services/`)
6. Components depth 1 → 2 → 3
7. Routes (`app.routes.ts`)
8. Config (`app.config.ts`)
9. Tests (`*.spec.ts`)
10. `angular.json`
11. CI config

### Rust projects
1. `Cargo.toml`
2. `src/lib.rs` or `src/main.rs`
3. Module files (`src/*.rs`)
4. Tests (inline `#[cfg(test)]` or `tests/`)
5. `Dockerfile`
6. CI config

### Python projects
1. `pyproject.toml`
2. `src/<package>/__init__.py`
3. Module files
4. Tests
5. Config files
6. CI config

---

## Detecting Partial Files

### Signs a file is incomplete

```
# Code indicators
- Function/class definition with no body
- Opening brace `{` without matching `}`  
- Import statements with no usage
- TODO / FIXME / "continue here" comments
- File ends in middle of a string literal
- Last line is a partial statement

# Config indicators  
- JSON ends without closing `}`
- YAML with empty values
- .env with placeholder values like `VALUE_HERE`
- Dockerfile with `RUN` but no command

# Documentation
- README with section headers but no content
- Sections that say "TBD" or "..."
```

### Signs a file is complete

```
- Functions have proper closing brackets
- All imports are used
- No TODO markers (unless intentional)
- File ends with newline
- JSON/YAML parses without errors
- Code compiles/type-checks
```

---

## Log Analysis

### Common interrupt signatures

```bash
# Ctrl+C
^C
KeyboardInterrupt
SIGINT received
Interrupt

# Timeout
context deadline exceeded
operation timed out
read: connection timed out
Error: ETIMEDOUT

# OOM
Killed
Out of memory
Cannot allocate memory

# Network drop
connection reset by peer
broken pipe
EOF
read: connection reset

# Process crash
Segmentation fault
panic: runtime error
thread 'main' panicked
fatal error:
```

### Finding resume point in logs

Read log backward from the end. Find:
1. Last line that indicates successful completion of a step
2. First error/interrupt signal after that
3. Resume from the step AFTER the last successful one

Example:
```log
[10:23:01] Creating go.mod... done          ← completed
[10:23:02] Creating main.go... done         ← completed  
[10:23:03] Creating handler.go...           ← started
[10:23:04] ^C                               ← interrupted here
```
→ Resume from: creating `handler.go`

---

## Ambiguity Resolution

When state is genuinely unclear, prefer this order:

1. **Trust filesystem over chat history** — files don't lie, messages might be truncated
2. **Trust recent timestamps** — newer file = more likely to be the current session
3. **Trust compile errors** — if code references something that doesn't exist, that thing needs to be created
4. **When in doubt, check imports** — unresolved imports tell you exactly what's missing

### The "2+2" heuristic

If you can verify a trivial fact from the recovered state (e.g. "this function is called `Add` and returns `a + b`") and it checks out — you have high confidence in the recovered state. If even trivial things don't match — reconstruct more carefully.
