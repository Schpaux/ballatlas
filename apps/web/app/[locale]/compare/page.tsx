import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import {
  computeFieldDiff,
  buildDifferenceSummary,
  type CompareBallProfile,
} from '@ballatlas/golf-data'

import { BallSelector } from '@/components/compare/BallSelector'
import { CompareTable } from '@/components/compare/CompareTable'
import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.compare' })
  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/compare`])),
    },
  }
}

async function getBallsForCompare(slugs: string[]): Promise<CompareBallProfile[]> {
  if (slugs.length === 0) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('ball_versions')
      .select(
        `id, slug, name, release_year, msrp_usd,
         family:ball_families(
           slug, name,
           brand:brands(name, slug)
         ),
         specs:technical_specs(
           compression, construction_layers, cover_material,
           launch_profile, spin_profile, feel_profile, dimple_count
         ),
         version_segments(segment:segments(slug, name))`
      )
      .in('slug', slugs)
      .in('status', ['published', 'discontinued'])

    if (!data) return []

    const bySlug = Object.fromEntries(data.map((b) => [b.slug, b]))
    return slugs
      .map((slug) => {
        const b = bySlug[slug]
        if (!b) return null

        const family = Array.isArray(b.family) ? b.family[0] : b.family
        const brand =
          family && typeof family === 'object' && 'brand' in family
            ? Array.isArray(family.brand)
              ? family.brand[0]
              : family.brand
            : null
        const specs = Array.isArray(b.specs) ? b.specs[0] : b.specs
        const segs = (b.version_segments as { segment: { slug: string; name: string } | null }[])
          .map((vs) => vs.segment)
          .filter(Boolean) as { slug: string; name: string }[]

        return {
          id: b.id,
          slug: b.slug,
          name: b.name,
          brandName:
            typeof brand === 'object' && brand !== null ? (brand as { name: string }).name : null,
          familyName:
            typeof family === 'object' && family !== null
              ? (family as { name: string }).name
              : null,
          releaseYear: b.release_year,
          segments: segs,
          specs: specs
            ? {
                compression: (specs as { compression?: number | null }).compression ?? null,
                construction_layers:
                  (specs as { construction_layers?: number | null }).construction_layers ?? null,
                cover_material:
                  (specs as { cover_material?: string | null }).cover_material ?? null,
                launch_profile:
                  (specs as { launch_profile?: string | null }).launch_profile ?? null,
                spin_profile: (specs as { spin_profile?: string | null }).spin_profile ?? null,
                feel_profile: (specs as { feel_profile?: string | null }).feel_profile ?? null,
                dimple_count: (specs as { dimple_count?: number | null }).dimple_count ?? null,
              }
            : null,
          msrp_usd: b.msrp_usd,
        } satisfies CompareBallProfile
      })
      .filter(Boolean) as CompareBallProfile[]
  } catch {
    return []
  }
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ balls?: string }>
}) {
  const { locale } = await params
  const { balls: ballsParam } = await searchParams

  const rawSlugs = (ballsParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const slugs = rawSlugs.slice(0, 4)

  const [profiles, t] = await Promise.all([
    getBallsForCompare(slugs),
    getTranslations({ locale, namespace: 'compare' }),
  ])

  const rows = profiles.length >= 2 ? computeFieldDiff(profiles) : []

  const differenceSummary =
    profiles.length === 2 && profiles[0] && profiles[1]
      ? buildDifferenceSummary(profiles[0], profiles[1])
      : []

  const selectedNames = Object.fromEntries(profiles.map((p) => [p.slug, p.name]))

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">{t('title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>
        </div>

        <BallSelector selectedSlugs={slugs} selectedNames={selectedNames} />

        {profiles.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-600">{t('emptySearch')}</p>
          </div>
        )}

        {profiles.length === 1 && (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-600">{t('emptyAddMore')}</p>
          </div>
        )}

        {profiles.length >= 2 && (
          <div className="space-y-8">
            {differenceSummary.length > 0 && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
                  {t('keyDifferences')}
                </p>
                <ul className="space-y-1">
                  {differenceSummary.map((sentence, i) => (
                    <li key={i} className="text-sm text-neutral-400">
                      {sentence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <CompareTable profiles={profiles} rows={rows} />
          </div>
        )}
      </div>
    </RegistryLayout>
  )
}
