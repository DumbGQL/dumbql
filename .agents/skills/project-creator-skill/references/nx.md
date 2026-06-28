# Nx Monorepo Reference

Used when user requests Nx monorepo setup or answers "yes" to Nx in the Angular/Node interview.

---

## Interview questions

Ask grouped before scaffolding:

- What apps will live in the monorepo? (list them)
- Any shared libraries? (UI components, utilities, data-access, types)
- Build system: Nx Cloud caching or local only?
- Package manager: npm / yarn / pnpm?
- Bundler preference: Rspack (faster) or Webpack? (default: Rspack for Angular)

---

## Structure

```
<workspace>/
├── apps/
│   ├── <app-name>/              # Angular / Node / React app
│   │   ├── src/
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   └── <app-name>-e2e/          # E2E tests (Playwright / Cypress)
├── libs/
│   ├── shared/
│   │   ├── ui/                  # Shared UI components (publishable or internal)
│   │   │   ├── src/
│   │   │   └── project.json
│   │   ├── data-access/         # Services, state, API clients
│   │   ├── util/                # Pure functions, helpers
│   │   └── types/               # Shared TypeScript interfaces/types
│   └── <feature>/
│       ├── feature/             # Feature-specific components
│       └── data-access/         # Feature-specific services
├── tools/                       # Custom Nx generators, executors
├── nx.json
├── tsconfig.base.json
├── package.json
└── .eslintrc.base.json          # or eslint.config.base.ts
```

### Library types (Nx convention)

| Type          | Purpose                        | Can depend on                        |
| ------------- | ------------------------------ | ------------------------------------ |
| `feature`     | Smart components, pages        | `data-access`, `ui`, `util`, `types` |
| `ui`          | Dumb/presentational components | `ui`, `util`, `types`                |
| `data-access` | Services, state, HTTP          | `util`, `types`                      |
| `util`        | Pure functions, pipes, guards  | `types`                              |
| `types`       | Interfaces, enums, DTOs        | nothing                              |

**Enforce with module boundary rules** (see eslint config below).

---

## Initialization

```bash
# New workspace
npx create-nx-workspace@latest <workspace> --preset=angular-monorepo --bundler=rspack

# Add Angular app to existing
nx g @nx/angular:app <app-name> --bundler=rspack --style=scss --standalone

# Add library
nx g @nx/angular:lib shared/ui --standalone --buildable
nx g @nx/angular:lib shared/types --buildable
nx g @nx/js:lib shared/util
```

---

## nx.json

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)", "!{projectRoot}/tsconfig.spec.json"],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "cache": true,
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default"]
    }
  },
  "plugins": [
    {
      "plugin": "@nx/eslint/plugin",
      "options": { "targetName": "lint" }
    },
    {
      "plugin": "@nx/jest/plugin",
      "options": { "targetName": "test" }
    }
  ]
}
```

---

## tsconfig.base.json — path aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@<workspace>/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@<workspace>/shared/types": ["libs/shared/types/src/index.ts"],
      "@<workspace>/shared/util": ["libs/shared/util/src/index.ts"],
      "@<workspace>/shared/data-access": ["libs/shared/data-access/src/index.ts"]
    }
  }
}
```

Always import from path aliases, never relative cross-library imports:

```ts
// ❌ Bad
import { UserType } from '../../../libs/shared/types/src/lib/user.type';

// ✅ Good
import type { UserType } from '@<workspace>/shared/types';
```

---

## ESLint — module boundary rules

Add to root `eslint.config.ts` or `.eslintrc.json`:

```ts
{
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        allow: [],
        depConstraints: [
          // Apps can import from any lib
          { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['*'] },
          // Feature libs can import data-access, ui, util, types
          { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:util', 'type:types'] },
          // UI libs can only import ui, util, types
          { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:types'] },
          // data-access can import util and types
          { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:util', 'type:types'] },
          // util and types have no dependencies
          { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:types'] },
          { sourceTag: 'type:types', onlyDependOnLibsWithTags: [] },
        ],
      },
    ],
  },
}
```

Add tags to each library's `project.json`:

```json
{
  "tags": ["type:ui", "scope:shared"]
}
```

---

## Common Nx commands

```bash
# Run for one project
nx build <app-name>
nx test <lib-name>
nx lint <app-name>

# Run affected only (CI — only what changed vs main)
nx affected -t build
nx affected -t test
nx affected -t lint

# Dependency graph
nx graph

# Generate component in a lib
nx g @nx/angular:component my-component --project=shared-ui --standalone

# Show project info
nx show project <name>
```

---

## CI — GitHub Actions (Nx affected)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed for nx affected base comparison

      - uses: nrwl/nx-set-shas@v4 # sets NX_BASE and NX_HEAD

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npx nx affected -t lint --parallel=3
      - run: npx nx affected -t test --parallel=3
      - run: npx nx affected -t build --parallel=3
```

## GitLab CI (Nx affected)

```yaml
stages: [lint, test, build]

variables:
  NX_BASE: $CI_MERGE_REQUEST_TARGET_BRANCH_SHA
  NX_HEAD: $CI_COMMIT_SHA

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths: [node_modules/, .nx/cache/]

.base:
  image: node:20
  before_script:
    - npm ci

lint:
  extends: .base
  stage: lint
  script: npx nx affected -t lint --parallel=3

test:
  extends: .base
  stage: test
  script: npx nx affected -t test --parallel=3

build:
  extends: .base
  stage: build
  script: npx nx affected -t build --parallel=3
```

---

## Nx Cloud (optional — ask user)

If user wants remote caching:

```bash
npx nx connect
```

Adds `nxCloudAccessToken` to `nx.json`. All CI runs share cache — massive speedup for large monorepos. Free tier available.
