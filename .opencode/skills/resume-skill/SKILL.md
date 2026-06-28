---
name: resume-from-interrupt
description: >
  Use this skill when the user types /continue or /resume, or when work was interrupted
  mid-task and needs to resume. Triggers on: "/continue", "/resume", "continue", "resume",
  "где остановились", "продолжи", "connection was lost", "упало", "прервалось", "продолжай",
  "lets continue", "pick up where", "finish what you started", or when the user pastes
  partial code/logs without explanation. Also trigger proactively if the current conversation
  contains an unfinished task (scaffolding stopped mid-file, command timed out, output ends
  abruptly). Do NOT wait to be asked — if context shows an interrupted task, use this skill
  immediately. CRITICAL: this skill manages context window budget — always follow the
  context discipline rules or the session will overflow and crash again.
---

# Resume From Interrupt

Recovers state after any interruption and continues from the exact point it stopped —
without overflowing the context window.

**Core principle**: read context sources → extract minimal state → CLEAR everything from
context → generate code with a clean window.

---

## Context Budget Rules — Read First

**Non-negotiable. Violating them causes the overflow we are trying to prevent.**

| Phase | Max tokens to load |
|---|---|
| Phase 0 — Ask user | 0 (just a question) |
| Phase 1 — Detection | 500 (bash output, truncated) |
| Phase 2 — Reconstruction | 1000 (summaries only, no raw dumps) |
| Phase 3 — Context Purge | 0 (nothing new loaded) |
| Phase 4 — Verify | 200 (compiler errors only) |
| Phase 5 — Resume | Clean window — generate freely |

### File reading rules
- Never `cat` a file > 20 lines — use `head`/`tail`/`sed` with line numbers
- Never read more than 100 lines of any file at once
- Never read multiple large files in sequence
- For partial file detection: `tail -20` only
- For reconstruction: `head -10` + `tail -20` per file

### Bash output rules
- Always pipe to `| head -20` or `| tail -20`
- Never let `find` return unbounded results — always `| head -30`
- Never run commands producing > 50 lines without truncation

---

## Phase 0 — Ask User for Context Source

**Always ask first. Do not assume.**

Present the user with context source options:

```
Where should I get context to resume?

1. .agent-state file (fastest — if a previous session wrote one)
2. Git history (git log + git status + git diff)
3. Filesystem scan (find recent files, check completeness)
4. Chat history (current conversation only)
5. You paste it (paste a summary or partial file)
6. All of the above (slowest, most complete)
```

Wait for user response. Then go to the chosen phase(s).

If user types just `/resume` with no answer — default to: **1 → 3 → 4** in that order,
stopping as soon as enough state is recovered.

---

## Phase 1 — Detect & Collect

Run ONLY the sources the user selected. Cap all output.

### Source 1: .agent-state file

```bash
cat /home/claude/.agent-state 2>/dev/null   || cat /tmp/.agent-state 2>/dev/null   || echo "NOT FOUND"
```

If found — extract the structured data. This is ground truth.
After reading: the file content will be purged in Phase 3. Do not re-read.

### Source 2: Git

```bash
# What was done
git -C /home/claude/<project> log --oneline -10 2>/dev/null

# What was in progress
git -C /home/claude/<project> status --short 2>/dev/null | head -20

# What changed
git -C /home/claude/<project> diff --stat HEAD 2>/dev/null | head -20
```

### Source 3: Filesystem scan

```bash
# Find project root
find /home/claude /mnt/user-data/outputs -maxdepth 2 \
  -name "go.mod" -o -name "package.json" -o -name "Cargo.toml" \
  -o -name "pyproject.toml" 2>/dev/null | head -10

# Recent files
find /home/claude -newer /tmp -type f 2>/dev/null | head -30

# Tail of each file — completeness check
for f in $(find /home/claude/<project> -type f | head -20); do
  echo "=== $f ($(wc -l < $f 2>/dev/null) lines) ==="; tail -5 "$f" 2>/dev/null
done
```

### Source 4: Chat history

Scan the current conversation mentally (no tool needed — already in context).
Extract: task name, last completed action, pending steps, key decisions.

### Source 5: User paste

User pastes content directly into chat. Read it, extract state.

---

## Phase 2 — Build Recovery Summary

