# BallAtlas Architecture

> This document describes the high-level architecture of the BallAtlas platform.
> For decisions and their rationale, see `docs/decisions/`.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  Browser (Next.js RSC + Hydration)  │  Mobile [future]          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                         │
│  CDN + Fluid Compute + Middleware (auth gates, redirects)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                     APPLICATIONS                                 │
│                                                                  │
│  apps/web (Next.js 15)          apps/api [Phase 7] (Hono)       │
│  ├── App Router (RSC)           ├── REST API v1                  │
│  ├── Server Actions             ├── API Key auth                 │
│  ├── Route Handlers             ├── Rate limiting                │
│  └── Middleware (auth)          └── OpenAPI spec                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    SHARED PACKAGES                               │
│                                                                  │
│  packages/golf-data    ← Domain logic (framework-free)          │
│  packages/database     ← Supabase client + generated types      │
│  packages/ui           ← Design system (shadcn/ui base)         │
│  packages/validators   ← Zod schemas                            │
│  packages/types        ← Pure TypeScript types                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
│                                                                  │
│  PostgreSQL              Auth            Storage                  │
│  ├── brands              ├── Email/PWD   ├── ball-images          │
│  ├── ball_families       ├── OAuth       ├── brand-assets (pub)   │
│  ├── ball_versions       └── RLS         ├── identification-uploads│
│  ├── brand_assets                        └── admin-assets         │
│  ├── technical_specs                                              │
│  ├── visual_signatures                                            │
│  ├── identification_features                                      │
│  ├── images                                                       │
│  ├── segments / version_segments                                  │
│  ├── sources / price_observations                                 │
│  ├── feedback_submissions                                         │
│  └── [pgvector Phase 9]                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Boundaries

### Dependency Rules

```
apps/web    → packages/golf-data ✅
apps/web    → packages/database  ✅
apps/web    → packages/ui        ✅
apps/web    → packages/validators ✅
apps/web    → packages/types     ✅

apps/api    → packages/golf-data ✅
apps/api    → packages/database  ✅
apps/api    → packages/validators ✅
apps/api    → packages/types     ✅
apps/api    → packages/ui        ❌ (API has no UI)

packages/golf-data → packages/types      ✅
packages/golf-data → packages/validators ✅
packages/golf-data → packages/database   ❌ (domain must not know about DB client)
packages/golf-data → packages/ui         ❌ (domain has no UI concerns)
packages/golf-data → apps/*              ❌ (never depend upward)

packages/database → packages/types      ✅
packages/database → packages/validators ✅
packages/database → packages/ui         ❌
packages/database → packages/golf-data  ❌

packages/ui       → packages/types      ✅
packages/ui       → packages/validators ✅
packages/ui       → packages/golf-data  ❌ (UI is generic, not domain-aware)
```

### Why domain isolation matters

`packages/golf-data` must be consumable by:

- `apps/web` today
- `apps/api` in Phase 6
- A future mobile app
- Server-side scripts and importers

If it depended on React, Next.js, or Supabase client, none of those consumers could
use it cleanly. Keep it pure: TypeScript + Zod + `packages/types` only.

---

## Data Ownership

| Data Domain             | Owner Package              | Persisted In                       |
| ----------------------- | -------------------------- | ---------------------------------- |
| Brands                  | `packages/golf-data`       | Supabase `brands`                  |
| Ball families           | `packages/golf-data`       | Supabase `ball_families`           |
| Ball versions           | `packages/golf-data`       | Supabase `ball_versions`           |
| Technical specs         | `packages/golf-data`       | Supabase `technical_specs`         |
| Visual signatures       | `packages/golf-data`       | Supabase `visual_signatures`       |
| Identification features | `packages/golf-data`       | Supabase `identification_features` |
| Market segments         | `packages/golf-data`       | Supabase `segments`                |
| Price observations      | `packages/golf-data`       | Supabase `price_observations`      |
| Brand assets            | `apps/web` upload handlers | Supabase Storage `brand-assets`    |
| Ball images             | `apps/web` upload handlers | Supabase Storage `ball-images`     |
| User accounts           | Supabase Auth              | Supabase `auth.users`              |
| API keys                | `apps/api` [Phase 6]       | Supabase `api_keys`                |
| Feedback submissions    | `apps/web` Server Actions  | Supabase `feedback_submissions`    |
| Vector embeddings       | [Phase 8]                  | Supabase pgvector                  |
| Seed / import data      | `packages/golfball-data`   | JSON files in `raw/`               |

---

## Supabase Architecture

### Row Level Security

Every table has RLS enabled. Policy patterns:

