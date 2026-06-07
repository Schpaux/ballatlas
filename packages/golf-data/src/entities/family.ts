import type { Tables } from '@ballatlas/database'

import type { Brand } from './brand'

export type BallFamily = Tables<'ball_families'>

export type BallFamilyWithBrand = BallFamily & {
  brand: Brand
}

export type BallFamilyWithVersionCount = BallFamily & {
  version_count: number
}

export function familyUrl(family: BallFamily, brandSlug: string): string {
  return `/brands/${brandSlug}/${family.slug}`
}

export function familyIsActive(family: BallFamily): boolean {
  return family.status === 'published'
}

export function familyYearRange(family: BallFamily): string {
  const start = family.first_release_year ?? '?'
  const end = family.status === 'discontinued' ? (family.last_release_year ?? 'present') : 'present'
  return `${start}–${end}`
}
