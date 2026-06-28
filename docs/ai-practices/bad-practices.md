# AI Bad Practices to Avoid

## Critical
- `any` types — disable type checking entirely
- `as T` assertions — lie to compiler, crash at runtime
- Inline templates/styles in Angular components
- Constructor-based DI (use `inject()`)

## Warning
- Mixed smart/dumb components — split them
- Broad `any` imports like `from '@taiga-ui/core'` (import specific components)
- No type guards for API responses
- RxJS BehaviorSubject when signal suffices

## Info
- No JSDoc depth annotations on components
- Missing `@return` types on async functions
- Barrel files with uncontrolled re-exports
