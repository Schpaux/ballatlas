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
      className="group relative flex flex-col gap-3.5 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/[0.11] hover:bg-white/[0.035]"
    >
      {/* Emerald accent — slides in on hover */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-emerald-500/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Brand + year */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tracking-wide text-neutral-500">
          {ball.family?.brand.name ?? '—'}
        </span>
        <div className="flex items-center gap-2">
          {isDiscontinued && (
            <span className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-neutral-600">
              disc
            </span>
          )}
          {ball.release_year && (
            <span className="font-mono text-xs text-neutral-600">{ball.release_year}</span>
          )}
        </div>
      </div>

      {/* Ball name — primary focal point */}
      <h3 className="text-base font-semibold leading-snug tracking-tight text-neutral-100 transition-colors group-hover:text-white">
        {ball.name}
      </h3>

      {/* Segments */}
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {segments.map((seg) => (
            <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
          ))}
        </div>
      )}

      {/* Technical specs strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {ball.specs?.construction_layers != null && (
          <span className="text-neutral-500">{ball.specs.construction_layers}-piece</span>
        )}
        {ball.specs?.compression != null && (
          <span className="text-neutral-500">
            Comp <span className="font-mono text-neutral-400">{ball.specs.compression}</span>
          </span>
        )}
        {ball.specs?.cover_material && (
          <span className="text-neutral-500">{ball.specs.cover_material}</span>
        )}
        {ball.msrp_usd != null && (
          <span className="ml-auto font-mono text-neutral-600">${ball.msrp_usd}/dz</span>
        )}
      </div>
    </Link>
  )
}
