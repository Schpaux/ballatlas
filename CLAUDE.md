# BallAtlas — Project Memory

This file is the authoritative source of project context for Claude Code.
Read at the start of every session. Keep it current.

---

## Project Overview

**BallAtlas** is the most comprehensive golf ball registry, identification platform,
valuation platform, and golf ball intelligence database.

**Current Phase:** Phase 1 — Foundation  
**Status:** Active development  
**Started:** 2026-06-07

### Mission

Build the canonical reference for every golf ball ever made: technical specifications,
valuation history, identification framework, and AI-assisted recognition.

### Planned Platform Capabilities

- Golf ball search and registry
- Technical specifications database
- Market valuation tracking
- Image-based identification
- AI-assisted recognition
- Public API
- Admin tooling and data import pipelines

---

## Architecture Overview

### Monorepo Structure

```
apps/
  web/              ← Next.js 15 App Router (primary product)
  api/              ← [Phase 6] Hono public API (placeholder only)
packages/
  golf-data/        ← Domain models, entities, business rules (NO framework deps)
  database/         ← Supabase client, generated types, env validation
  ui/               ← BallAtlas design system (shadcn/ui base + custom)
  validators/       ← Zod schemas shared server/client
  types/            ← Pure TypeScript types (zero runtime deps)
  config/
    typescript/     ← Shared tsconfig bases
    eslint/         ← Shared ESLint flat configs
    tailwind/       ← Shared Tailwind design tokens
    prettier/       ← Shared Prettier config
docs/
  architecture/     ← Architecture documentation
  decisions/        ← Architecture Decision Records (ADRs)
  research/         ← Research findings that inform architecture
  roadmap/          ← Phase planning
  status/           ← Current phase progress
supabase/
  migrations/       ← SQL migrations (Supabase CLI managed)
  seed.sql          ← Development seed data
  config.toml       ← Local Supabase configuration
```

### Tooling

| Tool               | Purpose                                      |
| ------------------ | -------------------------------------------- |
| Turborepo          | Monorepo task orchestration + remote caching |
| pnpm               | Package manager (strict workspace deps)      |
| Next.js 15         | Web app framework (App Router)               |
| TypeScript 5       | Strict mode everywhere                       |
| Tailwind CSS v3    | Styling (shadcn/ui compatibility)            |
| shadcn/ui          | Component base                               |
| Supabase           | Auth + PostgreSQL + Storage                  |
| @supabase/ssr      | Server-side Supabase for Next.js 15          |
| @t3-oss/env-nextjs | Type-safe environment variable validation    |
| Zod                | Runtime validation at all boundaries         |
| Vercel             | Hosting + Turborepo remote cache             |

### Key Architectural Principles

1. **Domain isolation**: Golf ball business logic lives exclusively in `packages/golf-data`.
   Nothing in that package may import from `apps/` or any web/UI packages.

2. **Server Components by default**: `page.tsx` and `layout.tsx` are always Server Components.
   Add `'use client'` only when interactivity requires it. Access DB and secrets directly
   in Server Components and Server Actions.

3. **Type safety end-to-end**: Supabase generates TypeScript types from the live DB schema.
   Never write manual types that duplicate DB structure. Run `pnpm supabase:types` after
   any schema change.

4. **Validated env vars**: All environment variables are validated at build time via
   `@t3-oss/env-nextjs` in `packages/database/src/env.ts`. Missing required vars = build
   failure, never a runtime surprise.

5. **Zod at every boundary**: Validate all user input and external API responses with Zod
   schemas from `packages/validators`. Never trust unvalidated external data.

6. **RLS always on**: Every Supabase table must have Row Level Security enabled.
   Never bypass RLS except in verified admin server-side contexts using the service role key.

7. **Graceful degradation**: Optional integrations (future: AI, analytics) use optional
   chaining. Missing env vars disable features rather than crashing.

---

## Coding Standards

### TypeScript

- Strict mode everywhere (`"strict": true`, `"noUncheckedIndexedAccess": true`)
- No `any` — use `unknown` and narrow properly
- Prefer `type` over `interface` for data shapes; `interface` for extensible contracts
- Derive types from Zod schemas: `type Foo = z.infer<typeof FooSchema>`
- DB types come from `@ballatlas/database` — never duplicate them manually

### Next.js 15 Async APIs

`cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are all **async** in Next.js 15.
Always await them:

```ts
// ✅ Correct in Next.js 15
const cookieStore = await cookies()
const { slug } = await params
const { q } = await searchParams
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Next.js routes: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Route handlers: `route.ts`
- Test files: `*.test.ts` / `*.test.tsx`
- ADRs: `ADR-NNN-slug.md`

### Import Order (ESLint enforced)

1. Node built-ins
2. External packages
3. Internal monorepo packages (`@ballatlas/*`)
4. Relative imports (`@/*` path alias within `apps/web`)

