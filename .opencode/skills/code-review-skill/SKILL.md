---
name: code-review
description: >
  Use this skill automatically after writing or modifying any source code file. Trigger
  after every file creation or significant edit — do not wait to be asked. Also triggers
  on "/review", "проверь код", "review this", "check my code", "найди проблемы",
  "что не так с кодом". Reviews one file at a time, researches best practices from the
  web when needed, fixes issues inline, and purges review context before continuing
  generation. Never skip review because "the user will check it anyway" — always review.
---

# Code Review Skill

Automatic per-file code review after every write. Finds issues, researches best practices
when uncertain, fixes inline, moves on — without bloating the context.

---

## Context Budget Rules

Review must not trash the context. Hard limits:

| Step | Max tokens loaded |
|---|---|
| File read | 200 lines max (use `head -200`) |
| Web search results | 3 results, snippet only — no `web_fetch` unless critical |
| Review findings | < 300 tokens (compact list) |
| Fix verification | `head -20` of compiler output only |
| After fix | Purge all review data, retain only fix summary |

---

## When to Trigger

**Automatically** — after every file write or significant edit. No command needed.

The agent writes a file → immediately runs this skill on that file → fixes issues → continues.

**Manually** — `/review` or "проверь код" — reviews the most recently written file,
or the file the user pastes/references.

---

## Phase 1 — Read File (targeted)

```bash
wc -l <file>
```

- ≤ 200 lines → read fully: `cat <file>`
- > 200 lines → read in sections: `head -100`, then `tail -100`, then targeted middle sections if needed
- Never load > 200 lines at once

---

## Phase 2 — Static Analysis First

Run linter/compiler before manual review — catches the obvious automatically:

```bash
# Go
golangci-lint run <file> 2>&1 | head -30
go vet ./... 2>&1 | head -20

# TypeScript / Angular
npx eslint <file> --format compact 2>&1 | head -30
npx tsc --noEmit 2>&1 | grep "error TS" | head -20

# Rust
cargo clippy -- -D warnings 2>&1 | grep -E "^error|^warning" | head -30

# Python
ruff check <file> 2>&1 | head -20
mypy <file> 2>&1 | head -20
```

Collect linter output as compact list. Issues the linter already found → fix immediately,
no research needed.

---

## Phase 3 — Manual Review Checklist

Read `references/checklist-<technology>.md` for the tech-specific checklist.

| Technology | Checklist file |
|---|---|
| Go | `references/checklist-go.md` |
| TypeScript / Angular | `references/checklist-angular.md` |
| Rust | `references/checklist-rust-python.md` (Rust section) |
| Python | `references/checklist-rust-python.md` (Python section) |
| Any | `references/checklist-universal.md` |

Go through the checklist mentally against the file content.
Mark each item: ✓ ok / ✗ issue / ? uncertain.

**Uncertain items** → go to Phase 4 (research).
**Clear issues** → go to Phase 5 (fix).

---

## Phase 4 — Web Research (only when uncertain)

Research is triggered ONLY when:
- A pattern is used that might have known issues but you're not certain
- A library/API call that might have a better alternative
- A security-sensitive area (auth, crypto, input handling)
- A concurrency pattern that might have subtle bugs

### Research rules (context budget critical)

```
Max 2 searches per file review.
Max 3 results per search — snippets only.
No web_fetch unless the snippet is genuinely insufficient.
Extract finding in 1-2 sentences. Discard the rest.
```

### Search pattern

```
"<technology> <specific pattern> best practice <year>"
"<technology> <specific pattern> common mistakes"
"<library> <method> pitfalls"
```

Example: uncertain about `sync.Map` vs `map+mutex` in Go →
Search: `"go sync.Map vs mutex performance 2024"` → read 3 snippets → extract 1-sentence finding → discard search results.

After research: store finding as one line in review notes. Purge everything else.

---

## Phase 5 — Findings Report (compact)

Before fixing, produce a compact findings list (< 300 tokens):

```
FILE: internal/streaming/handler.go
LINTER: 2 issues (errcheck, unused var)
MANUAL:
  ✗ [critical] mutex unlocked without defer — line 34
  ✗ [warning]  error swallowed with _ — line 67
  ✗ [warning]  magic number 1024 — use named const — line 89
  ? [info]     sync.Map used — research says map+mutex faster for this pattern
TOTAL: 4 issues
```

No long explanations in the findings. One line per issue.

---

## Phase 6 — Fix

