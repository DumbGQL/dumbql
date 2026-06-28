# Failure Patterns Reference

Known error patterns with immediate fixes. Read during Phase 3 when build/run fails.

---

## Go

### `cannot find package`
```
Error: cannot find package "github.com/some/pkg"
Fix: go mod tidy
     go get github.com/some/pkg
```

### `undefined: SomeType`
```
Error: undefined: SomeType
Cause: missing import or wrong package
Fix: check import path, add missing import
     goimports -w <file>.go
```

### `declared and not used`
```
Error: X declared and not used
Fix: remove unused variable or use _ = X
```

### `go.sum out of date`
```
Error: missing go.sum entry
Fix: go mod tidy
```

### Port already in use (smoke test)
```
Error: listen tcp :8080: bind: address already in use
Fix: lsof -ti:8080 | xargs kill -9
     retry smoke test
```

### CGO disabled but C required
```
Error: cgo: C compiler "gcc" not found
Fix: CGO_ENABLED=0 go build ./...
     or: sudo apt-get install gcc
```

---

## TypeScript / Angular

### `Cannot find module`
```
Error: Cannot find module '@/something'
Fix: check tsconfig.json paths mapping
     check import path is correct
     npm install (if external package)
```

### `Property does not exist on type`
```
Error: Property 'x' does not exist on type 'Y'
Fix: add property to interface/type
     use optional chaining: obj?.x
     use type guard before access
     NEVER use: as any or as Y
```

### `Type 'X' is not assignable to type 'Y'`
```
Fix: fix the actual type mismatch
     add type guard
     NEVER fix with: as Y or any
```

### `ng build` — chunk size warning
```
Warning: bundle initial exceeded budget
Fix: lazy load routes
     check for accidental full library imports (import * from)
     use specific named imports
```

### ESLint `no-explicit-any`
```
Error: Unexpected any
Fix: replace with unknown + type guard
     or specific type
     NEVER: eslint-disable without explanation
```

### Module not found after npm install
```
Fix: rm -rf node_modules
     npm ci
```

---

## Rust

### `cannot borrow as mutable`
```
Error: cannot borrow `x` as mutable, as it is not declared as mutable
Fix: add mut: let mut x = ...
```

### `borrow of moved value`
```
Error: use of moved value: `x`
Fix: clone before move: x.clone()
     or restructure to borrow instead
```

### `unused import` / `dead_code`
```
Fix: remove unused import
     or add #[allow(dead_code)] with comment explaining why
```

### `cargo check` passes but `cargo build` fails
```
Cause: usually proc-macro or build script issue
Fix: cargo clean && cargo build
     check build.rs if exists
```

### Clippy `unwrap_used`
```
Error: used unwrap() on Result/Option
Fix: replace with ? operator
     or match/if let
     or expect("clear message") if truly impossible
```

---

## Docker

### `COPY failed: file not found`
```
Error: COPY failed: file not found in build context
Fix: check .dockerignore — file might be excluded
     check path relative to Dockerfile location
     check file actually exists: ls -la <path>
```

### `exec format error`
```
Error: exec format error
Cause: binary built for wrong architecture
Fix: add --platform linux/amd64 to FROM
     or build binary with GOARCH=amd64 GOOS=linux
```

### Port not accessible after `docker run`
```
Fix: check EXPOSE in Dockerfile
     add -p host:container to docker run
     check app binds to 0.0.0.0 not 127.0.0.1
```

### `docker compose config` fails
```
Error: yaml: line X: ...
Fix: validate YAML indentation
     check environment variable syntax: ${VAR} not $VAR
     check version compatibility
```

---

## Python

### `ModuleNotFoundError`
```
Fix: pip install <package> --break-system-packages
     or: check virtual env is activated
     or: check src layout — add src/ to PYTHONPATH
```

### `mypy: error: Cannot find implementation`
```
Fix: pip install types-<package>
     or add to mypy ignore list with comment
```

### `ImportError: attempted relative import`
```
Fix: run as module: python -m <package>.<module>
     not: python src/package/module.py
```

### pytest `no tests ran`
```
Fix: check test file names: must be test_*.py or *_test.py
     check function names: must start with test_
     check pytest.ini / pyproject.toml testpaths
```

---

## General

### Permission denied
```
Fix: chmod +x <script>
     or: bash <script> instead of ./<script>
```

### Command not found
```
Fix: which <command>  — check if installed
     install it or use full path
     check PATH: echo $PATH
```

### Port conflict (any server)
```
Fix: lsof -ti:<port> | xargs kill -9
     or use different port: --port <other>
```

### Out of disk space
```
Fix: df -h  — check usage
     docker system prune  — clean docker
     rm -rf node_modules dist .next  — clean build artifacts
```
