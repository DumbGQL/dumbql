# Cold Start Recovery

Used when /resume or /continue is called in a fresh agent session with no chat history.
This is the primary use case — treat it as the default, not the edge case.

---

## Cold Start Detection

You're in a cold start if ANY of these are true:
- Chat history has 1-2 messages (just the /resume command and nothing else)
- No prior tool calls visible in context
- User typed /resume or /continue as their first or second message

In cold start: **filesystem is your only source of truth.**

---

## Step 1 — Find the project

```bash
# Most recently modified directory = active project
ls -lt /home/claude/ | head -20
ls -lt /mnt/user-data/outputs/ 2>/dev/null | head -20

# Also check common project locations
find /home/claude -maxdepth 2 -name "go.mod" -o -name "package.json" \
  -o -name "Cargo.toml" -o -name "pyproject.toml" 2>/dev/null | head -10
```

Pick the most recently modified project directory.

---

## Step 2 — Read the task from project artifacts

In order of priority:

### 2a. Check for a resume state file (written by previous agent)
```bash
cat /home/claude/.agent-state 2>/dev/null || \
cat /home/claude/<project>/.agent-state 2>/dev/null || \
cat /tmp/.agent-state 2>/dev/null
```

If found — this is ground truth. Skip to Step 4.

### 2b. Check README
```bash
head -30 /home/claude/<project>/README.md 2>/dev/null
```

README usually describes what the project is and its structure.

### 2c. Check git log
```bash
cd /home/claude/<project> && git log --oneline -10 2>/dev/null
```

Commit messages tell you what was done. Last commit = last completed step.

### 2d. Check git status
```bash
cd /home/claude/<project> && git status 2>/dev/null
```

Untracked/modified files = work in progress.

### 2e. Check git diff
```bash
cd /home/claude/<project> && git diff --stat HEAD 2>/dev/null | head -20
```

Shows exactly what changed but wasn't committed = likely the interrupted work.

---

## Step 3 — Assess completeness without git

If no git repo:

```bash
# Get full file tree (names only — no content)
find /home/claude/<project> -type f | sort | head -50

# Check each file: size and tail
for f in $(find /home/claude/<project> -type f -name "*.go" -o -name "*.ts" \
  -o -name "*.rs" -o -name "*.py" | head -20); do
  echo "=== $f ($(wc -l < $f) lines) ==="
  tail -5 "$f"
done
```

Files that end abruptly = incomplete.
Files with proper endings = complete.
Files listed in imports/references but missing = need to be created.

---

## Step 4 — Write agent state file (prevent future cold starts)

**Every agent session should write a state file on start AND update it after each major step.**

```bash
cat > /home/claude/.agent-state << 'STATE'
project: <project-name>
task: <what we're building>
tech: <language/framework>
completed:
  - <file or step>
  - <file or step>
partial:
  - file: <path>
    stopped_at: <function name or line description>
remaining:
  - <step>
  - <step>
decisions:
  - <key choice made>
last_updated: <timestamp>
STATE
```

Update this file after completing each file or major step:
```bash
# Append to completed list
sed -i "s/partial:/  - <just-completed-file>\npartial:/" /home/claude/.agent-state
```

This file is what makes the NEXT cold start instant.

---

## Step 5 — Infer remaining work from structure

When you know the project type, you know what should exist.

Cross-reference `references/state-reconstruction.md` §"Reconstructing File Order" with what actually exists on disk.

Missing files in the expected order = remaining work.

Example — Go HTTP service, found files:
```
✓ go.mod
✓ go.sum  
✓ cmd/server/main.go
✓ internal/auth/service.go
✗ internal/auth/handler.go     ← missing
✗ internal/streaming/          ← missing entirely
✗ Dockerfile                   ← missing
✗ README.md                    ← missing
```

Resume from: `internal/auth/handler.go`

---

## Cold Start Rules

- **Always write `.agent-state` at session start** — even if reconstructed from scratch
- **Always update `.agent-state` after each completed file**
- **Trust git over filesystem over inference** — in that priority order
- **If truly nothing found** — ask user for project name only, infer the rest
- **Never ask more than one question** in cold start
