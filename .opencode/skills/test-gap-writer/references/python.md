# Python testing patterns

## Detection
- `pyproject.toml` / `requirements.txt` / `setup.py`. Runner: `pytest` unless `unittest` is clearly the established convention in the repo.

## Fixtures & parametrize

Prefer `@pytest.mark.parametrize` for boundary/edge case sweeps instead of copy-pasted near-identical test functions:

```python
@pytest.mark.parametrize("value,expected", [
    (0, ValueError),
    (-1, ValueError),
    (None, TypeError),
    (10**9, None),  # large but valid
])
def test_process_amount(value, expected):
    ...
```

Use fixtures for setup that's shared across tests (DB sessions, temp dirs, fake clocks) — check `conftest.py` for what already exists before adding new ones.

## Mocking

- Mock at the boundary (network calls, filesystem, time) not the business logic itself. Over-mocking internal calls just tests that you wired the mock correctly.
- Use `freezegun` or similar (if already a dependency) for time-dependent logic instead of sleeping in tests or skipping time-based edge cases entirely.

## What to skip

- Testing third-party library internals, trivial `__repr__`/`__eq__` on dataclasses with no custom logic.