Synthesize everything into ONE compact block (< 200 tokens). This is the only state
that survives the context purge.

```
RECOVERY:
  project:   <name>
  task:      <one line description>
  tech:      <language/framework/libs>
  done:      [file1, file2, file3]
  partial:   {file: path, at: "function name or line desc"}
  remaining: [step1, step2, step3]
  decisions: [used PostgreSQL, rejected Redis, GraphQL not REST]
  resume_at: <exact file and position>
```

Write this to a temp variable in your working memory.
Do NOT write it to disk — it will live only in the next generation prompt.

---

## Phase 3 — Context Purge ⚠️

**This is the critical step that prevents overflow.**

Before generating any code:

1. **Mentally drop** all raw file contents read during Phase 1
2. **Mentally drop** all bash output beyond what is captured in the Recovery Summary
3. **Mentally drop** all `.agent-state` content — the summary replaces it
4. **Mentally drop** git log/diff details — extracted decisions are in the summary
5. **Retain only**: the Recovery Summary block from Phase 2

The Recovery Summary is < 200 tokens. That is your entire working state.
Everything else is gone.

If the current conversation is very long (many tool calls, large outputs):
→ Do not load anything more into context at all
→ Use ONLY filenames + the Recovery Summary to generate
→ Trust patterns over file contents

---

## Phase 4 — Verify (lightweight)

Run compile check using ONLY error output:

```bash
# Go
go build ./... 2>&1 | grep -E "^#|error:" | head -20

# TypeScript  
npx tsc --noEmit 2>&1 | grep "error TS" | head -20

# Rust
cargo check 2>&1 | grep "^error" | head -20

# Python
python -m py_compile src/**/*.py 2>&1 | head -10
```

If errors: fix using targeted line reads only:
```bash
sed -n "<err_line-3>,<err_line+3>p" <file>
```

Fix. Move on. Do not read full files.

---

## Phase 5 — Resume (clean context)

**One line, then generate. No recap.**

> "Continuing from `<resume_at>`."

Generate code directly from the Recovery Summary. The summary has everything needed:
- What tech/patterns to follow (from `tech` + `decisions`)
- What already exists (from `done`) — do not recreate
- What to write next (from `partial` + `remaining`)

### Update .agent-state after each completed file

After writing each file — immediately update the state file:

```bash
# Append completed file, update partial/remaining
cat > /home/claude/.agent-state << STATE
project: <project>
task: <task>
tech: <tech>
completed:
$(for f in <done_list>; do echo "  - $f"; done)
  - <just_completed>
partial: ~
remaining:
$(for s in <remaining_minus_current>; do echo "  - $s"; done)
decisions:
$(for d in <decisions>; do echo "  - $d"; done)
last_updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATE
```

**Why**: if interrupted again — next `/resume` finds this file and recovers in seconds.
The file is always current. No stale state.

---

## Phase 6 — Complete

When all work is done:

1. Run final check (errors only, `| head -20`)
2. Delete the agent state file — task is complete:
   ```bash
   rm -f /home/claude/.agent-state /tmp/.agent-state
   ```
3. `present_files` with all created/completed files
4. One-line summary:
   ```
   Recovered: <already-complete files>
   Completed: <was-partial files>
   Created:   <new files>
   ```

---

## Edge Cases

### Context already near limit when /resume is called

Do not load anything. Use only:
- Recovery Summary (if already built)
- Filenames only (no content)
- Generate from pattern knowledge

If absolutely need a reference — ask user to paste ONE specific thing.

### .agent-state not found, no git, fresh agent

Run Source 3 (filesystem scan) then Source 4 (chat history if any).
Build Recovery Summary from what you find.
Write `.agent-state` immediately after — for the next time.

### Re-interrupted during resume

`/resume` works again. `.agent-state` was updated after each file — recovery is instant.

---

## Rules

- **Always** ask user which context source to use (Phase 0)
- **Always** purge raw context before generating (Phase 3)
- **Always** write/update `.agent-state` after each completed file
- **Always** use targeted reads — `head`/`tail`/`sed` never bare `cat`
- **Always** cap bash output with `| head -N`
- **Never** keep raw file contents in context during generation
- **Never** re-read `.agent-state` after building the Recovery Summary
- **Never** redo completed work
- **Never** ask more than one question at a time
- **Never** recap before resuming — one line then work
