# Rust Project Reference

## Structure

```
<project>/
├── src/
│   ├── main.rs             # for binaries
│   └── lib.rs              # for libraries
├── tests/                  # integration tests
│   └── integration_test.rs
├── benches/                # benchmarks (optional)
├── Cargo.toml
├── Cargo.lock              # commit for binaries, gitignore for libs
├── clippy.toml
├── rustfmt.toml
├── .editorconfig
├── .gitignore
└── README.md
```

## Cargo.toml baseline

```toml
[package]
name = "<project>"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

## Linting — clippy.toml baseline

```toml
avoid-breaking-exported-api = false
cognitive-complexity-threshold = 10
```

Always run with: `cargo clippy -- -D warnings`

Recommended deny list in `lib.rs` / `main.rs`:

```rust
#![deny(clippy::all)]
#![deny(clippy::pedantic)]
#![deny(missing_docs)]
```

## Formatting — rustfmt.toml

```toml
edition = "2021"
max_width = 100
imports_granularity = "Module"
group_imports = "StdExternalCrate"
```

## Testing conventions

- Unit tests: inline `#[cfg(test)]` module in source file
- Integration tests: `tests/` directory
- Runner: `cargo test`
- Coverage: `cargo llvm-cov` (install via `cargo install cargo-llvm-cov`)

### Example

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_positive() {
        assert_eq!(add(1, 2), 3);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, -2), -3);
    }
}
```

## Makefile

```makefile
.PHONY: lint test build fmt

fmt:
	cargo fmt

lint:
	cargo clippy -- -D warnings

test:
	cargo test

build:
	cargo build --release
```

## CI — GitHub Actions

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:

env:
  CARGO_TERM_COLOR: always

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --check
      - run: cargo clippy -- -D warnings

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo test
```
