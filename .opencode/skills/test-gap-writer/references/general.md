# General language-agnostic checklist

Use this when the detected stack isn't Go, Angular/TS, or Python (e.g. Rust, Java, Kotlin, C++, PHP, Ruby).

1. Find the test framework already in use from the build manifest (`Cargo.toml` → built-in `#[test]` / `cargo test`; `pom.xml`/`build.gradle` → JUnit; `composer.json` → PHPUnit/Pest; `Gemfile` → RSpec/Minitest) and match its idioms — don't import a different framework.
2. Apply the same risk categories as everywhere else in this skill: boundary values, error/exception paths, concurrency/shared state, resource cleanup, input validation, integration-seam failures, and recently-churned code (via `git log`/`git blame`).
3. Rust specifics: test `Result::Err` paths explicitly, panics via `#[should_panic]` only when a panic is the *intended* contract (not as a substitute for proper error handling), and `unsafe` blocks deserve extra scrutiny for UB-triggering edge cases.
4. Java/Kotlin specifics: null-safety edge cases (even in Kotlin, platform types from Java interop), exception hierarchy (catching too broad vs too narrow), and thread-pool/executor shutdown behavior.
5. Whatever the language, keep applying the core rule from SKILL.md: skip generated code, trivial data holders, and one-line wrappers — focus effort on anything with a branch, a loop, an external call, or shared state.
