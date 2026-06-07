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

## Phase 2 — Golf Ball Registry

**Goal:** Search, browse, and view golf ball specifications. The core product.

**Deliverables:**

- [ ] Database schema: `golf_balls`, `manufacturers`, `specifications`, `categories`
- [ ] Supabase RLS policies for all tables
- [ ] `packages/golf-data`: domain entities, taxonomy, specification models
- [ ] `packages/validators`: golf ball input schemas
- [ ] Search page: full-text search with filters (manufacturer, category, year)
- [ ] Golf ball detail page: specifications, images, metadata
- [ ] Manufacturer index page
- [ ] Category/taxonomy browser
- [ ] Seed dataset: initial golf ball records from research
- [ ] Image storage: Supabase Storage bucket for ball photos
- [ ] `next/image` integration with Supabase CDN
- [ ] SEO: metadata, OpenGraph, structured data (JSON-LD)
- [ ] Sitemap generation

**Research dependencies:** Database schema, golf ball taxonomy, seed dataset

---

## Phase 3 — Valuation Engine

**Goal:** Market value tracking and pricing history for golf balls.

**Deliverables:**

- [ ] Database schema: `valuations`, `price_history`, `market_conditions`
- [ ] Valuation model in `packages/golf-data/src/valuation/`
- [ ] Price history chart component
- [ ] Condition grading system (Mint, Near Mint, Good, Fair, Poor)
- [ ] Valuation detail page per golf ball
- [ ] Historical price trend visualization
- [ ] Market value badge on golf ball cards

**Research dependencies:** Valuation framework, condition grading standards

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
