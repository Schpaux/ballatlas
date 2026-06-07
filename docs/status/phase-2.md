# Phase 2 — Data Platform Status

**Started:** 2026-06-07  
**Target Completion:** TBD  
**Status:** 🟡 In Progress

---

## Deliverables

### Database Schema

- [x] Enums and shared trigger function (`20260607000001`)
- [x] `brands` table with FTS index (`20260607000002`)
- [x] `ball_families` table with FTS index (`20260607000003`)
- [x] `ball_versions` table with FTS index (`20260607000004`)
- [x] `technical_specs` table (`20260607000005`)
- [x] `segments` table + seed data (`20260607000006`)
- [x] `version_segments` junction table (`20260607000007`)
- [x] `visual_signatures` table (`20260607000008`)
- [x] `identification_features` table (`20260607000009`)
- [x] `images` table (`20260607000010`)
- [x] `sources` table + seed data (`20260607000011`)
- [x] `price_observations` table (`20260607000012`)
- [x] RLS policies — all tables (`20260607000013`)
- [x] Storage buckets: ball-images, identification, admin-assets (`20260607000014`)
- [x] `ball_aliases` table with `alias_type_enum` (`20260607000015`)
- [x] `valuation_profiles`, `condition_multipliers`, `valuation_rules` tables (`20260607000016`)
- [ ] Migrations applied to hosted Supabase project (`supabase db push`)
- [ ] TypeScript types regenerated from live schema (`supabase gen types typescript --linked`)

### Packages

- [x] `packages/golf-data`: Domain entities (brand, family, version, specs, visual, pricing)
- [x] `packages/golf-data`: Taxonomy (segments)
- [x] `packages/golf-data`: Identification module (Phase 5 placeholder)
- [x] `packages/golf-data`: Valuation module (Phase 3 placeholder)
- [x] `packages/validators`: Ball schemas (brand, family, version)
- [x] `packages/validators`: Specs schemas
- [x] `packages/validators`: Visual + identification feature schemas
- [x] `packages/validators`: Pricing schemas
- [x] `packages/validators`: Import schemas (raw JSON formats, incl. `RawAliasSchema`)
- [x] `packages/validators`: Alias schemas (`AliasTypeSchema`, `BallAliasSchema`, `CreateBallAliasSchema`)
- [x] `packages/validators`: Valuation schemas (`ValuationProfileSchema`, `ConditionMultiplierSchema`, `ValuationRuleSchema`)
- [x] `packages/golfball-data`: Package scaffolded (tooling, not deployed)
- [x] `packages/golfball-data`: Seed data — brands (~20 brands)
- [x] `packages/golfball-data`: Seed data — families (75 families)
- [x] `packages/golfball-data`: Seed data — versions (250 versions, 20+ brands)
- [x] `packages/golfball-data`: Seed data — aliases (51 aliases, key ball lines)
- [x] `pnpm dataset:report` — offline stats + quality check script

### Import Pipeline

- [x] `scripts/validate.ts` — validates raw JSON with cross-reference checks
- [x] `scripts/import.ts` — 5-stage idempotent import pipeline
- [x] `imports/normalizer.ts` — slug normalization and row builders
- [x] `imports/client.ts` — service role Supabase client
- [x] `pnpm validate:balls` and `pnpm import:balls` root scripts
- [ ] Import run against hosted Supabase (`pnpm import:balls`)

### Internal API

- [x] `GET /api/brands` — list + search
- [x] `GET /api/families` — list + filter by brand
- [x] `GET /api/balls` — list with all filters (brand, family, year, compression, cover)
- [x] `GET /api/balls/[id]` — full version detail (accepts UUID or slug)
- [x] `GET /api/search` — cross-entity text search
- [ ] API integration tested

### Admin UI

- [x] Admin layout with nav
- [x] `/admin` — dashboard with entity counts
- [x] `/admin/brands` — brands list
- [x] `/admin/brands/new` — create brand form (Server Action)
- [x] `/admin/families` — families list
- [x] `/admin/versions` — versions list with pagination
- [x] `/admin/versions/new` — create version form (Server Action)
- [x] `/admin/brands/[id]/edit` — edit brand form
- [x] `/admin/families/[id]/edit` — edit family form
- [x] `/admin/versions/[id]/edit` — edit version form
- [x] `/admin/aliases` — alias management (create, delete, search, paginate)
- [x] `/admin/valuation` — valuation profile + multiplier + rule management
- [ ] Price observation entry form
- [ ] Image upload interface

### Documentation

- [x] ADR-004: Database schema hierarchy
- [x] ADR-005: Full-text search strategy
- [x] ADR-006: Import pipeline design
- [x] ADR-007: Alias system design
- [x] ADR-008: Valuation foundation design
- [x] `docs/database/schema.md` — full schema reference
- [x] `docs/database/rls.md` — RLS policy matrix
- [x] `docs/imports/pipeline.md` — import pipeline guide
- [x] `docs/api/internal.md` — internal API reference
- [x] `ARCHITECTURE.md` — updated to Phase 2 schema
- [x] `ROADMAP.md` — Phase 2 deliverables updated
- [x] `CLAUDE.md` — Phase 2 section added

---

## To Run Against Hosted Supabase

```bash
# 1. Link to Supabase project (one-time)
supabase link --project-ref <project-ref>

# 2. Push migrations to hosted Supabase
supabase db push

# 3. Regenerate TypeScript types
supabase gen types typescript --linked > packages/database/src/types.generated.ts

# 4. Pull env vars (requires Vercel project linked)
vercel env pull apps/web/.env.local

# 5. Validate and import seed data
pnpm validate:balls
pnpm import:balls

# 6. Start dev server
pnpm dev

# 7. Visit admin
# http://localhost:3000/admin
```

---

## Blockers

- Vercel project must be linked (`vercel link`) before env pull
- Seed data currently ~75 versions; target is 250–300