### Error Handling

- API routes return typed `{ data: T | null; error: string | null }` responses
- Never let errors silently swallow — log with structured context
- User-facing errors are actionable messages, never raw stack traces
- Server Actions surface errors through `useActionState`

### Comments

Write comments only when the **why** is non-obvious: hidden constraints, subtle invariants,
workarounds for specific bugs. Never explain what the code does — good names do that.

---

## UI Standards

### Design Philosophy

BallAtlas should feel like **Linear meets Stripe** — precise, premium, data-dense,
and deeply considered. Every interaction should feel intentional.

**References:** Linear, Raycast, Stripe, Vercel dashboard  
**Anti-patterns:** Bootstrap grid clutter, corporate dashboard aesthetics, excessive gradients

### Typography

- Display/Headings: Geist Sans (via `geist` npm package + `next/font`)
- Body: Geist Sans
- Monospace/Data: Geist Mono

### Design Tokens

All tokens are in `packages/config/tailwind/index.ts`.
Never hardcode colors, spacing, or border radii outside the token system.

### Motion (Emil Kowalski Principles)

- Motion serves information, not decoration
- Interactions feel physically grounded — spring physics over linear easing
- Micro-interactions acknowledge user intent immediately (< 100ms feedback)
- Nothing animates just because it can

### Component Patterns

- shadcn/ui as the base — extend, never fork. Add via `npx shadcn@latest add [component] -c apps/web`
- Composition over configuration
- Accessible by default — WCAG 2.1 AA minimum
- Mobile-first: design for 375px, enhance upward

### Spacing

4px base grid (Tailwind default). Prefer: 4, 8, 12, 16, 24, 32, 48, 64px increments.

---

## Documentation Requirements

### Every PR must include

- Updated `docs/status/phase-N.md` if a phase milestone is touched
- New or updated ADR if an architectural decision was made
- Updated `CLAUDE.md` if project context changed (tech, conventions, decisions)

### Architecture Decision Records (ADRs)

Location: `docs/decisions/`  
Format: `ADR-NNN-slug.md`

Each ADR:

- **Status**: Proposed / Accepted / Deprecated / Superseded by ADR-NNN
- **Context**: What problem were we solving?
- **Decision**: What did we decide?
- **Consequences**: What happens as a result — positive and negative?

Never delete ADRs. Supersede them with new ones referencing the original.

### Research Documents

Location: `docs/research/`  
All research findings that inform architecture go here before implementation.
Research integration points are reserved in `packages/golf-data/src/`.

---

## Review Process

### PR Requirements

- All PRs require at least 1 approval
- CI must pass: lint, type-check, security scan
- Commits follow Conventional Commits spec
- PR title follows the same convention

### Definition of Done

A task is **Done** when:

- [ ] TypeScript compiles with zero errors (`pnpm type-check`)
- [ ] ESLint passes with zero errors (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] No Trivy HIGH/CRITICAL vulnerabilities introduced
- [ ] PR reviewed and approved
- [ ] `docs/status/` updated if applicable
- [ ] Deployed to preview environment and smoke-tested

---

## Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `perf` | `ci` | `arch`

**Scopes:** `web` | `api` | `golf-data` | `database` | `ui` | `validators` | `types` | `config` | `supabase` | `docs` | `ci` | `deps`

**Examples:**

```
feat(golf-data): add golf ball entity model
fix(web): resolve hydration error in search component
docs(decisions): add ADR-004 for vector search strategy
arch(database): enable pgvector extension for AI phase
chore(deps): update supabase-js to 2.50.0
```

---

## Decision Logging Process

When making an architectural decision:

1. Create `docs/decisions/ADR-NNN-slug.md`
2. Set status to `Proposed` and open a PR
3. After merge, update status to `Accepted`
4. Update `CLAUDE.md` Architecture section if needed

**Decisions requiring ADRs:** database schema changes, new packages added to monorepo,
technology additions, API design patterns, security model changes, major library swaps.

---

## CLI Workflow Reference

### Prerequisites

```bash
# Required local tools
node --version          # >= 20.0.0
pnpm --version          # >= 9.0.0
docker --version        # Docker Desktop (for Supabase local)

# Install CLIs
npm install -g vercel   # Vercel CLI
brew install supabase/tap/supabase  # Supabase CLI
brew install gh         # GitHub CLI
```

### Initial Project Setup

```bash
git clone <repo>
pnpm install

# Link to Vercel project (one-time)
vercel link --yes

# Start Supabase locally (requires Docker)
supabase start

# Pull environment variables from Vercel
vercel env pull apps/web/.env.local

# Start dev server
pnpm dev
```

### Supabase CLI Workflow

