# Rust Code Review Checklist

Read `checklist-universal.md` first, then this.

---

## Safety

- [ ] No `unsafe` blocks without a `// SAFETY:` comment explaining invariants
- [ ] `unwrap()` and `expect()` only in tests or truly-impossible cases — not in prod paths
- [ ] `panic!` only for programming errors, not runtime errors
- [ ] All `Result` and `Option` properly handled

## Ownership & Borrowing

- [ ] No unnecessary cloning — borrow where possible
- [ ] Lifetimes explicit where needed (not hidden by elision that confuses intent)
- [ ] `Arc<Mutex<T>>` only when actually shared across threads

## Error Handling

- [ ] Custom error types implement `std::error::Error`
- [ ] `?` operator used consistently — not mixed with `match err`
- [ ] Error variants are informative (not just `Error(String)`)
- [ ] `thiserror` or `anyhow` used appropriately

## Performance

- [ ] No unnecessary heap allocation in hot paths
- [ ] Iterators preferred over explicit loops
- [ ] `String` vs `&str` — borrow string slices where ownership not needed

## Async (if applicable)

- [ ] No blocking calls inside `async fn` — use `tokio::task::spawn_blocking`
- [ ] `Arc` used for shared state in async context (not `Rc`)
- [ ] Tasks have cancellation handling

---

# Python Code Review Checklist

Read `checklist-universal.md` first, then this.

---

## Typing

- [ ] All function signatures have type annotations
- [ ] `Any` not used — use `Union`, `Optional`, or `TypeVar`
- [ ] `mypy --strict` would pass
- [ ] `Optional[X]` or `X | None` used for nullable values

## Error Handling

- [ ] No bare `except:` — always catch specific exception types
- [ ] No `except Exception` without re-raise or logging
- [ ] Context managers (`with`) used for resources

## Patterns

- [ ] List/dict comprehensions preferred over loops where readable
- [ ] `dataclass` or `pydantic` model for structured data (not raw dicts)
- [ ] `pathlib.Path` instead of `os.path` string manipulation
- [ ] f-strings preferred over `.format()` or `%`

## Security

- [ ] No `subprocess` with `shell=True` on user input
- [ ] No `pickle` on untrusted data
- [ ] No `eval()` / `exec()` on external input

## Testing

- [ ] Parametrize with `@pytest.mark.parametrize`
- [ ] Fixtures used for setup/teardown
- [ ] No `print()` in tests — use `capfd` or logging
