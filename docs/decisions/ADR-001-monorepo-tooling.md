# ADR-001: Monorepo Tooling — Turborepo + pnpm

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect

---

## Context

BallAtlas has a clear separation between concerns that will grow over time:

- A web application (`apps/web`)
- A future public API (`apps/api`)
- Golf ball domain logic shared by both
- Shared UI components
- Shared configuration

We needed a monorepo strategy that handles:

1. Shared package dependencies and internal imports
2. Incremental builds (don't rebuild unchanged packages)
3. Parallel task execution
4. A path to remote caching for CI performance
5. Good TypeScript and Next.js support

## Decision

Use **Turborepo** as the task orchestrator with **pnpm workspaces** as the package manager.

## Consequences

### Positive

- Turborepo integrates natively with Vercel's remote cache — CI build times improve
  significantly once the cache is warm
- pnpm workspaces have stricter dependency management than npm (phantom dependencies
  are prevented by default)
- pnpm installs are significantly faster than npm, especially on CI
- Turborepo's pipeline config (`turbo.json`) is minimal and readable
- Both tools have excellent Next.js support (Turborepo is built by Vercel)

### Negative

- pnpm requires developers to install it (`npm i -g pnpm` or `corepack enable`)
- Turborepo remote cache requires a Vercel token to be configured in CI
- Slightly more complex initial setup than a single-package project

## Alternatives Considered

**Nx:** More powerful but significantly more complex. Configuration overhead doesn't
justify the features for our scale. Turborepo's simpler model is easier to reason about.

**Lerna + Yarn workspaces:** Legacy approach. Lerna is largely superseded by Turborepo
for task orchestration. Yarn workspaces add little over pnpm workspaces.

**npm workspaces:** Native to npm but lacks task orchestration. Would need a separate
tool anyway.

**Bun workspaces:** Bun is fast but ecosystem compatibility is still maturing. pnpm is
more battle-tested in production monorepos. Revisit in 12 months.
