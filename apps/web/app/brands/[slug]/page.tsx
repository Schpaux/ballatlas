import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SegmentBadge } from '@/components/registry/SegmentBadge'
import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────────────────────

type FamilyWithVersions = {
  id: string
  name: string
  slug: string
  description: string | null
  first_release_year: number | null
  last_release_year: number | null
  status: string
  versions: {
    id: string
    slug: string
    name: string
    release_year: number | null
    segments: { slug: string; name: string }[]
  }[]
}

type BrandDetail = {
  id: string
  name: string
  slug: string
  country: string | null
  website: string | null
  logo_url: string | null
  families: FamilyWithVersions[]
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getBrandDetail(slug: string): Promise<BrandDetail | null> {
  try {
    const supabase = await createClient()

    const { data: brand, error } = await supabase
      .from('brands')
      .select('id, name, slug, country, website, logo_url')
      .eq('slug', slug)
      .single()

    if (error || !brand) return null

    const { data: families } = await supabase
      .from('ball_families')
      .select('id, name, slug, description, first_release_year, last_release_year, status')
      .eq('brand_id', brand.id)
      .order('first_release_year', { ascending: true, nullsFirst: false })

    if (!families) return { ...brand, families: [] }

    const familyIds = families.map((f) => f.id)

    const { data: versions } = await supabase
      .from('ball_versions')
      .select(
        `id, slug, name, release_year, family_id,
         version_segments(segment:segments(slug, name))`
      )
      .in('family_id', familyIds)
      .in('status', ['published', 'discontinued'])
      .order('release_year', { ascending: false })

    // Group versions by family
    const versionsByFamily = (versions ?? []).reduce<
      Record<string, FamilyWithVersions['versions']>
    >((acc, v) => {
      const segs = (v.version_segments as { segment: { slug: string; name: string } | null }[])
        .map((vs) => vs.segment)
        .filter(Boolean) as { slug: string; name: string }[]

      const entry = {
        id: v.id,
        slug: v.slug,
        name: v.name,
        release_year: v.release_year,
        segments: segs,
      }
      if (!acc[v.family_id]) acc[v.family_id] = []
      acc[v.family_id]!.push(entry)
      return acc
    }, {})

    return {
      ...brand,
      families: families.map((f) => ({
        ...f,
        versions: versionsByFamily[f.id] ?? [],
      })),
    }
  } catch {
    return null
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandDetail(slug)
  if (!brand) return { title: 'Brand Not Found' }

  const totalVersions = brand.families.reduce((sum, f) => sum + f.versions.length, 0)
  return {
    title: `${brand.name} Golf Balls | BallAtlas`,
    description: `${brand.name} golf ball registry — ${brand.families.length} model lines, ${totalVersions} versions catalogued on BallAtlas.`,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearRange(family: FamilyWithVersions): string {
  const first = family.first_release_year
  const last = family.last_release_year
  if (!first) return ''
  if (!last) return `${first}–present`
  if (first === last) return String(first)
  return `${first}–${last}`
}

// Collect all unique segment slugs+names across a brand's versions, sorted by count
function topSegments(
  families: FamilyWithVersions[]
): { slug: string; name: string; count: number }[] {
  const counts: Record<string, { name: string; count: number }> = {}
  for (const family of families) {
    for (const version of family.versions) {
      for (const seg of version.segments) {
        if (!counts[seg.slug]) counts[seg.slug] = { name: seg.name, count: 0 }
        counts[seg.slug]!.count++
      }
    }
  }
  return Object.entries(counts)
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await getBrandDetail(slug)

  if (!brand) notFound()

  const totalVersions = brand.families.reduce((sum, f) => sum + f.versions.length, 0)
  const segments = topSegments(brand.families)
  const activeFamilies = brand.families.filter(
    (f) => f.status === 'published' && f.versions.length > 0
  )
  const discontinuedFamilies = brand.families.filter(
    (f) => (f.status === 'discontinued' || f.status === 'archived') && f.versions.length > 0
  )

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-600">
          <Link href="/brands" className="transition-colors hover:text-neutral-400">
            Brands
          </Link>
          <span>/</span>
          <span className="text-neutral-500">{brand.name}</span>
        </nav>

        {/* Brand header */}
        <div className="mb-10">
          <div className="mb-1 flex items-center gap-3">
            {brand.country && (
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-500">
                {brand.country}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
            {brand.name}
          </h1>
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-neutral-600 underline-offset-2 hover:text-neutral-400 hover:underline"
            >
              {brand.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          {/* Stats row */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="font-mono text-2xl font-semibold text-neutral-100">
                {brand.families.length}
              </span>
              <span className="ml-1.5 text-neutral-500">model lines</span>
            </div>
            <div>
              <span className="font-mono text-2xl font-semibold text-neutral-100">
                {totalVersions}
              </span>
              <span className="ml-1.5 text-neutral-500">versions catalogued</span>
            </div>
          </div>

          {/* Segment distribution */}
          {segments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {segments.map((seg) => (
                <SegmentBadge key={seg.slug} slug={seg.slug} name={seg.name} />
              ))}
            </div>
          )}
        </div>

        {/* Active families */}
        {activeFamilies.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-600">
              Current Lines
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeFamilies.map((family) => (
                <FamilyCard key={family.id} family={family} brandSlug={brand.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Discontinued families */}
        {discontinuedFamilies.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-600">
              Discontinued Lines
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {discontinuedFamilies.map((family) => (
                <FamilyCard key={family.id} family={family} brandSlug={brand.slug} />
              ))}
            </div>
          </section>
        )}

        {brand.families.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-600">
            No ball families catalogued for this brand yet.
          </p>
        )}
      </div>
    </RegistryLayout>
  )
}

function FamilyCard({ family, brandSlug }: { family: FamilyWithVersions; brandSlug: string }) {
  const range = yearRange(family)
  const topSegs = family.versions
    .flatMap((v) => v.segments)
    .reduce<Record<string, string>>((acc, s) => {
      acc[s.slug] = s.name
      return acc
    }, {})
  const segEntries = Object.entries(topSegs).slice(0, 2)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-200">{family.name}</p>
          {range && <p className="mt-0.5 font-mono text-xs text-neutral-600">{range}</p>}
        </div>
        <span className="shrink-0 font-mono text-xs text-neutral-600">
          {family.versions.length} version{family.versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {family.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
          {family.description}
        </p>
      )}

      {segEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {segEntries.map(([slug, name]) => (
            <SegmentBadge key={slug} slug={slug} name={name} />
          ))}
        </div>
      )}

      {/* Version links */}
      {family.versions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.04] pt-3">
          {family.versions.slice(0, 6).map((v) => (
            <Link
              key={v.id}
              href={`/balls/${v.slug}` as Route}
              className="rounded border border-white/[0.06] px-2 py-1 font-mono text-xs text-neutral-500 transition-colors hover:border-white/[0.12] hover:text-neutral-300"
            >
              {v.release_year ?? v.name}
            </Link>
          ))}
          {family.versions.length > 6 && (
            <Link
              href={`/search?q=${encodeURIComponent(family.name)}&brand=${brandSlug}` as Route}
              className="rounded border border-white/[0.06] px-2 py-1 font-mono text-xs text-neutral-600 transition-colors hover:text-neutral-400"
            >
              +{family.versions.length - 6} more
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
