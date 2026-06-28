# Universal Code Review Checklist

Applies to any language. Read tech-specific checklist in addition to this.

---

## Security

- [ ] No hardcoded secrets, API keys, passwords, tokens
- [ ] No credentials in comments or TODO
- [ ] User input validated before use
- [ ] No SQL/command injection vectors (string concatenation into queries)
- [ ] Error messages don't leak internal details (stack traces, paths, versions)
- [ ] No `eval()` or equivalent dynamic code execution on user input

## Error Handling

- [ ] All errors checked — no silent swallowing (`_ =`, bare `except:`, `.unwrap()` in prod)
- [ ] Errors propagated or logged with context (not just re-thrown naked)
- [ ] Panic/crash paths handled (nil dereference, index out of bounds)
- [ ] External calls (HTTP, DB, file) have error handling

## Logic

- [ ] No unreachable code
- [ ] No infinite loops without exit condition
- [ ] Off-by-one errors in loops and slices
- [ ] Null/nil/None checked before use
- [ ] Integer overflow possible? (especially in size calculations)

## Naming

- [ ] Names describe what, not how
- [ ] No single-letter variables except loop counters
- [ ] Booleans named as predicates (`isValid`, `hasError`, `canRetry`)
- [ ] No misleading names (`temp` that's not temporary, `data` that has specific meaning)

## Functions

- [ ] Function does one thing
- [ ] Parameters < 5 (if more — consider a struct/object)
- [ ] No boolean parameters that flip function behavior (use two functions or enum)
- [ ] Return types clear and consistent

## Magic Values

- [ ] No magic numbers — use named constants
- [ ] No hardcoded URLs, timeouts, limits — use config or constants

## Comments

- [ ] Comments explain WHY, not WHAT (code shows what)
- [ ] No commented-out code left in
- [ ] No misleading comments that contradict the code

## Dependencies

- [ ] No unnecessary imports/dependencies added
- [ ] External library calls wrapped (not scattered raw throughout business logic)


## Smart / Dumb Component Separation

Applies to any component-based framework (Angular, React, Solid, Vue, Svelte, etc.)

- [ ] Smart components own state, fetch data, inject/import services — never reused as UI primitives
- [ ] Dumb components receive everything via props/inputs, emit via callbacks/outputs/events
- [ ] No component both fetches data AND is used as a reusable UI element
- [ ] Dumb components have zero side effects, zero direct service/store access
- [ ] State needed in multiple places → lifted to nearest smart parent
- [ ] Component named `*Page`, `*Container`, `*Screen` → must be smart
- [ ] Component in `shared/ui/`, `components/ui/`, `primitives/` → must be dumb
