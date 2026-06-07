import type { Tables } from '@ballatlas/database'

// ─── Row types (direct DB rows) ────────────────────────────────────────────

export type Brand = Tables<'brands'>

// ─── Domain types (enriched with relationships) ─────────────────────────────

export type BrandWithFamilyCount = Brand & {
  family_count: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function brandDisplayName(brand: Brand): string {
  return brand.name
}

export function brandUrl(brand: Brand): string {
  return `/brands/${brand.slug}`
}
