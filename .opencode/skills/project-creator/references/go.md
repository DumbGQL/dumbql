# Go Project Reference

## Structure

```
<project-name>/
├── cmd/
│   └── <project-name>/
│       └── main.go
├── internal/
│   └── <domain>/
│       ├── <domain>.go
│       └── <domain>_test.go
├── pkg/                    # only if exposing public API
├── go.mod
├── go.sum
├── golangci.yml
├── Makefile
├── .editorconfig
├── .gitignore
└── README.md
```

## go.mod

```
module github.com/<user>/<project>

go 1.22
```

## Makefile (always include)

```makefile
.PHONY: lint test build

lint:
	golangci-lint run ./...

test:
	go test -race -cover ./...

build:
	go build -o bin/<project> ./cmd/<project>
```

## Linting — golangci.yml baseline

If user provides no config, use this as researched baseline (Uber + Google Go style):

```yaml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - revive
    - gosec
    - exhaustive
    - gocritic

linters-settings:
  goimports:
    local-prefixes: github.com/<user>/<project>
  revive:
    rules:
      - name: exported
      - name: var-naming
      - name: error-return

run:
  timeout: 5m
```

---

## Concurrency Rules — Non-Negotiable

These rules apply to **all** generated Go code involving goroutines, mutexes, channels, or any shared state.

### Always unlock via defer

```go
// ❌ Bad — manual unlock, will leak on early return or panic
func (s *Store) Set(key string, val any) {
    s.mu.Lock()
    s.data[key] = val
    s.mu.Unlock()
}

// ✅ Good — defer guarantees unlock even on panic or early return
func (s *Store) Set(key string, val any) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.data[key] = val
}
```

This applies to: `sync.Mutex`, `sync.RWMutex` (both `Lock/Unlock` and `RLock/RUnlock`).

### Always release RLock via defer too

```go
// ✅ Good
func (s *Store) Get(key string) (any, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    val, ok := s.data[key]
    return val, ok
}
```

### Close channels from the sender side only, via defer when appropriate

```go
// ✅ Good — producer closes, defer ensures close on early return
func produce(ch chan<- int) {
    defer close(ch)
    for i := range 10 {
        ch <- i
    }
}
```

### Always pass context as the first argument to goroutine-spawning functions

```go
// ❌ Bad
func (s *Service) Start() {
    go s.run()
}

// ✅ Good
func (s *Service) Start(ctx context.Context) {
    go s.run(ctx)
}
```

### Always handle goroutine lifecycle — no fire-and-forget without cancellation

```go
// ❌ Bad — goroutine leaks if caller exits
go func() {
    for {
        doWork()
        time.Sleep(time.Second)
    }
}()

// ✅ Good — goroutine respects context cancellation
go func() {
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            doWork()
        }
    }
}()
```

### Use sync.WaitGroup with defer Done

```go
// ❌ Bad — Done can be missed on early return
wg.Add(1)
go func() {
    if err := doWork(); err != nil {
        return // wg.Done never called — deadlock
    }
    wg.Done()
}()

// ✅ Good
wg.Add(1)
go func() {
    defer wg.Done()
    doWork()
}()
```

### Prefer channel-based signaling over shared bool + mutex for done/stop signals

```go
// ❌ Bad
type Worker struct {
    mu   sync.Mutex
    done bool
}

// ✅ Good
type Worker struct {
    done chan struct{}
}
// Stop: close(w.done)
// Check: select { case <-w.done: return; default: }
```

### Declare mutex adjacent to the data it protects, document the relationship

```go
// ✅ Good
type Cache struct {
    mu    sync.RWMutex // protects entries
    entries map[string]Entry
}
```

### Never copy a mutex — pass by pointer

```go
// ❌ Bad
func process(s Store) { ... }      // copies the mutex inside Store

// ✅ Good
func process(s *Store) { ... }
```

---

## Testing conventions

- Files: `<name>_test.go` colocated with source
- Package: `package <name>_test` for black-box, `package <name>` for white-box
- Style: table-driven tests (Google Go style)
- Runner: stdlib `testing` + `testify/assert` if user wants assertions
- Coverage: `go test -race -coverprofile=coverage.out ./...`
- Always run tests with `-race` flag — catches data races the compiler won't

### Table-driven example

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"zero", 0, 0, 0},
        {"negative", -1, -2, -3},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.expected)
            }
        })
    }
}
```

---

## CI — GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - uses: golangci/golangci-lint-action@v6
        with:
          version: latest

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true
      - run: go test -race -cover ./...
```

## GitLab CI

```yaml
stages: [lint, test, build]

variables:
  GOPATH: $CI_PROJECT_DIR/.go

cache:
  paths: [.go/pkg/mod/]

lint:
  stage: lint
  image: golangci/golangci-lint:latest
  script: golangci-lint run ./...

test:
  stage: test
  image: golang:1.22
  script: go test -race -cover ./...

build:
  stage: build
  image: golang:1.22
  script: go build -o bin/app ./cmd/...
```