Fix all issues directly in the file.

### Fix rules

- Fix issues in severity order: critical → warning → info
- Use targeted edits — do not rewrite the whole file
- After each fix: verify with linter/compiler (`| head -20`)
- If a fix introduces a new issue — fix that too before moving on

### What NOT to fix

- Style preferences not backed by a linter rule or clear best practice
- Working code that's "not how I would write it"
- Anything the user explicitly chose (check decisions in `.agent-state` if available)

---

## Phase 7 — Context Purge

After all fixes are applied and verified:

1. Drop all file content read during Phase 1
2. Drop all linter output
3. Drop all web search results and snippets
4. Drop the full findings list
5. **Retain only** the fix summary (< 100 tokens):

```
REVIEW DONE: internal/streaming/handler.go
FIXED: defer unlock (line 34), named const BUFFER_SIZE (line 89)
WARNED: error on line 67 left intentional (user decision)
```

This summary goes to `.agent-state` if it exists:
```bash
# Append review summary to agent state
echo "  reviewed: $(date -u +%H:%M) — handler.go — 2 fixed, 1 warned" >> /home/claude/.agent-state
```

Then continue with the next file.

---

## Severity Levels

| Level | Means | Action |
|---|---|---|
| **critical** | Bug, security issue, data race, panic risk | Fix immediately, block continuation |
| **warning** | Bad practice, maintainability issue, perf | Fix before moving on |
| **info** | Style, minor improvement | Fix if trivial, note if not |
| **skip** | User explicitly decided this pattern | Document, do not touch |

---

## Cross-Skill: tsx-types

When generating any TypeScript or TSX code — read and apply `tsx-types` skill rules:
- No `any`, no `as T`, no `object`, no `Function`
- Props typed with explicit types, event handlers with payload types
- External data starts as `unknown`, narrowed with type guards
- Discriminated unions for variant state
- `as const` for literal types

If `tsx-types` skill is loaded in this session — defer to it entirely for type decisions.

## Smart vs Dumb Components

Universal pattern — applies to Angular, React, Solid, Vue, Svelte, or any component framework.

### Smart (Container) Component
- Owns state (signals, stores, useState, etc.)
- Fetches data, calls services, handles side effects
- Passes data down to dumb children via props/inputs
- Named: `*Page`, `*Container`, `*Screen`, `*Layout`
- Not reused as a UI primitive — lives at route/feature level

### Dumb (Presentational) Component
- Receives everything via props/inputs
- Emits events via callbacks/outputs/emits
- Zero state ownership, zero service access, zero side effects
- Purely renders what it receives
- Fully reusable — works with any data source
- Lives in: `shared/ui/`, `components/ui/`, `primitives/`

### Framework syntax

| Framework | Smart gets data via | Dumb receives via | Dumb emits via |
|---|---|---|---|
| Angular | `inject()` + `toSignal()` | `input()` | `output()` |
| React | `useState` + `useEffect`/SWR | props | callback props |
| Solid | `createSignal` + `createResource` | props | callback props |
| Vue | `setup()` + composables | `defineProps()` | `defineEmits()` |
| Svelte | stores + `onMount` | `export let` | `createEventDispatcher` |

### Rules
- If a component fetches data AND is used in multiple places → split it
- If a component has both state AND presentational markup → split it
- Dumb components must be pure — same props = same output always
- Smart components should have minimal markup — delegate to dumb children

### Example (framework-agnostic)

```
// ❌ Mixed — fetches AND renders reusable UI
UserCard:
  - calls userService.getUser(id)     ← smart responsibility
  - renders <Avatar>, <Name>, <Bio>   ← dumb responsibility
  - used in 5 different places        ← should be dumb

// ✅ Split
UserPageContainer (smart):
  - calls userService.getUser(id)
  - passes user → UserCard

UserCard (dumb, shared/ui):
  - receives user via props/input
  - renders <Avatar>, <Name>, <Bio>
  - works with any User data source
```
## Rules

- **Always** review every file after writing — no exceptions
- **Always** run linter before manual review
- **Always** purge review context after fixing (Phase 7)
- **Always** fix critical issues before continuing to next file
- **Never** load > 200 lines at once
- **Never** do more than 2 web searches per file
- **Never** fetch full web pages — snippets only unless critical security issue
- **Never** rewrite working code without a specific issue to fix
- **Never** fix what the user explicitly chose (check decisions)
- **Never** leave a critical issue unfixed and continue