```bash
supabase start                        # Start local Supabase (Docker required)
supabase stop                         # Stop local Supabase
supabase status                       # View local service URLs + keys

supabase migration new <name>         # Create a new migration file
supabase db push --local              # Apply pending migrations locally
supabase db reset                     # Reset local DB and replay all migrations

# After any schema change — regenerate types
pnpm supabase:types                   # → packages/database/src/types.generated.ts

supabase db diff --use-migra          # Diff local vs remote schema
supabase db push                      # Push migrations to linked remote project
```

### Vercel CLI Workflow

```bash
vercel link                           # Link repo to Vercel project
vercel env pull apps/web/.env.local   # Pull env vars for local dev
vercel env ls                         # List all env vars
vercel env add KEY                    # Add new env var (prompts for value + environment)

vercel deploy                         # Deploy to preview
vercel deploy --prod                  # Deploy to production
vercel ls                             # List deployments
vercel logs <url>                     # Stream deployment logs
```

### GitHub CLI Workflow

```bash
gh pr create --title "feat(scope): description" --body "..."
gh pr list
gh pr review <number>
gh pr merge <number> --squash
gh issue create --title "..." --label "bug"
```

---

## Environment Variables

### apps/web/.env.local (required)

```bash
# Supabase — local dev values from `supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-status>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-status>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Strategy

- `NEXT_PUBLIC_*` — safe to expose to the browser
- Non-prefixed — server only, never included in client bundles
- All vars validated at build time via `@t3-oss/env-nextjs` (missing = build failure)
- Production values managed via Vercel dashboard + `vercel env add`
- Local dev: `vercel env pull apps/web/.env.local` (gitignored)
- **Never commit `.env.local` or any file containing real credentials**

---

## Research Integration Points

Future research will slot into these reserved locations:

| Research Output          | Target Location                           |
| ------------------------ | ----------------------------------------- |
| Database schema          | `supabase/migrations/` + regenerate types |
| Golf ball taxonomy       | `packages/golf-data/src/taxonomy/`        |
| Identification framework | `packages/golf-data/src/identification/`  |
| Valuation framework      | `packages/golf-data/src/valuation/`       |
| Seed dataset             | `supabase/seed.sql`                       |

Do not build in these directories until research is complete.

---

## Phase Status

| Phase | Name                  | Status         |
| ----- | --------------------- | -------------- |
| 1     | Foundation            | ✅ Complete    |
| 2     | Data Platform         | 🟡 In Progress |
| 3     | Valuation Engine      | ⬜ Not Started |
| 4     | Admin & Import System | ⬜ Not Started |
| 5     | Image Identification  | ⬜ Not Started |
| 6     | Public API            | ⬜ Not Started |
| 7     | AI Intelligence Layer | ⬜ Not Started |

---

## Phase 2 Key Conventions

### Database Entity Names

Canonical hierarchy: **brands → ball_families → ball_versions**

Old placeholder names (`golf_balls`, `manufacturers`, `specifications`) are superseded
by ADR-004. Do not use them.

### Slug Conventions

| Entity        | Scope         | Example                |
| ------------- | ------------- | ---------------------- |
| brands.slug   | Global unique | `titleist`             |
| families.slug | Unique/brand  | `pro-v1`               |
| versions.slug | Global unique | `titleist-pro-v1-2025` |

### Import Pipeline

```bash
pnpm validate:balls    # validate raw JSON (brands, families, versions, aliases)
pnpm import:balls      # import to local Supabase (idempotent, 5-stage + aliases)
pnpm import:balls --dry-run  # validate only
pnpm dataset:report    # offline stats + quality checks (no DB required)
```

Raw data files: `packages/golfball-data/raw/{brands,families,versions,aliases}.json`

### Alias System

`ball_aliases` table: `(version_id, lower(alias))` unique — case-insensitive per version.  
`alias_type_enum`: `common_name | abbreviation | misspelling | regional_name | generation_tag`  
Seed aliases live in `packages/golfball-data/raw/aliases.json` as `{ version_slug, alias, alias_type }`.

### Valuation Tables

Three-table foundation (ADR-008):

- `valuation_profiles` — one row per market segment
- `condition_multipliers` — physical condition scaling per profile
- `valuation_rules` — age/demand/availability adjustments per profile (one row per profile)

Formula: `base_price × condition_multiplier × age_adj × demand_adj × avail_adj`

Data quality rule: **missing values are acceptable; fabricated values are not.**

### Types Regeneration

Run after any migration:

```bash
supabase db push --local && pnpm supabase:types
```

`packages/database/src/types.generated.ts` is tracked in git and can be manually updated when Supabase is not running. See the file header for instructions.

### Admin

Admin at `/admin` (no auth in Phase 2 — protect before production).
Server Actions use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) via `createAdminClient()`.

Edit forms available for brands, families, versions.
Alias management at `/admin/aliases`.
Valuation management at `/admin/valuation`.

---

_Last updated: 2026-06-07 — Phase 2A: dataset expansion, alias system, valuation foundation, admin edit forms_
