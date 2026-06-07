import type { Tables } from '@ballatlas/database'

import type { Segment } from '../taxonomy/segments'

import type { Brand } from './brand'
import type { BallFamily } from './family'
import type { TechnicalSpecs } from './specs'
import type { VisualSignature } from './visual'

export type BallVersion = Tables<'ball_versions'>

// Full version with all related data — used for detail page and import
export type BallVersionFull = BallVersion & {
  family: BallFamily & { brand: Brand }
  specs: TechnicalSpecs | null
  visual: VisualSignature | null
  segments: Segment[]
}

// Summary version — used for list/search results
export type BallVersionSummary = BallVersion & {
  family: { id: string; name: string; slug: string }
  brand: { id: string; name: string; slug: string }
  specs: Pick<TechnicalSpecs, 'compression' | 'cover_material' | 'construction_layers'> | null
  segments: Pick<Segment, 'id' | 'name' | 'slug'>[]
}

export function versionUrl(slug: string): string {
  return `/balls/${slug}`
}

export function versionDisplayName(version: BallVersion): string {
  return version.name
}

export function versionIsPublic(version: BallVersion): boolean {
  return version.status === 'published' || version.status === 'discontinued'
}

export function versionMsrpDisplay(
  version: BallVersion,
  currency: 'usd' | 'nok' = 'usd'
): string | null {
  const price = currency === 'nok' ? version.msrp_nok : version.msrp_usd
  if (price === null) return null
  return currency === 'nok' ? `kr ${price.toFixed(0)}` : `$${price.toFixed(2)}`
}
