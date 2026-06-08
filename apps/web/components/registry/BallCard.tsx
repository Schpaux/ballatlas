import { SegmentBadge } from './SegmentBadge'

import { Link } from '@/i18n/navigation'

export type BallCardData = {
  id: string
  name: string
  slug: string
  release_year: number | null
  msrp_usd: number | null
  status: string
  family: {
    name: string
    slug: string
    brand: {
      name: string
      slug: string
    }
  } | null
  specs: {
    compression: number | null
    cover_material: string | null
    construction_layers: number | null
  } | null
  version_segments: Array<{
    segment: {
      id: string
      name: string
      slug: string
    } | null
  }>
}

export function BallCard({ ball }: { ball: BallCardData }) {
  const segments = ball.version_segments.map((vs) => vs.segment).filter(Boolean)
  const isDiscontinued = ball.status === 'discontinued'

  return (
    <Link
      href={`/balls/${ball.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">{ball.family?.brand.name ?? '—'}</span>
        <div className="flex items-center gap-2">
          {isDiscontinued && (
            <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
              disc.
            </span>
          )}
          {ball.release_year && (
            <span className="font-mono text-xs text-neutral-600">{ball.release_year}</span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-medium text-neutral-200 transition-colors group-hover:text-white">
        {ball.name}
      </h3>

      {segments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {segments.map((seg) => (
            <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        {ball.specs?.construction_layers != null && (
          <span>{ball.specs.construction_layers}-piece</span>
        )}
        {ball.specs?.compression != null && (
          <span>
            <span className="text-neutral-600">Comp </span>
            {ball.specs.compression}
          </span>
        )}
        {ball.specs?.cover_material && <span>{ball.specs.cover_material}</span>}
      </div>

      {ball.msrp_usd != null && <div className="text-xs text-neutral-600">${ball.msrp_usd}/dz</div>}
    </Link>
  )
}