```sql
-- Public read for published records
CREATE POLICY "Public can read published versions"
  ON ball_versions FOR SELECT
  USING (status = 'published');

-- Public read for brands and families (always visible)
CREATE POLICY "Public can read brands"
  ON brands FOR SELECT USING (true);

-- Authenticated write for admins (service role bypasses RLS entirely)
CREATE POLICY "Admins can write"
  ON ball_versions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

See `docs/database/rls.md` for the full policy matrix.

Never use `SUPABASE_SERVICE_ROLE_KEY` on the client side. Service role bypasses RLS
and is server-only (Next.js Server Components, Server Actions, Route Handlers).

### Type Generation Pipeline

```bash
# Run after any migration (requires local Supabase running)
supabase gen types typescript --local > packages/database/src/types.generated.ts
```

The generated file is **tracked in git** so CI does not require Supabase CLI or Docker.
Regenerate manually after any migration, commit the updated file with the migration.

### Storage Buckets (Phase 2+)

| Bucket           | Access      | Purpose                                 |
| ---------------- | ----------- | --------------------------------------- |
| `brand-assets`   | Public read | Approved brand logos, marks, references |
| `ball-images`    | Public read | Official golf ball product images       |
| `identification` | Private     | User-uploaded images for identification |
| `admin-assets`   | Private     | Internal admin uploads                  |

---

## Next.js Application Architecture

### Route Structure (apps/web)

```
app/
├── page.tsx                    ← / Home (hero search, registry stats)
├── search/
│   └── page.tsx                ← /search (FTS + alias search, URL-state filters)
├── balls/
│   └── [slug]/
│       ├── page.tsx            ← /balls/[slug] (ball detail — specs, valuation, similar)
│       ├── actions.ts          ← submitFeedback Server Action
│       ├── loading.tsx         ← Skeleton
│       └── not-found.tsx       ← 404
├── brands/
│   ├── page.tsx                ← /brands (brand listing with counts)
│   └── [slug]/
│       ├── page.tsx            ← /brands/[slug] (brand detail, family explorer)
│       └── loading.tsx         ← Skeleton
├── compare/
│   └── page.tsx                ← /compare?balls=slug1,slug2 (URL-state, max 4)
├── (admin)/
│   └── admin/
│       ├── layout.tsx          ← Admin nav layout
│       ├── brand-assets/       ← /admin/brand-assets (SVG/PNG upload, review)
│       └── ...                 ← Admin CRUD pages (including /admin/feedback)
├── api/                        ← Internal route handlers
│   ├── balls/route.ts          ← GET /api/balls (list + filter)
│   ├── balls/[id]/route.ts     ← GET /api/balls/:id
│   ├── brands/route.ts         ← GET /api/brands
│   ├── families/route.ts       ← GET /api/families
│   ├── search/route.ts         ← GET /api/search (alias-aware FTS)
│   └── autocomplete/route.ts   ← GET /api/autocomplete (suggestions, pg_trgm)
├── sitemap.ts                  ← Dynamic sitemap (brands + versions)
├── robots.ts                   ← Robots policy (disallows /admin)
├── globals.css
└── layout.tsx                  ← Root layout (fonts, dark mode, html/body)
```

Public pages use `RegistryLayout` (wraps `SiteHeader` + `<main>`). Admin pages
use their own layout. Root `layout.tsx` only sets up fonts and the dark class.

### Server vs Client Components

```
Server Components (default):
  ├── page.tsx files
  ├── layout.tsx files
  ├── Data fetching components
  └── Static display components

Client Components ('use client'):
  ├── Search input (keyboard interaction)
  ├── Filter controls (state)
  ├── Modals and sheets
  ├── Animated components
  └── Any component using React hooks
```

### Data Fetching Pattern

```ts
// In Server Components — direct Supabase access
import { createClient } from '@/lib/supabase/server'

export default async function BallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('golf_balls').select('*').eq('slug', slug).single()
  // ...
}
```

---

## Intelligence Architecture (Phase 5)

### packages/golf-data/src/intelligence/

All deterministic scoring and template logic. Framework-free — no React, no Supabase client.

```
packages/golf-data/src/intelligence/
├── config.ts        ← SimilarityWeights, DEFAULT_SIMILARITY_WEIGHTS, thresholds
├── similarity.ts    ← computeSimilarityScore(), rankBySimilarity(), BallProfile
├── completeness.ts  ← computeCompleteness(), CompletenessResult
├── comparison.ts    ← computeFieldDiff(), buildDifferenceSummary(), HighlightTag
├── summaries.ts     ← buildBallSummary(), SEGMENT_DESCRIPTIONS, getSegmentDescription()
└── index.ts         ← barrel export
```

**Key rule:** Similarity weights are a product/business decision, not an algorithm detail.
They live in `config.ts` and are passed to `computeSimilarityScore()` as an optional parameter.
Tune weights without touching the algorithm.

---

## Identification Architecture (Phase 7)

### packages/golf-data/src/identification/

Deterministic evidence-based identification engine. Framework-free — pure TypeScript.

```
packages/golf-data/src/identification/
├── config.ts    ← IdentificationWeights, DEFAULT_IDENTIFICATION_WEIGHTS, thresholds
├── engine.ts    ← identifyBall(), ObservedFeatures, IdentificationResult
├── coverage.ts  ← computeIdentificationCoverage(), IdentificationCoverageSummary
├── contracts.ts ← FeatureExtractionInput, FeatureExtractionResult (AI readiness)
└── index.ts     ← barrel export
```

**Separation of concerns:** BallAtlas owns identification logic. Future AI systems own feature extraction only.

```
Image (Phase 9)
    ↓
