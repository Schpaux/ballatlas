# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for BallAtlas.

ADRs document significant decisions about the architecture, technology choices,
and design patterns. They serve as the institutional memory of _why_ we built
things the way we did.

## Format

Each ADR is a Markdown file named `ADR-NNN-short-title.md`.

```markdown
# ADR-NNN: Title

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN  
**Deciders:** [names/roles]

## Context

What problem were we solving? What constraints existed?

## Decision

What did we decide to do?

## Consequences

What happens as a result — positive and negative?

## Alternatives Considered

What else did we consider and why did we reject it?
```

## Index

| ADR                                    | Title                                   | Status   | Date       |
| -------------------------------------- | --------------------------------------- | -------- | ---------- |
| [ADR-001](ADR-001-monorepo-tooling.md) | Monorepo Tooling: Turborepo + pnpm      | Accepted | 2026-06-07 |
| [ADR-002](ADR-002-backend-strategy.md) | Backend Strategy: Supabase              | Accepted | 2026-06-07 |
| [ADR-003](ADR-003-design-system.md)    | Design System: shadcn/ui + Tailwind CSS | Accepted | 2026-06-07 |

## Guidelines

- **Never delete** an ADR. Supersede it with a new one.
- Add a new ADR when making decisions about: new packages, technology changes,
  database schema strategy, API design, security model, significant library swaps.
- Open a PR to discuss `Proposed` ADRs before marking `Accepted`.
