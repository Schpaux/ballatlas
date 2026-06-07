# ADR-009: Hosted Supabase as Primary Development Environment

**Status:** Accepted
**Date:** 2026-06-07
**Supersedes:** Relevant operational assumptions in ADR-002 regarding local Docker development

---

## Context

ADR-002 chose Supabase as the backend platform and documented local `supabase start`
(Docker-based) as the development environment. In practice, BallAtlas development has
operated against a hosted Supabase project from day one:

- Local Docker was never mandatory in any workflow
- CI does not require Supabase CLI or Docker
- `types.generated.ts` is committed to git and manually regenerated — CI does not call
  `supabase gen types`
- Vercel preview deployments connect to the hosted project, not a local instance
- The import pipeline (`pnpm import:balls`) targets the hosted project via env vars

This ADR formalizes the hosted-first strategy that has been in operation since Phase 2.

---

## Decision

**Hosted Supabase is the primary BallAtlas development environment.** Local Docker-based
Supabase is optional and unsupported for standard workflows.

### Primary workflow

```
Developer → git push → GitHub Actions CI → Vercel Preview → Hosted Supabase
```

For local development, developers pull environment variables from Vercel and run the
Next.js dev server against the hosted Supabase project:

```bash
vercel env pull apps/web/.env.local   # pull hosted Supabase URLs + keys
pnpm dev                               # Next.js dev server → hosted Supabase
```

### Migration workflow

```bash
supabase link --project-ref <ref>     # one-time: link CLI to hosted project
supabase migration new <name>         # create new migration file
supabase db push                      # apply pending migrations to hosted project
pnpm supabase:types                   # regenerate types after any schema change
```

Migrations are SQL files in `supabase/migrations/`. They are applied in filename
order (timestamp prefix). Migration files are source-controlled.

### Generated types strategy

`packages/database/src/types.generated.ts` is **committed to git**. It is regenerated
via `pnpm supabase:types` after any schema change and committed with the migration.

CI does not require `supabase` CLI, Docker, or a running Supabase instance. TypeScript
type checking (`pnpm type-check`) uses the committed types file.

If the Supabase CLI is unavailable (no `supabase link`), the types file can be manually
updated to match the migration SQL — the file header documents this process.

### CI/CD implications

- GitHub Actions CI: lint, type-check, security scan — no database connection required
- Vercel preview deploys: connect to hosted Supabase via environment variables
- Production deploys: same hosted Supabase project; migrations applied before deploy
- No Docker required in CI or on developer machines

### Developer onboarding

New developers need:

1. Node.js ≥ 20, pnpm ≥ 9
2. Vercel CLI (`npm i -g vercel`) + `vercel link` + `vercel env pull`
3. Supabase CLI (optional, for migrations only) — `brew install supabase/tap/supabase`

Access to the hosted Supabase project dashboard is granted per team member by the
project owner.

### When local Supabase becomes beneficial

- Large schema migrations requiring destructive testing before production
- Feature branches that require isolated database state (branching — Supabase pro feature)
- Offline development in environments without reliable internet
- Integration testing in CI that requires a real database (future consideration)

Until any of these scenarios arises, hosted-first remains the correct tradeoff: zero
local infrastructure, shared seed data, consistent environment across the team.

---

## Consequences

### Positive

- Zero local infrastructure required — no Docker, no port conflicts, no `supabase start`
- All developers see the same seed data and schema state
- Vercel previews work immediately — no environment setup per branch
- `pnpm supabase:types` after a migration regenerates types instantly against the live schema
- Consistent with how small teams actually operate Supabase in practice

### Negative

- Migrations applied to the hosted project affect all developers simultaneously — coordinate
  breaking schema changes
- Requires internet connectivity for local development (no offline mode)
- Service role key in `.env.local` is powerful — developers must treat it carefully
- Type drift risk if a migration is pushed without regenerating `types.generated.ts`
  (mitigated by the commit convention: always commit types with migrations)

---

## References

- ADR-002: Backend Strategy — Supabase
- `packages/database/src/types.generated.ts` — generated types, committed to git
- `supabase/migrations/` — all schema migrations
- `docs/status/phase-3.md` — hosted verification workflow
