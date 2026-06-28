# Angular / TypeScript Code Review Checklist

Read `checklist-universal.md` first, then this.

---

## Typing (critical)

- [ ] No `any` anywhere — use `unknown` + type guard for external data
- [ ] No `as SomeType` type assertions — use type guards
- [ ] No `as unknown as SomeType` double assertion
- [ ] All function return types explicit
- [ ] `@typescript-eslint/consistent-type-imports` respected (type imports use `import type`)

## Angular — Signals

- [ ] Local component state uses `signal()` not `BehaviorSubject`
- [ ] Derived state uses `computed()` not manual subscriptions
- [ ] Side effects use `effect()` not `ngOnInit` subscriptions
- [ ] HTTP/Observable wrapped with `toSignal()` where appropriate
- [ ] Inputs use `input()` / `input.required()` not `@Input()`
- [ ] Outputs use `output()` not `@Output() EventEmitter`

## Angular — DI & Structure

- [ ] Dependencies injected via `inject()` not constructor parameters
- [ ] Component has `@depth N` JSDoc comment
- [ ] Nesting depth respected (no depth-3 component importing other components)
- [ ] Separate files: `templateUrl` and `styleUrl` — never inline `template`/`styles`
- [ ] Leaf components (depth 3) have zero service injections

## Angular — Component

- [ ] `OnPush` change detection strategy set (or signals used — then it's automatic)
- [ ] No logic in templates beyond simple signal reads and conditionals
- [ ] No direct DOM manipulation — use renderer or signals

## Subscriptions

- [ ] Every `subscribe()` has a corresponding unsubscribe or `takeUntilDestroyed()`
- [ ] No manual subscription management when `toSignal()` or `async` pipe can be used
- [ ] No nested subscriptions (use operators: `switchMap`, `mergeMap`, etc.)

## TypeScript Patterns

- [ ] `unknown` used for external data (HTTP responses, localStorage, events)
- [ ] Type guards defined for all `unknown` → `T` narrowing
- [ ] `readonly` on arrays and objects that shouldn't mutate
- [ ] Enums or const objects instead of magic strings

## Smart / Dumb Component Separation

See `checklist-universal.md` for base rules. Angular-specific additions:

- [ ] Smart: uses `inject()`, owns `signal()`/`toSignal()`, named `*Page` or `*Container`
- [ ] Dumb: only `input()`/`output()`, zero `inject()`, lives in `shared/ui/`
- [ ] `@depth` JSDoc present and matches actual nesting depth
- [ ] Depth 3 (leaf) component — zero `inject()`, zero `signal()` beyond simple inputs

## Performance

- [ ] No heavy computation in signal/computed without memoization
- [ ] `trackBy` used in `@for` loops
- [ ] Images have explicit dimensions (avoid layout shift)
