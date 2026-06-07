import type { Route } from 'next'
import Link from 'next/link'

import { rankBySimilarity, type BallProfile } from '@ballatlas/golf-data'

import { SegmentBadge } from './SegmentBadge'

import { createClient } from '@/lib/supabase/server'

type SimilarBallsProps = {
  versionId: string
  segmentIds: string[]
  compression: number | null
  currentBallSpecs: {
    compression: number | null
    construction_layers: number | null
    cover_material: string | null
    launch_profile: string | null
    spin_profile: string | null
    feel_profile: string | null
  } | null
  currentBallSegments: { id: string; slug: string; name: string }[]
}

export async function SimilarBalls({
  versionId,
  segmentIds,
  compression,
  currentBallSpecs,
  currentBallSegments,
}: SimilarBallsProps) {
  if (segmentIds.length === 0) return null

  const supabase = await createClient()

  // Fetch a candidate pool: same segments + ±30 compression tolerance
  let query = supabase
    .from('ball_versions')
    .select(
      `
      id, name, slug, release_year,
      family:ball_families(
        name, slug,
        brand:brands(name, slug)
      ),
      specs:technical_specs(
        compression, cover_material, construction_layers,
        launch_profile, spin_profile, feel_profile
      ),
      version_segments(
        segment:segments(id, slug, name)
      )
    `
    )
    .neq('id', versionId)
    .in('status', ['published', 'discontinued'])
    .limit(40)

  if (compression != null) {
    query = query
      .gte('specs.compression', compression - 30)
      .lte('specs.compression', compression + 30)
  }

  const { data } = await query
  if (!data || data.length === 0) return null

  // Filter to candidates sharing at least one segment
  const candidates = data.filter((v) =>
    v.version_segments.some((vs) => vs.segment && segmentIds.includes(vs.segment.id))
  )

  if (candidates.length === 0) return null

  // Map to BallProfile shape for the scoring engine
  const reference: BallProfile = {
    id: versionId,
    slug: '',
    name: '',
    brandName: '',
    segments: currentBallSegments,
    specs: currentBallSpecs,
  }

  const candidateProfiles: BallProfile[] = candidates.map((c) => {
    const family = Array.isArray(c.family) ? c.family[0] : c.family
    const brand =
      family && typeof family === 'object' && 'brand' in family
        ? Array.isArray(family.brand)
          ? family.brand[0]
          : family.brand
        : null
    const specs = Array.isArray(c.specs) ? c.specs[0] : c.specs
    const segs = (
      c.version_segments as { segment: { id: string; slug: string; name: string } | null }[]
    )
      .map((vs) => vs.segment)
      .filter(Boolean) as { id: string; slug: string; name: string }[]

    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      brandName:
        typeof brand === 'object' && brand !== null ? (brand as { name: string }).name : '',
      segments: segs,
      specs: specs
        ? {
            compression: (specs as { compression?: number | null }).compression ?? null,
            construction_layers:
              (specs as { construction_layers?: number | null }).construction_layers ?? null,
            cover_material: (specs as { cover_material?: string | null }).cover_material ?? null,
            launch_profile: (specs as { launch_profile?: string | null }).launch_profile ?? null,
            spin_profile: (specs as { spin_profile?: string | null }).spin_profile ?? null,
            feel_profile: (specs as { feel_profile?: string | null }).feel_profile ?? null,
          }
        : null,
    }
  })

  const ranked = rankBySimilarity(reference, candidateProfiles)

  if (ranked.length === 0) return null

  // Re-join display data from original query results
  const byId = Object.fromEntries(candidates.map((c) => [c.id, c]))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ranked.map(({ profile, reasons }) => {
        const raw = byId[profile.id]
        if (!raw) return null

        const family = Array.isArray(raw.family) ? raw.family[0] : raw.family
        const brand =
          family && typeof family === 'object' && 'brand' in family
            ? Array.isArray(family.brand)
              ? family.brand[0]
              : family.brand
            : null
        const specs = Array.isArray(raw.specs) ? raw.specs[0] : raw.specs
        const segs = (
          raw.version_segments as { segment: { id: string; slug: string; name: string } | null }[]
        )
          .map((vs) => vs.segment)
          .filter(Boolean)

        return (
          <Link
            key={profile.id}
            href={`/balls/${profile.slug}` as Route}
            className="group flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {typeof brand === 'object' && brand !== null
                  ? (brand as { name: string }).name
                  : '—'}
              </span>
              {raw.release_year && (
                <span className="font-mono text-xs text-neutral-600">{raw.release_year}</span>
              )}
            </div>
            <p className="text-sm font-medium text-neutral-200 transition-colors group-hover:text-white">
              {profile.name}
            </p>
            {segs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segs.slice(0, 2).map((seg) => (
                  <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
                ))}
              </div>
            )}
            {/* Similarity reasons */}
            {reasons.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-white/[0.04] pt-2">
                {reasons.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500"
                  >
                    {r.label}
                  </span>
                ))}
              </div>
            )}
            {specs && (
              <div className="flex gap-3 text-xs text-neutral-600">
                {(specs as { compression?: number | null }).compression != null && (
                  <span>Comp {(specs as { compression: number }).compression}</span>
                )}
                {(specs as { cover_material?: string | null }).cover_material && (
                  <span>{(specs as { cover_material: string }).cover_material}</span>
                )}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
