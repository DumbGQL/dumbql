# TypeScript / Angular / Node Reference

## Detect variant first

Ask or infer from context:

- **Angular** → use Angular CLI structure + strict mode + signals
- **Node/Express/Fastify** → backend service structure
- **Library/SDK** → lib structure with dual CJS+ESM output
- **Nx monorepo** → ask if they want Nx, then follow Nx conventions

---

## Angular Structure

```
<project>/
├── src/
│   ├── app/
│   │   ├── core/                   # singleton services, guards, interceptors, tokens
│   │   ├── shared/
│   │   │   ├── ui/                 # leaf/atom components (depth 3 max)
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   ├── features/
│   │   │   └── <feature>/
│   │   │       ├── <feature>-page/ # depth 1 — smart, route-level
│   │   │       │   ├── <feature>-page.component.ts
│   │   │       │   ├── <feature>-page.component.html
│   │   │       │   └── <feature>-page.component.scss
│   │   │       └── <section>/      # depth 2 — feature section
│   │   │           ├── <section>.component.ts
│   │   │           ├── <section>.component.html
│   │   │           └── <section>.component.scss
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   └── environments/
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── eslint.config.ts
├── .prettierrc
├── package.json
└── README.md
```

**Leaf/atom components** always live in `shared/ui/` — they are shared across features and never nest further.

---

## Node/Fastify Structure

```
<project>/
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── types/
│   └── index.ts
├── tests/
├── tsconfig.json
├── eslint.config.ts
├── .prettierrc
├── package.json
└── README.md
```

---

## tsconfig.json baseline (strict)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

---

## ESLint — flat config baseline (typescript-eslint strict)

```ts
// eslint.config.ts
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: { project: true },
    },
    rules: {
      // No any — period
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      // No type assertions
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // Angular: no inline template/styles
      '@angular-eslint/component-max-inline-declarations': ['error', { template: 0, styles: 0 }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
```

**`assertionStyle: 'never'`** bans all `as SomeType`. For unavoidable third-party interop use `eslint-disable` with an explicit comment — never silently.

## Prettier baseline

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Angular — Component Architecture

### File separation — always 3 files per component

```ts
// ✅ Good — always separate files
@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  standalone: true,
})
export class UserCardComponent {}

// ❌ Bad — inline template/styles
@Component({
  selector: 'app-user-card',
  template: `<div>{{ name }}</div>`,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class UserCardComponent {}
```

**Rule**: `@Component` decorator must always use `templateUrl` and `styleUrl`. Never `template` or `styles`. Enforced by ESLint rule above.

### Component nesting depth (enforced by MAX_NESTING_DEPTH from interview)

Three tiers, each with strict responsibilities:

**Depth 1 — Smart / Page component** (one per route)

- Lives in `features/<feature>/<feature>-page/`
- Injects services, owns page-level signals, manages route params
- Orchestrates layout only — no business UI logic inline
- May contain depth-2 components

**Depth 2 — Feature / Section component**

- Lives in `features/<feature>/<section>/`
- Receives data via `input()`, emits via `output()`
- No service injection except for self-contained features (e.g. its own form service)
- May contain depth-3 components from `shared/ui/`

**Depth 3 — Leaf / Atom component** (max depth — no children)

- Lives in `shared/ui/<name>/`
- Only `input()` and `output()` — zero business logic, zero service injection
- Purely presentational — renders exactly what it receives
- Must not import or render other components

```
// Example: MAX_NESTING_DEPTH = 3
UserPageComponent          // depth 1 — smart
  └── UserProfileSection   // depth 2 — feature section
        └── AvatarComponent  // depth 3 — leaf, shared/ui, no children allowed
```

When writing components, always add a JSDoc comment indicating depth:

```ts
/**
 * @depth 1 — Smart page component for /users/:id route.
 * Owns page state and data fetching.
 */
@Component({ ... })
export class UserPageComponent { }
```

---

## Angular — Signals & Modern Patterns

**All generated Angular code uses signals. No exceptions.**

### DI — always `inject()`, never constructor

```ts
// ❌ Bad
constructor(private readonly userService: UserService) {}

// ✅ Good
private readonly userService = inject(UserService);
```

### Local state — `signal()` over BehaviorSubject

```ts
// ❌ Bad
count$ = new BehaviorSubject(0);

// ✅ Good
readonly count = signal(0);

increment(): void {
  this.count.update(c => c + 1);
}
```

### Derived state — `computed()`

```ts
readonly total = computed(() =>
  this.items().reduce((sum, i) => sum + i.price, 0)
);
```

### Side effects — `effect()`

```ts
constructor() {
  effect(() => {
    console.log('count changed:', this.count());
  });
}
```

### Async / HTTP — `toSignal()`

```ts
readonly users = toSignal(inject(UserService).getAll(), { initialValue: [] });
```

### Inputs / Outputs — signal-based

```ts
readonly title = input.required<string>();
readonly subtitle = input<string>();
readonly clicked = output<void>();
```

### Typing — no `any`, no unguarded assertions

```ts
// ❌ Bad
const data = response as UserData;
const result: any = fetch();

// ✅ Good — type guard
function isUserData(val: unknown): val is UserData {
  return typeof val === 'object' && val !== null && 'id' in val;
}
```

For HTTP responses and external data: start with `unknown`, validate with a type guard or schema lib (zod, valibot), then assign to a typed variable.

---

## UI Library Integration

**This section is populated during Phase 2.5 (UI Library Research).**

When a UI library is selected, research and document the following in `docs/ui-library-practices.md`:

### Research checklist per library

- [ ] Installation command for current Angular/framework version
- [ ] Required peer dependencies and version constraints
- [ ] Module/provider setup in `app.config.ts`
- [ ] Theming: how to override tokens/variables, where config lives
- [ ] Tree-shaking: named imports vs barrel imports, bundle impact
- [ ] Recommended import pattern (per-component vs global)
- [ ] Form integration (reactive forms, signal-based forms if applicable)
- [ ] TypeScript strictness level the library supports
- [ ] Known issues with the user's exact framework version
- [ ] Component patterns: tables, modals/dialogs, navigation

### Generated sample component

Always generate one working example component showing:

- Correct import pattern for the chosen library
- Correct usage of at least one interactive component (button, input, or card)
- Proper typing with no `any`

```ts
// Example: Taiga UI button in a standalone component
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [TuiButton],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss',
})
export class ExampleComponent {
  readonly clicked = output<void>();
}
```

---

## Testing

### Angular

- Runner: Jest or Vitest (preferred over Karma)
- Files: `*.spec.ts` colocated with component
- Style: AAA (Arrange / Act / Assert)
- Coverage: 80% threshold
- Signal values: read directly via `component.count()` in tests
- Use `TestBed.configureTestingModule` with `provideHttpClientTesting` etc.

### Node

- Runner: Vitest or Jest
- Files: `tests/*.test.ts`

### Example (Vitest)

```ts
import { describe, it, expect } from 'vitest';
import { add } from '../src/math';

describe('add', () => {
  it('adds two positive numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
  it('handles zero', () => {
    expect(add(0, 0)).toBe(0);
  });
});
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

## GitLab CI

```yaml
stages: [install, lint, test, build]

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths: [node_modules/]

install:
  stage: install
  image: node:20
  script: npm ci

lint:
  stage: lint
  image: node:20
  script: npm run lint

test:
  stage: test
  image: node:20
  script: npm test

build:
  stage: build
  image: node:20
  script: npm run build
```
