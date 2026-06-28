# Python Project Reference

## Detect variant first

- **CLI tool** → single package + Click/Typer
- **Web service** → FastAPI / Django / Flask
- **Library** → src layout, pyproject.toml only
- **Data/ML** → notebooks + src package

---

## Structure (src layout — recommended)

```
<project>/
├── src/
│   └── <project>/
│       ├── __init__.py
│       └── main.py
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── pyproject.toml
├── .ruff.toml              # or ruff config in pyproject.toml
├── mypy.ini
├── .editorconfig
├── .gitignore
└── README.md
```

---

## pyproject.toml baseline

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "<project>"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[project.optional-dependencies]
dev = ["pytest", "pytest-cov", "ruff", "mypy"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "B", "SIM", "ANN"]
ignore = ["ANN101", "ANN102"]

[tool.mypy]
strict = true
python_version = "3.11"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=src --cov-report=term-missing"
```

---

## Linting

Primary: **Ruff** (replaces flake8 + isort + pyupgrade)
Type checking: **mypy** strict mode

Run: `ruff check . && mypy src/`

---

## Testing conventions

- Runner: pytest
- Files: `tests/test_*.py`
- Style: plain functions + fixtures (not unittest classes)
- Coverage: 80% threshold

### Example

```python
# src/<project>/math.py
def add(a: int, b: int) -> int:
    return a + b


# tests/test_math.py
import pytest
from <project>.math import add

@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, -2, -3),
])
def test_add(a: int, b: int, expected: int) -> None:
    assert add(a, b) == expected
```

---

## Makefile

```makefile
.PHONY: lint test

lint:
	ruff check .
	mypy src/

test:
	pytest
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
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install ruff mypy
      - run: ruff check .
      - run: mypy src/

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -e ".[dev]"
      - run: pytest
```
