# ADR-003: Design System — shadcn/ui + Tailwind CSS v3

**Date:** 2026-06-07  
**Status:** Accepted  
**Deciders:** Principal Architect

---

## Context

BallAtlas needs a component system that:

1. Produces premium, modern aesthetics (Linear/Stripe quality)
2. Is accessible by default (WCAG 2.1 AA)
3. Allows deep customization of appearance and behavior
4. Works well with TypeScript
5. Supports dark mode from day one
6. Doesn't impose a heavy runtime bundle
7. Is maintainable long-term

## Decision

Use **shadcn/ui** as the component foundation with **Tailwind CSS v3**.

shadcn/ui components are copied into the project (not installed as a black-box npm package),
giving full ownership. They live in `apps/web/components/ui/` and are added via
`npx shadcn@latest add [component]`.

Tailwind CSS v3 (not v4) is used because:

- shadcn/ui's primary target and documentation is Tailwind v3
- shadcn/ui CSS variable system is designed for v3
- v4 migration can be performed in a dedicated phase once shadcn/ui v4 support matures

Design tokens (colors, spacing scale, typography) are centralized in
`packages/config/tailwind/index.ts` and extended in each app.

## Consequences

### Positive

- shadcn/ui components are owned by the project — no dependency on upstream breaking changes
- CSS variable-based theming allows seamless dark mode
- Tailwind's utility-first approach produces highly customizable UIs without CSS bloat
- Radix UI primitives (shadcn's base) provide robust keyboard navigation and ARIA
- No JavaScript runtime dependency for styling (unlike styled-components/emotion)
- Excellent TypeScript inference for variant props via `class-variance-authority`

### Negative

- Components must be manually updated when shadcn releases improvements (`pnpm bump-ui`)
- Tailwind v3 → v4 migration is a future obligation
- Large HTML class strings can be verbose (mitigated by the `cn()` utility and CVA)

## Alternatives Considered

**Radix Themes:** Beautiful but less flexible. The visual style is fixed; BallAtlas
needs a distinctive premium aesthetic that diverges from defaults.

**MUI / Ant Design / Chakra:** Heavyweight libraries with opinionated visual styles.
Customization to achieve a Linear-quality aesthetic is more work than starting with
shadcn/ui primitives.

**Tailwind UI:** Commercial, excellent quality. But it provides HTML snippets, not
React components. Would require significant wrapping work. shadcn/ui provides the
React component layer already.

**Tailwind CSS v4:** Strong long-term choice, but shadcn/ui compatibility was not fully
stable at project start. Revisit when shadcn/ui v4 support is officially stable.
