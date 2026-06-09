import Image from 'next/image'

import { BrandLogo } from './BrandLogo'
import { GolfBall } from './GolfBall'
import { SegmentBadge } from './SegmentBadge'

import { Link } from '@/i18n/navigation'
import { env } from '@/lib/env'

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
      id: string
      name: string
      slug: string
      logoUrl?: string | null
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
  images?: Array<{
    image_type: string
    storage_path: string | null
    source_url: string | null
    image_quality_score: number | null
    alt_text: string | null
  }>
}

function pickCardImage(images: BallCardData['images']) {
  if (!images?.length) return null
  return (
    [...images].sort((a, b) => {
      if (a.image_type === 'hero' && b.image_type !== 'hero') return -1
      if (b.image_type === 'hero' && a.image_type !== 'hero') return 1
      return (b.image_quality_score ?? 0) - (a.image_quality_score ?? 0)
    })[0] ?? null
  )
}

function resolveImageUrl(img: NonNullable<ReturnType<typeof pickCardImage>>): string | null {
  if (img.storage_path) {
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ball-images/${img.storage_path}`
  }
  return img.source_url
}

export function BallCard({ ball }: { ball: BallCardData }) {
  const segments = ball.version_segments.map((vs) => vs.segment).filter(Boolean)
  const isDiscontinued = ball.status === 'discontinued'

  const specParts: string[] = []
  if (ball.specs?.construction_layers != null) specParts.push(`${ball.specs.construction_layers}pc`)
  if (ball.specs?.compression != null) specParts.push(`C${ball.specs.compression}`)
  if (ball.specs?.cover_material) specParts.push(ball.specs.cover_material)

  const cardImage = pickCardImage(ball.images)
  const imageUrl = cardImage ? resolveImageUrl(cardImage) : null

  return (
    <Link
      href={`/balls/${ball.slug}`}
      className="group flex flex-col gap-0 overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(24,36,29,0.12)]"
      style={{
        background: 'var(--ba-surface)',
        border: '1px solid var(--ba-line-strong)',
      }}
    >
      {/* Card header: brand + year */}
      <div className="flex items-center justify-between px-4 pb-0 pt-4">
        {ball.family?.brand.logoUrl ? (
          <BrandLogo
            src={ball.family.brand.logoUrl}
            alt={ball.family.brand.name}
            className="h-5 opacity-80"
          />
        ) : (
          <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--ba-subtle)' }}>
            {ball.family?.brand.name ?? '—'}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {isDiscontinued && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--ba-ghost)', background: 'var(--ba-paper)' }}
            >
              disc
            </span>
          )}
          {ball.release_year && (
            <span className="font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
              {ball.release_year}
            </span>
          )}
        </div>
      </div>

      {/* Ball image — approved photo or CSS sphere fallback */}
      <div className="flex items-center justify-center py-5">
        {imageUrl ? (
          <div className="relative h-20 w-20">
            <Image
              src={imageUrl}
              alt={cardImage?.alt_text ?? ball.name}
              fill
              className="object-contain"
              sizes="80px"
            />
          </div>
        ) : (
          <GolfBall size="sm" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 px-4 pb-4">
        {/* Ball name */}
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--ba-ink)' }}>
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

        {/* Spec strip + price */}
        <div
          className="flex items-center justify-between gap-2 pt-1"
          style={{ borderTop: '1px solid var(--ba-line)' }}
        >
          {specParts.length > 0 ? (
            <span className="font-mono text-[11px]" style={{ color: 'var(--ba-ghost)' }}>
              {specParts.join(' · ')}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {ball.msrp_usd != null && (
              <span className="font-mono text-xs" style={{ color: 'var(--ba-subtle)' }}>
                ${ball.msrp_usd}
              </span>
            )}
            <span
              className="text-sm transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color: 'var(--ba-ghost)' }}
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
