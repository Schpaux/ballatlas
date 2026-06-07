# Research

This directory holds research findings that inform BallAtlas architecture and data design.

Research documents are created **before** implementation. They inform ADRs, database
schemas, and feature design. Never implement based on assumptions — research first.

## Pending Research

A deep research process is currently running. Expected outputs:

| Research Topic                      | Status         | Target Integration                       |
| ----------------------------------- | -------------- | ---------------------------------------- |
| Database schema recommendations     | 🔄 In Progress | `supabase/migrations/` + Phase 2         |
| Golf ball taxonomy & classification | 🔄 In Progress | `packages/golf-data/src/taxonomy/`       |
| Identification framework            | 🔄 In Progress | `packages/golf-data/src/identification/` |
| Valuation framework                 | 🔄 In Progress | `packages/golf-data/src/valuation/`      |
| Seed dataset                        | 🔄 In Progress | `supabase/seed.sql`                      |

## Completed Research

_(None yet — Phase 1 foundation only)_

## Adding Research Documents

When research is complete, create a document in this directory and link it here.
Format: `TOPIC-NAME.md` (e.g., `golf-ball-taxonomy.md`, `valuation-framework.md`).

Research documents should include:

- Summary of findings
- Recommended data structures
- Reference sources
- Constraints and open questions
- Proposed implementation path

After research is accepted, create the relevant ADRs and implementation plan.
