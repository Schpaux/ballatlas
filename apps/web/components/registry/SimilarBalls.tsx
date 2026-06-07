import type { Route } from 'next'
import Link from 'next/link'

import { SegmentBadge } from './SegmentBadge'

import { createClient } from '@/lib/supabase/server'

type SimilarBallsProps = {
  versionId: string
  segmentIds: string[]
  compression: number | null
}

export async function SimilarBalls({ versionId, segmentIds, compression }: SimilarBallsProps) {
  if (segmentIds.length === 0) return null

  const supabase = await createClient()

  // Find balls in the same segments with similar compression (±20), exclude current
  let query = supabase
    .from('ball_versions')
    .select(
      `
      id, name, slug, release_year,
      family:ball_families(
        name, slug,
        brand:brands(name, slug)
      ),
      specs:technical_specs(compression, cover_material, construction_layers),
      version_segments(
        segment:segments(id, name, slug)
      )
    `
    )
    .neq('id', versionId)
    .in('status', ['published', 'discontinued'])
    .limit(6)

  if (compression != null) {
    query = query
      .gte('specs.compression', compression - 20)
      .lte('specs.compression', compression + 20)
  }

  const { data } = await query

  if (!data || data.length === 0) return null

  // Filter to only those that share at least one segment
  const similar = data.filter((v) =>
    v.version_segments.some((vs) => vs.segment && segmentIds.includes(vs.segment.id))
  )

  if (similar.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {similar.slice(0, 6).map((ball) => {
        const brand = Array.isArray(ball.family)
          ? ball.family[0]?.brand
          : (ball.family as { name: string; brand: { name: string } } | null)?.brand
        const specs = Array.isArray(ball.specs) ? ball.specs[0] : ball.specs
        const segments = ball.version_segments.map((vs) => vs.segment).filter(Boolean)

        return (
          <Link
            key={ball.id}
            href={`/balls/${ball.slug}` as Route}
            className="group flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {typeof brand === 'object' && brand !== null ? brand.name : '—'}
              </span>
              {ball.release_year && (
                <span className="font-mono text-xs text-neutral-600">{ball.release_year}</span>
              )}
            </div>
            <p className="text-sm font-medium text-neutral-200 transition-colors group-hover:text-white">
              {ball.name}
            </p>
            {segments.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {segments.slice(0, 2).map((seg) => (
                  <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
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
