# Go Code Review Checklist

Read `checklist-universal.md` first, then this.

---

## Concurrency (critical — always check)

- [ ] Every `mu.Lock()` has `defer mu.Unlock()` immediately after
- [ ] Every `mu.RLock()` has `defer mu.RUnlock()` immediately after
- [ ] Every `wg.Add(1)` goroutine has `defer wg.Done()` as first line
- [ ] No mutex copied by value (struct with mutex passed as pointer)
- [ ] Every goroutine has context cancellation (`select { case <-ctx.Done(): }`)
- [ ] No goroutine started without a way to stop it
- [ ] Channel senders close channels (not receivers)
- [ ] No close on nil channel, no send on closed channel
- [ ] `defer close(ch)` used in producers

## Error Handling

- [ ] No `_ = someFunc()` discarding errors
- [ ] Errors wrapped with context: `fmt.Errorf("doing X: %w", err)`
- [ ] No bare `return err` without adding context in non-trivial functions
- [ ] `errors.Is` / `errors.As` used for error comparison (not string matching)

## Resource Management

- [ ] Every `os.Open` / DB connection / HTTP response body has `defer close()`
- [ ] `defer` used for cleanup (not manual close that can be skipped)
- [ ] HTTP response body closed even on error paths

## Types & Interfaces

- [ ] Interfaces defined at point of use (not in the package that implements them)
- [ ] No `interface{}` / `any` without a clear reason
- [ ] Struct fields that should be private are unexported

## Context

- [ ] `context.Context` is first parameter in functions that do I/O
- [ ] `context.Background()` used only at top level (not in library code)
- [ ] Context not stored in struct fields

## Performance

- [ ] Slices pre-allocated when size known (`make([]T, 0, n)`)
- [ ] No string concatenation in loops (use `strings.Builder`)
- [ ] No unnecessary allocations in hot paths

## Testing

- [ ] Tests use table-driven pattern
- [ ] Test file uses `package foo_test` for black-box (or `package foo` for white-box with reason)
- [ ] `t.Run` used for subtests
- [ ] Tests run with `-race` flag (check Makefile)
