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

## Phase 4 — Market Data, Image Acquisition & Data Governance

**Goal:** Transform BallAtlas from a registry into a continuously improving golf ball
intelligence platform. Build data acquisition workflows, valuation engine, and quality
dashboards. The BallAtlas competitive advantage is data quality — this phase builds
the infrastructure to grow it.

**Deliverables:**

- [x] ADR-009: Hosted Supabase Development Strategy
- [x] ADR-010: Data Acquisition Strategy
- [x] Schema: `images` extended (review_status, image_quality_score, attribution, alt_text)
- [x] Schema: `price_observations` extended (is_archived, notes)
- [x] Schema: `sources` extended (market_type enum, is_active)
- [x] Image upload admin (`/admin/images`) — upload file or URL, categorize, review workflow
- [x] Image review queue — Pending / Approved / Rejected tabs
- [x] Price observation admin (`/admin/prices`) — create, archive, filter
- [x] Source tracking — every observation requires a registered source
- [x] Valuation Engine v1 (`packages/golf-data/src/valuation/engine.ts`)
- [x] Confidence scoring — honest uncertainty, never fabricates values
- [x] Data quality dashboard (`/admin/data-quality`) — coverage bars + gap tables
- [x] Acquisition readiness interfaces (`packages/golf-data/src/acquisition/`)
- [x] Segment filter fix in search page
- [x] Documentation: images, pricing, valuation, data-quality, acquisition
- [ ] Admin authentication (protect `/admin` before production)
- [ ] Valuation Engine wired into `/balls/[slug]` ValuationCard
- [ ] `/admin/sources` management UI
- [ ] Sitemap generation (carried from Phase 3)

---

## Phase 5 — Registry Intelligence & Discovery

**Goal:** Transform BallAtlas from a searchable database into an intelligent golf ball
discovery platform. No AI — all intelligence is deterministic and template-driven.

**Deliverables:**

- [x] Compare experience (`/compare`) — side-by-side specs for 2–4 balls, URL state, shareable
- [x] Similarity engine — `computeSimilarityScore()` with configurable weights, `SimilarityReason` labels
- [x] Brand explorer (`/brands`, `/brands/[slug]`) — family timeline, segment distribution
- [x] Intelligence layer — `buildBallSummary()`, `SEGMENT_DESCRIPTIONS`, `buildDifferenceSummary()`
- [x] `computeCompleteness()` + `DataCompletenessCard` — weighted coverage scoring
- [x] Community feedback — `feedback_submissions` table, `FeedbackForm`, `/admin/feedback`
- [x] Autocomplete API (`/api/autocomplete`) + `SearchBar` suggestions dropdown
- [x] `pg_trgm` extension + trigram indexes for fast fuzzy substring search
- [x] SEO foundation — `sitemap.ts`, `robots.ts`, JSON-LD on ball detail pages
- [x] Valuation Engine wired into `ValuationCard` (Phase 4 gap resolved)
- [x] ADR-011, ADR-012, docs/discovery, docs/comparison, docs/intelligence

**Architecture note:** `packages/golf-data/src/intelligence/` is the domain home for all
deterministic scoring and template logic. Phase 6 (Public API) and Phase 7 (AI) both consume
these services without duplication.

---

## Phase 6 — Platform Generalization & Asset Strategy

**Goal:** Future-proof the platform architecture and establish first-class brand asset
management. No new product categories built — architecture prepared for them.

**Deliverables:**

- [x] ADR-013: Asset Management Strategy (Accepted)
- [x] ADR-014: Product Domain Generalization (Proposed — not implemented)
- [x] `brand_assets` table — brand logos, marks, and visual references
- [x] `asset_review_status` + `brand_asset_type` enums
- [x] `brands.primary_color` + `brands.secondary_color` — brand identity metadata
- [x] `brand-assets` public Supabase Storage bucket
- [x] SVG safety validation (`validateSvgSafety()` in `packages/validators`)
- [x] `/admin/brand-assets` — upload, review, approve, archive brand assets
- [x] `/brands/[slug]` — SVG-first logo rendering with three-level fallback
- [x] Asset abstraction layer (`packages/golf-data/src/assets/`) — interfaces only
- [x] Generalization review (`docs/platform/generalization-review.md`)
- [x] Future equipment strategy (`docs/platform/future-equipment-strategy.md`)
- [x] Registry compatibility audit — zero regressions confirmed

---

## Phase 7 — Identification Intelligence & Dataset Expansion

**Goal:** Build BallAtlas Identification Intelligence — a deterministic, explainable engine
that accepts observed golf ball characteristics and returns ranked candidates with confidence
and evidence. Expand dataset toward 1000+ versions.

**Deliverables:**

- [x] ADR-015: Identification Intelligence Strategy (Accepted)
- [x] DB migration: extend `identification_feature_type` enum (play_number, number_style, visual_pattern)
- [x] `packages/golf-data/src/identification/engine.ts` — `identifyBall()` pure function
- [x] `packages/golf-data/src/identification/config.ts` — configurable `IdentificationWeights`
- [x] `packages/golf-data/src/identification/coverage.ts` — `computeIdentificationCoverage()`
- [x] `packages/golf-data/src/identification/contracts.ts` — AI readiness interfaces
- [x] `POST /api/identify` route handler
- [x] `/identify` page — feature-driven identification UI (no image upload, no AI)
- [x] `IdentificationForm` + `IdentificationResultCard` components
- [x] `/admin/data-quality` — Identification Readiness section
- [x] `pnpm dataset:report` — identification coverage metrics
- [~] Dataset expansion stopped at 353 versions (target: 1000+, baseline: 250)
- [x] `docs/identification/README.md`
- [x] `docs/decisions/ADR-015`

**Architecture note:** BallAtlas owns identification logic. Future AI (Phase 9) produces
`FeatureExtractionResult` — structurally identical to `ObservedFeatures` — and the engine
consumes it without modification. See ADR-015.

---

## Phase 8 — Public API

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

## Phase 9 — AI Intelligence Layer

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

_Last updated: 2026-06-10 — Phase 6 complete; phases 7–9 renumbered_