FeatureExtractionResult (AI output — same shape as ObservedFeatures)
    ↓
identifyBall(observedFeatures, candidates)   ← BallAtlas engine
    ↓
IdentificationResult[] (ranked, scored, explained)
```

**Identification feature types (Phase 7 additions):** `play_number`, `number_style`, `visual_pattern`

### Route: POST /api/identify

Loads all published candidates from Supabase, calls `identifyBall()`, returns ranked results.

### Page: /identify

Feature-driven identification UI. User inputs brand, logo text, alignment, number color, etc.
No image upload. No AI. Returns ranked candidates with confidence and evidence explanation.

---

## Future AI Architecture (Phase 9)

### Vector Search Pipeline

```
User query (text)
    ↓
Embedding model (OpenAI text-embedding-3-small via Vercel AI SDK)
    ↓
pgvector similarity search in Supabase
    ↓
Ranked results with metadata
    ↓
Optional: LLM reranking + explanation
```

### AI Package Structure

```
packages/ai/ [Phase 9]
├── src/
│   ├── embeddings.ts     ← Generate and store embeddings
│   ├── search.ts         ← Semantic search interface
│   ├── identification.ts ← Image feature extraction (produces FeatureExtractionResult)
│   └── chat.ts           ← Conversational AI interface
```

### pgvector Setup (Phase 9)

```sql
-- Enable extension (run in Supabase SQL editor for production)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add to golf_balls table
ALTER TABLE golf_balls ADD COLUMN embedding vector(1536);

-- Create index
CREATE INDEX ON golf_balls USING ivfflat (embedding vector_cosine_ops);
```

---

## Future API Architecture (Phase 8)

### API Design Principles

- REST over GraphQL for predictable caching
- Versioned from day one: `/v1/`
- API keys scoped by capability (read, write, admin)
- Rate limiting: 100 req/min free, 1000 req/min paid
- OpenAPI 3.1 spec generated from route types
- TypeScript SDK published as `@ballatlas/sdk`

### API Package Boundary

`apps/api` consumes `packages/golf-data` and `packages/database`.
It does NOT share routes, middleware, or handlers with `apps/web`.
Both apps share domain logic through packages only — including `packages/golf-data/src/intelligence/`.

---

## Security Architecture

### Threat Model

| Threat                     | Mitigation                                        |
| -------------------------- | ------------------------------------------------- |
| Unauthorized DB writes     | Supabase RLS on every table                       |
| Service role key exposure  | Server-only, validated via @t3-oss/env-nextjs     |
| SQL injection              | Supabase query builder (parameterized)            |
| XSS                        | React DOM escaping + Content Security Policy      |
| Dependency vulnerabilities | Trivy scan in CI + weekly schedule                |
| Credential leaks           | .gitignore + pre-commit hook checking for secrets |

### Content Security Policy (Phase 2)

Will be configured in `apps/web/middleware.ts` as response headers.
Supabase CDN domain must be allowlisted for images.

---

## Deployment Architecture

### Vercel Project Structure

Two separate Vercel projects (when `apps/api` exists in Phase 6):

| Vercel Project  | Root Directory | Domain              |
| --------------- | -------------- | ------------------- |
| `ballatlas-web` | `apps/web`     | `ballatlas.com`     |
| `ballatlas-api` | `apps/api`     | `api.ballatlas.com` |

### Turborepo Remote Cache

Configured via `TURBO_TOKEN` and `TURBO_TEAM` in Vercel environment variables.
CI and local builds share cache artifacts — significantly reduces build times.

### Environment Tiers

| Tier       | Supabase                    | Vercel                 | Branch     |
| ---------- | --------------------------- | ---------------------- | ---------- |
| Local      | `supabase start` (Docker)   | `vercel dev`           | any        |
| Preview    | Staging Supabase project    | Auto-deploy PR         | feature/\* |
| Production | Production Supabase project | `vercel deploy --prod` | main       |

---

---

## Import Pipeline Architecture

The seed dataset and bulk import tooling live in `packages/golfball-data`:

```
packages/golfball-data/
├── raw/              ← Curated JSON source files (brands, families, versions)
├── processed/        ← Normalized output (generated, gitignored)
├── imports/          ← Reusable import utilities
├── exports/          ← Export utilities (future)
├── schemas/          ← JSON Schema for non-TS consumers
└── scripts/          ← CLI entry points (import.ts, validate.ts)
```

Run the import pipeline:

```bash
pnpm import:balls    # Validate + import all raw data to local Supabase
pnpm validate:balls  # Validate only, no DB writes
```

See `docs/imports/pipeline.md` for full pipeline documentation.

---

_Last updated: 2026-06-10 — Phase 6: brand_assets table, brand-assets storage bucket, /admin/brand-assets route_
