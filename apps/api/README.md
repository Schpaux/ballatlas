# @ballatlas/api

> **Phase 6 deliverable** — not yet implemented.

This app will become the BallAtlas public API, built with Hono on Vercel Functions.

## Planned

- REST API v1 at `api.ballatlas.com`
- API key authentication
- Rate limiting
- OpenAPI 3.1 specification
- TypeScript SDK (`@ballatlas/sdk`)

## Prerequisites

Consumes:

- `@ballatlas/golf-data` — domain logic
- `@ballatlas/database` — Supabase types and client
- `@ballatlas/validators` — Zod schemas

Does NOT consume:

- `@ballatlas/ui` — the API has no UI

## See Also

- [ROADMAP.md — Phase 6](../../ROADMAP.md)
- [ADR-002 — Backend Strategy](../../docs/decisions/ADR-002-backend-strategy.md)
- [ARCHITECTURE.md — Future API Architecture](../../ARCHITECTURE.md)
