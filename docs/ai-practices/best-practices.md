# AI Best Practices

## Code Generation
- Always use `inject()` over constructor DI
- Use signals over RxJS BehaviorSubject
- No `any`, no `as T`, no `object`, no `Function`
- External data starts as `unknown`, narrowed with type guards

## Component Architecture
- Depth 1: page/route components (smart) — inject services, own signals
- Depth 2: feature sections — `input()` / `output()`, minimal DI
- Depth 3: leaf atoms in `shared/ui/` — purely presentational, zero DI

## Linting
- ESLint enforces no inline template/styles
- Stylelint enforces SCSS best practices
- Pre-commit hooks run lint-staged
