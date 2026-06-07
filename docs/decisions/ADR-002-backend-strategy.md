# ADR-002: Backend Strategy — Supabase

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect

---

## Context

BallAtlas needs:

1. A PostgreSQL database for the registry
2. Authentication (email, potentially OAuth)
3. File storage for ball images
4. A path to real-time features (future)
5. Row Level Security for multi-tenant data isolation
6. A local development environment that mirrors production
7. TypeScript type generation from the DB schema

We evaluated the options given the planned Phase 7 AI requirements (pgvector)
and Phase 5 image identification (object storage).

## Decision

Use **Supabase** as the single backend platform, providing:

- PostgreSQL via Supabase
- Supabase Auth
- Supabase Storage (for ball images, identification uploads)
- Supabase Edge Functions (for async processing in Phase 4+)
- pgvector extension for AI embeddings in Phase 7

All Supabase types are generated via `supabase gen types typescript` and committed
to `packages/database/src/types.generated.ts`.

Server-side Supabase access uses `@supabase/ssr` with `createServerClient`.
Client-side uses `createBrowserClient`.

## Consequences

### Positive

- Single vendor for DB, auth, storage, and functions reduces operational complexity
- pgvector is available natively — no separate vector DB needed in Phase 7
- Local dev via `supabase start` perfectly mirrors production schema and behavior
- TypeScript types auto-generated from DB schema prevent type drift
- RLS policies enforce security at the database layer regardless of application code
- Generous free tier for development; predictable pricing at scale

### Negative

- Vendor lock-in: migrating off Supabase would require replacing auth, storage, and
  the database client simultaneously
- Supabase's PostgreSQL version lags slightly behind vanilla PostgreSQL releases
- Edge Functions (Deno) have a different runtime than Node.js — requires care

## Alternatives Considered

**PlanetScale + Clerk + S3:** Three vendors to manage. More flexible but operational
overhead is significantly higher. Auth in particular benefits from being co-located
with the database (RLS).

**Neon + Clerk + Cloudflare R2:** Neon's branching is excellent for migrations but
doesn't solve auth or storage. Clerk is a strong auth option but adds cost and
another integration point.

**Self-hosted PostgreSQL:** Maximum control, maximum operational burden. Not appropriate
for a team focused on product development.

**Firebase:** Not PostgreSQL. Firestore's document model doesn't suit the relational
nature of golf ball specifications.
