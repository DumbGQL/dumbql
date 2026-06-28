---
name: project-creator
description: >
  Use this skill whenever a user asks to create, scaffold, bootstrap, or initialize a new project
  in ANY technology or language (Go, TypeScript, Angular, Rust, Python, Java, Kotlin, Swift, C++,
  PHP, Ruby, etc.). Triggers on phrases like "create a project", "scaffold a new app", "initialize
  a repo", "set up a project", "новый проект", "создай проект", "scaffolding". Always use this
  skill even if the user only mentions a language or framework without explicitly saying "create" —
  e.g. "I want to start a Go service" or "help me set up Angular app". This skill handles linting,
  codestyle, tests, CI/CD, UI library selection, and AI agent usage audit end-to-end.
---

# Project Creator Skill

Scaffolds production-ready projects with proper codestyle, linting, tests, CI/CD, UI library, and AI usage audit for **any** technology.

---

## Phase 1 — Interview

Run through these questions **before writing any code**. Group related questions — don't ask one by one.

### 1.1 Core info
- What is the project name?
- What is the technology / language / framework?
- Brief description of what it does (used for README and package metadata)
- What is the primary task/domain? (HTTP API, CLI tool, frontend app, data pipeline, etc.)
  → This drives library research in Phase 2.

### 1.2 Linting & Codestyle
Ask: *"Do you have existing lint config you want to reuse? If yes, share the file or a link."*
(golangci.yml, .eslintrc, eslint.config.{js,ts,json}, .prettierrc, stylelint.config.*, .rubocop.yml, pyproject.toml, etc.)

- **User provides file/link** → parse it, replicate verbatim. Never silently add or remove rules.
- **User provides nothing** → research (§Phase 2) and present recommendation before applying.

### 1.3 Tests
Ask: *"Do you need tests set up?"*

- **No** → skip
- **Yes** → ask: *"Any preferred testing style or company whose practices you want to follow? (e.g. Google, Netflix, Spotify, Airbnb, or just 'community best practices')"*
  - Research that company's testing approach for the given tech stack
  - Present findings briefly, confirm before scaffolding

### 1.4 CI/CD
Ask: *"Do you need CI/CD configured?"*

- **No** → skip
- **Yes** → ask:
  - Which platform? (GitHub Actions / GitLab CI / Bitbucket / CircleCI / other)
  - What should CI do? (lint, test, build, deploy, docker push, etc.)
  - Any secrets or environment variables needed? (names only, never values)

### 1.5 UI Library (frontend projects only)

**Trigger**: technology is Angular, React, Vue, Svelte, or any frontend framework.

Ask: *"Do you want to use a UI component library?"*

- **No** → skip
- **User names a specific library** → go to §UI Library Research with that library
- **"Don't care" / "up to you"** → run §UI Library Detection first, then present options
- **"Not sure, what do you recommend?"** → present community-popular options for the framework, let user pick

#### UI Library Detection flow ("don't care" case)

1. Ask: *"Can I look at your existing projects to see what you typically use? If yes, share paths or I can search common locations."*
2. **User shares paths** → scan `package.json` files for UI lib dependencies, tally which appears most
3. **User declines** → present the 3-5 most popular community UI libs for their framework (research first), let user pick
4. After selection → go to §UI Library Research

**Popular Angular UI libs to present if no preference** (research to confirm current status before presenting):
- Taiga UI
- Angular Material
- PrimeNG
- Clarity Design
- NG-ZORRO (Ant Design)

**Popular React UI libs**: shadcn/ui, Radix UI, MUI, Ant Design, Chakra UI
**Popular Vue UI libs**: Vuetify, Quasar, PrimeVue, Naive UI

Always research current community standing before presenting — don't assume from training data.

### 1.6 Angular — Component Architecture (Angular projects only)

Ask these two questions together:

1. *"What is the maximum component nesting depth you want to enforce? (e.g. 2 = a feature component may contain leaf components but those cannot contain further components; 3 = one more level allowed)"*
   - Default if no answer: **3**
   - Store this as `MAX_NESTING_DEPTH` — used during scaffold and audit

2. *"Should each component always have separate files for template, styles, and class? (recommended: yes)"*
   - Default: **yes** — always separate `.html`, `.scss`/`.css`, `.ts`

### 1.7 Docker
Ask: *"Do you need Docker setup?"*

