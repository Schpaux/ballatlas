# Phase 3 — Registry Experience Status

**Started:** 2026-06-07  
**Target Completion:** TBD  
**Status:** 🟡 In Progress

---

## Pre-Implementation Audit

- [x] `docs/audits/phase-3-readiness.md` — types, schema, and dataset verified
- [x] `supabase/config.toml` — fixed malformed `[functions] verify_jwt = true` (CLI 2.98 breaking change)
- [x] `tsx` added to root devDependencies (fixes `pnpm dataset:report`)
- [x] `ARCHITECTURE.md` — corrected types file tracking statement
- [x] `ROADMAP.md` — Phase 3 updated from "Valuation Engine" to "Registry Experience"

**Offline validation result:**

| Step                       | Result                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| `pnpm dataset:report`      | ✅ 21 brands, 75 families, 250 versions, 51 aliases — 100% complete |
| `pnpm type-check`          | ✅ Zero errors                                                      |
| `pnpm lint`                | ✅ Zero errors in Phase 3 files                                     |
| Live database verification | ⏳ Awaiting verification against hosted Supabase environment        |

**Primary workflow: GitHub → Vercel → Hosted Supabase (no local Docker required).**

---

## Deliverables

### Foundation

- [x] `supabase/config.toml` — fixed (phase readiness)
- [x] Root `layout.tsx` — `dark` class added to `<html>`
- [x] `class-variance-authority` installed in `apps/web`
- [x] shadcn/ui components installed: `badge`, `input`, `button`, `skeleton`, `separator`

### Components

- [x] `components/registry/SegmentBadge.tsx` — colored segment labels (6 segments)
- [x] `components/registry/SiteHeader.tsx` — sticky header with BallAtlas logo + Browse/Admin links
- [x] `components/registry/RegistryLayout.tsx` — public page wrapper (SiteHeader + main)
- [x] `components/registry/SearchBar.tsx` — debounced client search input → `/search?q=`
- [x] `components/registry/BallCard.tsx` — search result card (brand, name, segments, specs, price)
- [x] `components/registry/FilterPanel.tsx` — client filter sidebar (brand, segment, year, cover) + mobile toggle
- [x] `components/registry/SpecGrid.tsx` — visual specs display with compression bar + profile bars
- [x] `components/registry/VisualIdentityCard.tsx` — visual identification data display
- [x] `components/registry/ValuationCard.tsx` — valuation with honest empty state
- [x] `components/registry/SimilarBalls.tsx` — async server component, same segment + ±20 compression

### Routes

- [x] `app/page.tsx` — home page (hero search, popular pills, live registry stats)
- [x] `app/search/page.tsx` — search results, alias-aware, URL-state filters, 24/page grid
- [x] `app/balls/[slug]/page.tsx` — ball detail (hero, specs, visual, valuation, similar, brand info)
- [x] `app/balls/[slug]/not-found.tsx` — 404 page
- [x] `app/balls/[slug]/loading.tsx` — skeleton loading state

### API

- [x] `app/api/search/route.ts` — enhanced with alias-aware search (parallel FTS + alias lookup, alias matches float to page 1)

### Quality

- [x] TypeScript — zero errors (`pnpm type-check`)
- [x] ESLint — zero errors in Phase 3 files (`pnpm lint` — pre-existing Phase 2 errors untouched)
- [ ] Smoke-tested against hosted Supabase (awaiting verification)

---

## Known Gaps / Remaining Work

| Gap                      | Priority | Notes                                                                                                   |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| Segment filter query     | Medium   | `segment=` param is parsed but not applied to DB query — needs subquery through `version_segments` join |
| Image gallery            | Low      | `images` table exists; no images in seed data yet                                                       |
| Sitemap                  | Medium   | `/sitemap.xml` route not yet generated                                                                  |
| OpenGraph images         | Low      | No OG image generation yet                                                                              |
| Analytics abstraction    | Low      | `search_performed`, `ball_viewed` events not yet wired                                                  |
| Pre-existing lint errors | Low      | 27 import/order errors in Phase 2 admin/API files — not introduced by Phase 3                           |

---

## Recommended Workflow

```
Developer → GitHub → Vercel Preview → Hosted Supabase → Production
```

No local Docker or local Supabase instance is required.

## Hosted Verification Workflow

Once linked to the hosted Supabase project and Vercel:

```bash
# 1. Link to Supabase project (one-time)
supabase link --project-ref <project-ref>

# 2. Push migrations to hosted Supabase
supabase db push

# 3. Regenerate TypeScript types from hosted schema
supabase gen types typescript --linked > packages/database/src/types.generated.ts

# 4. Pull env vars from Vercel
vercel env pull apps/web/.env.local

# 5. Validate and import seed data
pnpm validate:balls
pnpm import:balls

# 6. Start dev server (connects to hosted Supabase via .env.local)
pnpm dev
```

### Verification Checklist

- [ ] `supabase link` succeeds against hosted project
- [ ] `supabase db push` — all 16 migrations applied
- [ ] `supabase gen types typescript` — types file matches current state
- [ ] `pnpm import:balls` — 21 brands, 75 families, 250 versions, 51 aliases imported
- [ ] Home page loads with live registry stats
- [ ] `/search?q=pro+v1` returns results
- [ ] `/balls/titleist-pro-v1-2025` detail page loads
- [ ] Admin flows functional at `/admin`

### Vercel Preview Deploy

Merging a PR automatically deploys a preview. Smoke-test the preview URL against hosted Supabase before promoting to production.
