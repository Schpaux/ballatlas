import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SegmentBadge } from '@/components/registry/SegmentBadge'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
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

// ── Logo resolution ───────────────────────────────────────────────────────────

type LogoRef = { url: string; mime_type: string; alt_text: string | null } | null

async function resolveBrandLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  brandId: string,
  brandName: string,
  legacyLogoUrl: string | null
): Promise<LogoRef> {
  const { data: svgAsset } = await supabase
    .from('brand_assets')
    .select('storage_path, mime_type, alt_text')
    .eq('brand_id', brandId)
    .eq('asset_type', 'logo_svg')
    .eq('review_status', 'approved')
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (svgAsset) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return {
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${svgAsset.storage_path}`,
      mime_type: 'image/svg+xml',
      alt_text: svgAsset.alt_text ?? `${brandName} logo`,
    }
  }

  const { data: pngAsset } = await supabase
    .from('brand_assets')
    .select('storage_path, mime_type, alt_text')
    .eq('brand_id', brandId)
    .eq('asset_type', 'logo_png')
    .eq('review_status', 'approved')
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (pngAsset) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return {
      url: `${supabaseUrl}/storage/v1/object/public/brand-assets/${pngAsset.storage_path}`,
      mime_type: 'image/png',
      alt_text: pngAsset.alt_text ?? `${brandName} logo`,
    }
  }

  if (legacyLogoUrl) {
    return { url: legacyLogoUrl, mime_type: 'image/png', alt_text: `${brandName} logo` }
  }

  return null
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
      families: families.map((f) => ({ ...f, versions: versionsByFamily[f.id] ?? [] })),
    }
  } catch {
    return null
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const brand = await getBrandDetail(slug)
  if (!brand) return { title: 'Brand Not Found' }

  const totalVersions = brand.families.reduce((sum, f) => sum + f.versions.length, 0)
  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: `${brand.name} Golf Balls | BallAtlas`,
    description: `${brand.name} golf ball registry — ${brand.families.length} model lines, ${totalVersions} versions catalogued on BallAtlas.`,
    alternates: {
      canonical: `${base}/${locale}/brands/${brand.slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/brands/${brand.slug}`])),
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function yearRange(family: FamilyWithVersions, present: string): string {
  const first = family.first_release_year
  const last = family.last_release_year
  if (!first) return ''
  if (!last) return `${first}–${present}`
  if (first === last) return String(first)
  return `${first}–${last}`
}

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

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [brand, t] = await Promise.all([
    getBrandDetail(slug),
    getTranslations({ locale, namespace: 'brandDetail' }),
  ])

  if (!brand) notFound()

  const supabase = await createClient()
  const logo = await resolveBrandLogo(supabase, brand.id, brand.name, brand.logo_url)

  const totalVersions = brand.families.reduce((sum, f) => sum + f.versions.length, 0)
  const segments = topSegments(brand.families)
  const activeFamilies = brand.families.filter(
    (f) => f.status === 'published' && f.versions.length > 0
  )
  const discontinuedFamilies = brand.families.filter(
    (f) => (f.status === 'discontinued' || f.status === 'archived') && f.versions.length > 0
  )

  const presentLabel = t('present')

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--ba-ghost)' }}
        >
          <Link href="/brands" className="transition-opacity hover:opacity-70">
            {t('breadcrumb')}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--ba-subtle)' }}>{brand.name}</span>
        </nav>

        {/* Brand header */}
        <div className="mb-10">
          <div className="mb-4 flex items-end gap-3">
            {logo ? (
              <img
                src={logo.url}
                alt={logo.alt_text ?? `${brand.name} logo`}
                className="h-10 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <h1
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: 'var(--ba-ink)' }}
              >
                {brand.name}
              </h1>
            )}
            {brand.country && (
              <span
                className="mb-0.5 rounded px-1.5 py-0.5 font-mono text-xs"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                {brand.country}
              </span>
            )}
          </div>
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm underline-offset-2 hover:underline"
              style={{ color: 'var(--ba-ghost)' }}
            >
              {brand.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="font-mono text-2xl font-semibold" style={{ color: 'var(--ba-ink)' }}>
                {brand.families.length}
              </span>
              <span className="ml-1.5" style={{ color: 'var(--ba-subtle)' }}>
                {t('modelLines')}
              </span>
            </div>
            <div>
              <span className="font-mono text-2xl font-semibold" style={{ color: 'var(--ba-ink)' }}>
                {totalVersions}
              </span>
              <span className="ml-1.5" style={{ color: 'var(--ba-subtle)' }}>
                {t('versionsCatalogued')}
              </span>
            </div>
          </div>

          {segments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {segments.map((seg) => (
                <SegmentBadge key={seg.slug} slug={seg.slug} name={seg.name} />
              ))}
            </div>
          )}
        </div>

        {activeFamilies.length > 0 && (
          <section className="mb-10">
            <h2 className="kicker mb-4">{t('currentLines')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeFamilies.map((family) => (
                <FamilyCard
                  key={family.id}
                  family={family}
                  brandSlug={brand.slug}
                  t={t}
                  presentLabel={presentLabel}
                />
              ))}
            </div>
          </section>
        )}

        {discontinuedFamilies.length > 0 && (
          <section>
            <h2 className="kicker mb-4">{t('discontinuedLines')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {discontinuedFamilies.map((family) => (
                <FamilyCard
                  key={family.id}
                  family={family}
                  brandSlug={brand.slug}
                  t={t}
                  presentLabel={presentLabel}
                />
              ))}
            </div>
          </section>
        )}

        {brand.families.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--ba-ghost)' }}>
            {t('empty')}
          </p>
        )}
      </div>
    </RegistryLayout>
  )
}

type TranslationFn = Awaited<ReturnType<typeof getTranslations>>

function FamilyCard({
  family,
  brandSlug,
  t,
  presentLabel,
}: {
  family: FamilyWithVersions
  brandSlug: string
  t: TranslationFn
  presentLabel: string
}) {
  const range = yearRange(family, presentLabel)
  const topSegs = family.versions
    .flatMap((v) => v.segments)
    .reduce<Record<string, string>>((acc, s) => {
      acc[s.slug] = s.name
      return acc
    }, {})
  const segEntries = Object.entries(topSegs).slice(0, 2)

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium" style={{ color: 'var(--ba-ink)' }}>
            {family.name}
          </p>
          {range && (
            <p className="mt-0.5 font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
              {range}
            </p>
          )}
        </div>
        <span className="shrink-0 font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
          {t('versions', { count: family.versions.length })}
        </span>
      </div>

      {family.description && (
        <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--ba-subtle)' }}>
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

      {family.versions.length > 0 && (
        <div
          className="flex flex-wrap gap-2 pt-3"
          style={{ borderTop: '1px solid var(--ba-line)' }}
        >
          {family.versions.slice(0, 6).map((v) => (
            <Link
              key={v.id}
              href={`/balls/${v.slug}`}
              className="rounded px-2 py-1 font-mono text-xs transition-colors hover:opacity-70"
              style={{
                border: '1px solid var(--ba-line-strong)',
                color: 'var(--ba-subtle)',
              }}
            >
              {v.release_year ?? v.name}
            </Link>
          ))}
          {family.versions.length > 6 && (
            <Link
              href={`/search?q=${encodeURIComponent(family.name)}&brand=${brandSlug}`}
              className="rounded px-2 py-1 font-mono text-xs transition-colors hover:opacity-70"
              style={{
                border: '1px solid var(--ba-line)',
                color: 'var(--ba-ghost)',
              }}
            >
              {t('moreVersions', { count: family.versions.length - 6 })}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