- **No** → skip
- **Yes** → read `references/docker.md`, ask:
  - Single container or multi-service? (multi → docker-compose)
  - Dev image, prod image, or both?
  - Database or external services needed in compose?
  - Push to registry? (Docker Hub / GHCR / private)

### 1.8 Git Hooks
Ask: *"Do you want git hooks — run linter on commit, enforce conventional commits?"*

- **No** → skip
- **Yes** → read `references/git-hooks.md`, tool auto-selected by tech (husky for Node/Angular, pre-commit for Go/Python/Rust/Java)
- Ask: *"Run tests before push too? (slower, optional)"*

### 1.9 Nx Monorepo (Node/Angular projects only)
Ask: *"Is this a monorepo or will it grow into one? Want Nx?"*

- **No** → skip
- **Yes** → read `references/nx.md`, ask:
  - What apps will live here?
  - Shared libs needed? (ui, types, data-access, util)
  - Nx Cloud remote caching?

### 1.10 AI Usage Audit
Always ask: *"Does your project use AI agents, LLM calls, or tools like Cursor/Copilot/Claude? If yes, I can scan for bad practices and set up guidelines."*

- **No / new project** → skip scan, ask: *"Want me to add AI usage best practices docs?"*
- **Yes, existing code** → run Phase 2.5 (AI Audit)
- **Yes, add docs** → generate `docs/ai-practices/`

---

## Phase 2 — Research

Run research **only for what the user didn't provide**. Run in parallel where possible.

### 2.1 Linting research
Search: `<technology> best linting rules <year>` and `<technology> recommended lint config production`

Priority sources: official style guides → well-known company engineering blogs (Google, Uber, Airbnb) → widely adopted community configs.

Present chosen ruleset with brief rationale before applying.

### 2.2 Testing research
Search: `<technology> testing best practices <company> <year>`

Look for: runner/framework, file naming conventions, folder structure, coverage thresholds, test style (table-driven / BDD / unit).

### 2.3 CI/CD research
Search: `<platform> <technology> CI pipeline <year>`

Find canonical examples from official docs or popular open-source repos.

### 2.4 Library research (task-specific)

**Triggered by**: user's primary task/domain from §1.1.

For each technology + task combination, research the currently popular and well-maintained libraries.

Examples:
- Go + HTTP API → chi, gin, fiber, echo — research stars, last release, community adoption
- Go + Postgres → pgx, sqlc, gorm — tradeoffs
- Go + gRPC → google.golang.org/grpc + buf
- Python + HTTP API → FastAPI, Django, Flask
- Python + data → pandas, polars, dask
- Node + HTTP → Fastify, Hapi, Express
- Rust + HTTP → axum, actix-web, warp

Present top 2-3 options with one-line tradeoff summary, let user pick. Then research best practices specifically for the chosen library.

### 2.5 UI Library Research

**Triggered by**: §1.5 selection.

Search: `<framework> <ui-library> best practices <year>` and `<ui-library> getting started guide`

Research and document:
- Installation and setup steps for the chosen framework version
- Theming / design token system (how to customize)
- Tree-shaking / bundle size considerations
- Recommended import patterns (named imports, auto-import, etc.)
- Component patterns specific to this library (form integration, table/grid, modals)
- Known gotchas or version-specific issues with the user's framework version
- TypeScript integration quality

Save findings to `docs/ui-library-practices.md` in the project.

---

## Phase 2.5 — AI Audit (if existing code provided)

Scan for AI tooling: `.cursor/`, `.claude/`, `AGENTS.md`, `.github/copilot-instructions.md`, `openai`/`anthropic`/`langchain` deps, direct API call patterns.

Read `references/ai-bad-practices.md` for full checklist. Report findings by severity: `critical / warning / info` with file:line.

Ask: *"Want me to save best practices guidelines to `docs/ai-practices/`?"*

---

## Phase 3 — Scaffold

After user confirms all choices, create the project.

### 3.1 Universal structure

```
<project-name>/
├── README.md
├── <dependency-file>
├── <lint-config>
├── <formatter-config>
├── .editorconfig
├── .gitignore
├── src/ or cmd/ or lib/
├── tests/
└── docs/
    ├── ui-library-practices.md   # if UI lib selected
    └── ai-practices/             # if AI docs requested
        ├── bad-practices.md
        └── best-practices.md
```

### 3.2 Tech-specific conventions

Read the relevant reference file before scaffolding:

