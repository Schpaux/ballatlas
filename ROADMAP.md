# BallAtlas Roadmap

> BallAtlas will become the most comprehensive golf ball registry, identification platform,
> valuation platform, and golf ball intelligence database.

Each phase builds on the previous. Phases are sequential. A phase is complete when all
deliverables are shipped to production and the Definition of Done is met.

---

## Phase 1 — Foundation

**Goal:** Production-grade monorepo infrastructure. No golf ball features yet.

**Deliverables:**

- [x] Turborepo + pnpm monorepo structure
- [x] `apps/web` — Next.js 15 App Router skeleton
- [x] `apps/api` — Placeholder for Phase 6
- [x] `packages/golf-data` — Domain package scaffolded
- [x] `packages/database` — Supabase client + type generation pipeline
- [x] `packages/ui` — shadcn/ui base configured
- [x] `packages/validators` — Zod schema foundation
- [x] `packages/types` — Shared TypeScript types
- [x] `packages/config` — Shared TypeScript, ESLint, Tailwind, Prettier configs
- [x] TypeScript strict mode across all packages
- [x] ESLint + Prettier + Husky + lint-staged
- [x] Commitlint (Conventional Commits)
- [x] GitHub Actions CI pipeline
- [x] Trivy security scanning
- [x] Supabase local development environment
- [x] Vercel deployment configuration
- [x] `docs/` structure with ADR framework
- [x] `CLAUDE.md`, `ROADMAP.md`, `ARCHITECTURE.md`
- [ ] Vercel project linked + env vars populated
- [ ] Supabase project created + migrations pipeline tested
- [ ] Deploy placeholder to Vercel production

---

## Phase 2 — Data Platform

**Goal:** Production-grade data foundation. Schema, import pipeline, internal API,
and admin tooling. The database is the product.

**Deliverables:**

- [x] Database schema: `brands`, `ball_families`, `ball_versions` hierarchy (ADR-004)
- [x] Database schema: `technical_specs`, `visual_signatures`, `identification_features`
- [x] Database schema: `segments`, `version_segments`, `sources`, `price_observations`, `images`
- [x] Supabase RLS policies — all tables
- [x] Storage buckets: `ball-images` (public), `identification`, `admin-assets`
- [x] Full-text search indexes (GIN on tsvector) — ADR-005
- [x] `packages/golf-data`: domain entities, taxonomy, identification + valuation placeholders
- [x] `packages/validators`: ball, specs, visual, pricing, and import Zod schemas
- [x] `packages/golfball-data`: import pipeline + curated seed data (~75 versions)
- [x] `pnpm import:balls` / `pnpm validate:balls` CLI commands
- [x] Internal API: GET /api/brands, /api/families, /api/balls, /api/balls/[id], /api/search
- [x] Admin UI: dashboard, brands list, families list, versions list, create forms
- [x] Documentation: ADR-004, ADR-005, ADR-006, schema ref, RLS matrix, pipeline guide
- [ ] Seed data expanded to 250–300 versions
- [ ] Migrations applied and verified in local Supabase
- [ ] Admin edit flows (edit existing brand/version)
- [ ] Price observation entry in admin
- [ ] Image upload in admin
- [ ] Search + detail pages in public-facing web app
- [ ] SEO: metadata, OpenGraph, structured data (JSON-LD)
- [ ] Sitemap generation
- [ ] Deploy to Vercel preview and smoke-tested

**See:** `docs/status/phase-2.md` for detailed checklist and run instructions

---

## Phase 3 — Registry Experience

**Goal:** First real BallAtlas user experience. The platform is usable as a golf ball
registry, reference database, discovery platform, and valuation reference.

**Note:** Valuation schema (three-table foundation) was completed in Phase 2 (ADR-008).
Phase 3 builds the display layer on top of it, not new schema.

**Deliverables:**

- [ ] Home page — search bar, popular balls, quick filters, live DB counts
- [ ] Search page (`/search`) — FTS + alias search, URL state, shareable
- [ ] Ball detail page (`/balls/[slug]`) — hero, specs, visual ID, valuation, similar balls
- [ ] Filter panel — brand, segment, year, compression, cover material
- [ ] Valuation display — estimated range using valuation profiles + multipliers
- [ ] Similar balls — same segment / comparable compression
- [ ] SEO — metadata, OpenGraph, JSON-LD structured data
- [ ] Sitemap generation
- [ ] Analytics abstraction layer (no vendor yet)
- [ ] Mobile-first responsive layouts
- [ ] Motion — intentional micro-interactions (search transitions, card hovers)
- [ ] Documentation: `docs/frontend/`, `docs/search/`, updated ARCHITECTURE.md

**Design direction:** Linear / Stripe / Raycast aesthetic — premium, data-dense, fast.  
**Research dependencies:** None — all required schema is live from Phase 2.

---

## Phase 4 — Admin & Import System

**Goal:** Internal tooling for data management and bulk imports.

**Deliverables:**

- [ ] Admin authentication (Supabase RLS + role-based access)
- [ ] Admin dashboard: overview metrics
- [ ] Golf ball CRUD interface
- [ ] Bulk CSV/JSON import pipeline
- [ ] Image upload and management
- [ ] Manufacturer management
- [ ] Data quality validation interface
- [ ] Audit log for all admin actions
- [ ] Supabase Edge Function for async import processing

---

## Phase 5 — Image Identification

**Goal:** Identify golf balls from uploaded photos.

**Deliverables:**

- [ ] Image upload interface (drag-and-drop, mobile camera)
- [ ] Supabase Storage for uploaded identification images
- [ ] Image preprocessing pipeline
- [ ] Feature extraction service
- [ ] Similarity matching against known golf ball images
- [ ] Identification confidence scoring
- [ ] "Did you mean?" fallback suggestions
- [ ] Identification history per user (optional account)

**Architecture note:** Requires a separate inference service (TBD in research).
Reserve seam in `packages/golf-data/src/identification/`.

---

## Phase 6 — Public API

**Goal:** Developer API for accessing the BallAtlas database programmatically.

**Deliverables:**

- [ ] `apps/api` — Hono on Vercel Functions
- [ ] API versioning strategy (`/v1/`)
- [ ] Authentication: API key management
- [ ] Rate limiting
- [ ] Endpoints: golf balls, manufacturers, specifications, valuations, search
- [ ] OpenAPI spec generation
- [ ] API documentation site
- [ ] Developer portal (API key self-service)
- [ ] SDK: TypeScript client (`@ballatlas/sdk`)

---

## Phase 7 — AI Intelligence Layer

**Goal:** AI-powered features: natural language search, smart recommendations, deep analysis.

**Deliverables:**

- [ ] pgvector extension enabled in Supabase
- [ ] Vector embeddings for golf ball descriptions and specs
- [ ] Natural language search ("show me low-compression balls from the 90s")
- [ ] Semantic similarity ("balls similar to Titleist Pro V1 2003")
- [ ] AI-assisted identification improvements
- [ ] Specification trend analysis
- [ ] Collection intelligence for registered users
- [ ] AI chat interface for golf ball expertise

**Architecture note:** AI models via Vercel AI SDK. Vector storage via pgvector (Supabase).
Reserve `packages/ai` for this phase.

---

## Post-Roadmap Considerations

- Mobile app (React Native + Expo, consuming `packages/golf-data`)
- Marketplace / listings
- Community features (collections, ratings, reviews)
- Enterprise API tier
- Partnerships with golf retailers and auction houses

---

_Last updated: 2026-06-07_
