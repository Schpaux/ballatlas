import type { RawBrand, RawFamily, RawVersion } from '@ballatlas/validators'

// Ensures a slug is properly formatted (lowercase, hyphens).
// The Zod schema already validates format; this provides a safety net.
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function normalizeBrand(raw: RawBrand) {
  return {
    name: raw.name,
    slug: normalizeSlug(raw.slug),
    country: raw.country ?? null,
    website: raw.website ?? null,
    logo_url: raw.logo_url ?? null,
  }
}

export function normalizeFamily(raw: RawFamily, brandId: string) {
  return {
    brand_id: brandId,
    name: raw.name,
    slug: normalizeSlug(raw.slug),
    description: raw.description ?? null,
    first_release_year: raw.first_release_year ?? null,
    last_release_year: raw.last_release_year ?? null,
    status: raw.status,
  }
}

export function normalizeVersion(raw: RawVersion, familyId: string) {
  return {
    family_id: familyId,
    name: raw.name,
    slug: normalizeSlug(raw.slug),
    release_year: raw.release_year ?? null,
    release_date: raw.release_date ?? null,
    msrp_usd: raw.msrp_usd ?? null,
    msrp_nok: raw.msrp_nok ?? null,
    status: raw.status,
  }
}