| Technology | Reference file |
|---|---|
| Go | `references/go.md` |
| TypeScript / Angular / Node | `references/typescript.md` |
| Rust | `references/rust.md` |
| Python | `references/python.md` |
| Java / Kotlin | `references/java-kotlin.md` |
| Docker (any tech) | `references/docker.md` |
| Git Hooks (any tech) | `references/git-hooks.md` |
| Nx Monorepo | `references/nx.md` |
| Other | Research first, then scaffold |

### 3.3 Angular — Component architecture rules

Apply rules derived from interview answers:

**File separation** (if user chose yes, default):
- Every component = 3 files: `name.component.ts`, `name.component.html`, `name.component.scss`
- Never inline `template:` or `styles:` in the decorator — only `templateUrl:` and `styleUrl:`

**Nesting depth** (enforce `MAX_NESTING_DEPTH`):
- Depth 1 = page/route component (smart, fetches data via services)
- Depth 2 = feature/section component (dumb, receives inputs)
- Depth 3 = leaf/atom component (purely presentational, no business logic)
- Components at max depth MUST NOT import or render other components
- If a component needs sub-components beyond the depth limit → extract to a shared atomic component at depth 2 instead

Example for `MAX_NESTING_DEPTH = 3`:
```
UserPageComponent (depth 1 — smart, route)
  └── UserProfileComponent (depth 2 — feature section)
        └── AvatarComponent (depth 3 — leaf, max depth, no children)
```

When scaffolding, generate the folder structure to reflect this:
```
features/
  user/
    user-page/            # depth 1
      user-page.component.ts
      user-page.component.html
      user-page.component.scss
    user-profile/         # depth 2
      user-profile.component.ts
      user-profile.component.html
      user-profile.component.scss
shared/
  ui/
    avatar/               # depth 3, lives in shared/ui — reusable leaf
      avatar.component.ts
      avatar.component.html
      avatar.component.scss
```

**Component responsibilities by depth:**
- Depth 1 (smart): inject services, manage route params, own signals for page state
- Depth 2 (feature): receive `input()`, emit `output()`, no direct service injection except for self-contained features
- Depth 3 (leaf/atom): only `input()` and `output()`, zero business logic, zero service injection

### 3.4 UI Library setup (if selected)

Install the library per research findings. Generate:
- Theme/token configuration file
- A sample usage component showing the correct import pattern
- `docs/ui-library-practices.md` with researched best practices

### 3.5 Lint config
- User provided → copy verbatim
- Researched → write with comments on non-obvious rules

### 3.6 Test scaffold (if requested)
- One real example test per tech conventions — must pass green on first run
- `make test` / `npm test` / etc. in README

### 3.7 CI/CD (if requested)
- lint → test → build order
- Dependency caching
- Secrets by name only

---

## Phase 4 — Finalize & Context Cleanup

### 4.1 README
- Project description, quick start, lint command, test command
- Link to `docs/ui-library-practices.md` if generated
- Link to `docs/ai-practices/` if generated
- CI badge if applicable

### 4.2 Sanity check
- Dependency file correct?
- Lint config rules exist for this tech version?
- CI tool versions current?
- No hardcoded secrets in generated files?
- Angular: nesting depth respected in generated components?

### 4.3 Present files
Present all generated files via `present_files`.
Tell user: *"Run `<lint>` to verify linting, `<test>` to verify tests."*

### 4.4 Context Cleanup ⚠️
Drop from working memory: intermediate research, lint rule details, UI lib raw docs, AI audit scan results, code snippets from user's existing projects, any API keys found.

Retain only: project name, technology, final file list.

Tell user: *"Context cleaned — intermediate research and audit data dropped."*

---

## Rules

- **Never** assume a linting rule without user confirmation or research backing
- **Never** add tools the user didn't ask for silently
- **Never** store or repeat back API keys or secrets — report location only
- **Never** inline templates or styles in Angular components — always separate files
- **Always** enforce `MAX_NESTING_DEPTH` in Angular scaffold and flag violations in audit
- **Always** include `.editorconfig` and `.gitignore`
- **Always** confirm researched configs before writing files
- **Always** run context cleanup after finalizing (§4.4)
- **Always** research UI library best practices for the specific version before scaffolding
- If technology is unknown → research before doing anything
- Keep CI pipelines minimal — only what user asked for
- AI audit is non-blocking — report, don't auto-fix
