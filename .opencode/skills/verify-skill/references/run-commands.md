# Run Commands Reference

Full command list for verification by technology and artifact type.
All commands pipe to `| head -50` and print `echo "exit: $?"`.

---

## Go

```bash
# Syntax + type check (fast)
go vet ./... 2>&1 | head -30
echo "exit: $?"

# Build all
go build ./... 2>&1 | head -50
echo "exit: $?"

# Tests (with race detector)
go test -race ./... 2>&1 | tail -20
echo "exit: $?"

# Single file with main
go run <file>.go 2>&1 | head -20
echo "exit: $?"

# Lint (if golangci-lint installed)
golangci-lint run ./... 2>&1 | head -40
echo "exit: $?"

# HTTP server smoke test
go run ./cmd/<name>/ &
SERVER_PID=$!
sleep 2
curl -sf http://localhost:8080/health 2>&1 | head -5
echo "exit: $?"
kill $SERVER_PID 2>/dev/null
```

---

## TypeScript / Angular

```bash
# Type check only (no emit)
npx tsc --noEmit 2>&1 | head -40
echo "exit: $?"

# Angular build
npm run build 2>&1 | tail -20
echo "exit: $?"
ls -la dist/ 2>/dev/null | head -10

# Angular lint
npm run lint 2>&1 | head -40
echo "exit: $?"

# Angular tests (headless)
npm test -- --watch=false --browsers=ChromeHeadless 2>&1 | tail -20
echo "exit: $?"

# Jest / Vitest
npx jest --passWithNoTests 2>&1 | tail -20
echo "exit: $?"
npx vitest run 2>&1 | tail -20
echo "exit: $?"

# ESLint single file
npx eslint <file> --format compact 2>&1 | head -20
echo "exit: $?"
```

---

## Rust

```bash
# Check (faster than build)
cargo check 2>&1 | head -40
echo "exit: $?"

# Build
cargo build 2>&1 | head -40
echo "exit: $?"

# Build release
cargo build --release 2>&1 | tail -10
echo "exit: $?"

# Tests
cargo test 2>&1 | tail -20
echo "exit: $?"

# Clippy
cargo clippy -- -D warnings 2>&1 | head -40
echo "exit: $?"

# Format check
cargo fmt --check 2>&1 | head -10
echo "exit: $?"

# HTTP server smoke test
cargo run &
SERVER_PID=$!
sleep 3
curl -sf http://localhost:8080/health 2>&1 | head -5
echo "exit: $?"
kill $SERVER_PID 2>/dev/null
```

---

## Python

```bash
# Syntax check
python -m py_compile <file>.py 2>&1 | head -10
echo "exit: $?"

# Type check
mypy src/ 2>&1 | head -30
echo "exit: $?"

# Lint
ruff check . 2>&1 | head -30
echo "exit: $?"

# Tests
python -m pytest -x -q 2>&1 | tail -20
echo "exit: $?"

# With coverage
python -m pytest --cov=src -q 2>&1 | tail -20
echo "exit: $?"

# FastAPI smoke test
uvicorn app.main:app --port 8000 &
SERVER_PID=$!
sleep 2
curl -sf http://localhost:8000/health 2>&1 | head -5
echo "exit: $?"
kill $SERVER_PID 2>/dev/null
```

---

## Docker

```bash
# Build image
docker build -t verify-test . 2>&1 | tail -15
echo "exit: $?"

# Start and check it runs
docker run --rm -d --name verify-container verify-test
sleep 2
docker ps | grep verify-container
docker logs verify-container 2>&1 | head -20
docker stop verify-container 2>/dev/null
docker rmi verify-test 2>/dev/null

# Validate compose file (no containers started)
docker compose config 2>&1 | head -20
echo "exit: $?"

# Lint Dockerfile (if hadolint installed)
hadolint Dockerfile 2>&1 | head -20
echo "exit: $?"
```

---

## Shell Scripts

```bash
# Syntax check only (safe)
bash -n <script>.sh 2>&1 | head -10
echo "exit: $?"

# Shellcheck (if installed)
shellcheck <script>.sh 2>&1 | head -20
echo "exit: $?"

# Run with safe test args (only if script is clearly safe)
bash <script>.sh --dry-run 2>&1 | head -20
echo "exit: $?"
```

---

## Configuration Files

```bash
# YAML (requires yamllint)
yamllint <file>.yml 2>&1 | head -20
echo "exit: $?"

# GitHub Actions (requires actionlint)
actionlint .github/workflows/<file>.yml 2>&1 | head -20
echo "exit: $?"

# nginx (requires nginx installed)
nginx -t -c $(pwd)/<file>.conf 2>&1 | head -10
echo "exit: $?"

# JSON
python -m json.tool <file>.json > /dev/null 2>&1
echo "exit: $?"

# TOML (Python)
python -c "import tomllib; tomllib.load(open('<file>.toml','rb'))"
echo "exit: $?"
```

---

## Makefile

```bash
# Dry run — shows what would execute without running
make --dry-run 2>&1 | head -30
echo "exit: $?"

# Check specific target
make --dry-run lint 2>&1 | head -20
make --dry-run test 2>&1 | head -20
make --dry-run build 2>&1 | head -20
```

---

## SQL Migrations (Flyway / goose)

```bash
# goose — validate only
goose validate 2>&1 | head -20
echo "exit: $?"

# Check SQL syntax (requires sqlfluff)
sqlfluff lint <migration>.sql 2>&1 | head -20
echo "exit: $?"
```
