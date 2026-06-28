# Git Hooks Reference

Used by the project-creator skill when user requests git hooks setup.
Apply per-technology sections based on the project stack.

---

## Interview questions (add to Phase 1)

Ask grouped:
- Run linter before every commit? (pre-commit hook)
- Run tests before push? (pre-push hook — warn: slow, optional)
- Enforce commit message format? (commit-msg hook — conventional commits recommended)
- Which tool: auto-detect from tech stack (see below) or user preference?

---

## Tool selection by technology

| Tech | Pre-commit tool | Commit msg |
|---|---|---|
| Node / Angular / React / Vue | husky + lint-staged | commitlint |
| Python | pre-commit (pip) | commitlint or pre-commit hook |
| Go | pre-commit (pip) or Makefile hook | commitlint or custom |
| Rust | pre-commit (pip) or cargo-husky | commitlint or custom |
| Java / Kotlin | pre-commit (pip) or Maven/Gradle plugin | commitlint |
| Polyglot / Nx monorepo | husky + lint-staged (if has package.json) | commitlint |

---

## Node / Angular / TypeScript — husky + lint-staged

### Installation

```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

### package.json additions

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.html": ["eslint --fix", "prettier --write"],
    "*.scss": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### .husky/pre-commit

```sh
#!/bin/sh
npx lint-staged
```

### .husky/pre-push (optional — only if user wants it)

```sh
#!/bin/sh
npm test
```

### .husky/commit-msg

```sh
#!/bin/sh
npx --no -- commitlint --edit "$1"
```

### commitlint.config.ts

```ts
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'perf', 'revert'],
    ],
    'subject-max-length': [2, 'always', 100],
  },
};

export default config;
```

Conventional commit format: `type(scope): description`
Examples: `feat(auth): add Google OAuth`, `fix(api): handle null response`, `chore: update deps`

---

## Python — pre-commit

### Installation

```bash
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg  # if commit-msg hook needed
```

### .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb=500]

  # Conventional commits (optional)
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

---

## Go — pre-commit

### Installation

```bash
pip install pre-commit   # or brew install pre-commit
pre-commit install
```

### .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      - id: go-fmt
      - id: go-vet
      - id: go-imports
      - id: golangci-lint

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb=500]

  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

---

## Rust — pre-commit

### .pre-commit-config.yaml

```yaml
repos:
  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt --
        language: system
        types: [rust]
        pass_filenames: false

      - id: cargo-clippy
        name: cargo clippy
        entry: cargo clippy -- -D warnings
        language: system
        types: [rust]
        pass_filenames: false

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict

  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

---

## Java / Kotlin — pre-commit + Gradle/Maven

### .pre-commit-config.yaml

```yaml
repos:
  - repo: local
    hooks:
      - id: ktlint
        name: ktlint
        entry: ./gradlew ktlintCheck
        language: system
        pass_filenames: false
        types: [kotlin]

      - id: spotless
        name: spotless check
        entry: ./gradlew spotlessCheck
        language: system
        pass_filenames: false

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict

  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

---

## Nx monorepo — husky + lint-staged with affected

For Nx, lint-staged should run only on affected projects:

```json
{
  "lint-staged": {
    "*.ts": ["nx affected:lint --fix", "prettier --write"],
    "*.html": ["prettier --write"],
    "*.scss": ["prettier --write"]
  }
}
```

Or use `nx format:write` for formatting:
```json
{
  "lint-staged": {
    "**/*": "nx format:write --files"
  }
}
```

---

## Makefile integration (Go / Rust / Python)

Always add hook install to Makefile so `make setup` wires everything:

```makefile
.PHONY: setup lint test

setup:
	pre-commit install
	pre-commit install --hook-type commit-msg

lint:
	pre-commit run --all-files
```

---

## CI — verify hooks didn't get bypassed

Add a pre-commit check to CI so people can't push with `--no-verify`:

```yaml
# GitHub Actions
- name: Run pre-commit
  uses: pre-commit/action@v3.0.1
```

```yaml
# GitLab CI
pre-commit:
  stage: lint
  image: python:3.11
  script:
    - pip install pre-commit
    - pre-commit run --all-files
```
