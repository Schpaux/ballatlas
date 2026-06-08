import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import {
  computeValuation,
  buildBallSummary,
  type CompletenessInput,
  type ObservationInput,
} from '@ballatlas/golf-data'

import { DataCompletenessCard } from '@/components/registry/DataCompletenessCard'
import { FeedbackForm } from '@/components/registry/FeedbackForm'
import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SegmentBadge } from '@/components/registry/SegmentBadge'
import { SimilarBalls } from '@/components/registry/SimilarBalls'
import { SpecGrid } from '@/components/registry/SpecGrid'
import { ValuationCard } from '@/components/registry/ValuationCard'
import { VisualIdentityCard } from '@/components/registry/VisualIdentityCard'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────────────────────

type BallDetail = {
  id: string
  name: string
  slug: string
  release_year: number | null
  release_date: string | null
  msrp_usd: number | null
  msrp_nok: number | null
  status: string
  family: {
    id: string
    name: string
    slug: string
    description: string | null
    brand: {
      id: string
      name: string
      slug: string
      country: string | null
      website: string | null
    }
  } | null
  specs: {
    construction_layers: number | null
    compression: number | null
    cover_material: string | null
    core_material: string | null
    dimple_count: number | null
    dimple_pattern: string | null
    launch_profile: 'low' | 'mid' | 'high' | null
    spin_profile: 'low' | 'mid' | 'high' | null
    feel_profile: 'soft' | 'medium' | 'firm' | null
    notes: string | null
  } | null
  visual: {
    primary_color: string | null
    finish: 'glossy' | 'matte' | 'satin' | null
    logo_style: string | null
    logo_text: string | null
    alignment_marking: string | null
    number_style: string | null
    number_color: string | null
    special_markings: string | null
  } | null
  version_segments: Array<{
    segment: {
      id: string
      name: string
      slug: string
    } | null
  }>
  price_observations: Array<{
    condition: string
    price: number
    currency: string
    observed_at: string
    is_archived: boolean
    source: { id: string; name: string; url: string | null; reliability_score: number } | null
  }>
  images: Array<{ review_status: string }>
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getBall(slug: string): Promise<BallDetail | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ball_versions')
      .select(
        `
        id, name, slug, release_year, release_date, msrp_usd, msrp_nok, status,
        family:ball_families(
          id, name, slug, description,
          brand:brands(id, name, slug, country, website)
        ),
        specs:technical_specs(
          construction_layers, compression, cover_material, core_material,
          dimple_count, dimple_pattern, launch_profile, spin_profile, feel_profile, notes
        ),
        visual:visual_signatures(
          primary_color, finish, logo_style, logo_text,
          alignment_marking, number_style, number_color, special_markings
        ),
        version_segments(
          segment:segments(id, name, slug)
        ),
        price_observations(
          condition, price, currency, observed_at, is_archived,
          source:sources(id, name, url, reliability_score)
        ),
        images(review_status)
        `
      )
      .eq('slug', slug)
      .in('status', ['published', 'discontinued'])
      .single()

    if (error || !data) return null
    return data as unknown as BallDetail
  } catch {
    return null
  }
}

async function getValuationProfile(primarySegmentSlug: string | null) {
  if (!primarySegmentSlug) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('valuation_profiles')
      .select(
        `
        segment,
        condition_multipliers(condition, multiplier),
        valuation_rules(age_adjustment, demand_adjustment, availability_adjustment)
        `
      )
      .eq('is_active', true)
      .ilike('segment', primarySegmentSlug)
      .single()
    return data ?? null
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
  const ball = await getBall(slug)
  if (!ball) return { title: 'Ball Not Found' }

  const summary = buildBallSummary({
    name: ball.name,
    segmentSlug: ball.version_segments[0]?.segment?.slug ?? null,
    constructionLayers: ball.specs?.construction_layers ?? null,
    coverMaterial: ball.specs?.cover_material ?? null,
    compression: ball.specs?.compression ?? null,
    launchProfile: ball.specs?.launch_profile ?? null,
    spinProfile: ball.specs?.spin_profile ?? null,
    feelProfile: ball.specs?.feel_profile ?? null,
  })

  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: ball.name,
    description: summary,
    alternates: {
      canonical: `${base}/${locale}/balls/${ball.slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/balls/${ball.slug}`])),
    },
    openGraph: {
      title: `${ball.name} | BallAtlas`,
      description: summary,
      url: `${base}/${locale}/balls/${ball.slug}`,
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BallDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [ball, t] = await Promise.all([
    getBall(slug),
    getTranslations({ locale, namespace: 'ballDetail' }),
  ])

  if (!ball) notFound()

  const brand = ball.family?.brand
  const family = ball.family
  const segments = ball.version_segments.map((vs) => vs.segment).filter(Boolean)
  const primarySegment = segments[0] ?? null

  const valuationProfile = await getValuationProfile(primarySegment?.slug ?? null)

  const observations: ObservationInput[] = ball.price_observations.map((o) => ({
    price: o.price,
    currency: o.currency,
    condition: o.condition as ObservationInput['condition'],
    observed_at: o.observed_at,
    source_reliability: (o.source as { reliability_score: number } | null)?.reliability_score ?? 5,
    is_archived: o.is_archived,
  }))

  const valuationResult = computeValuation({
    version_id: ball.id,
    release_year: ball.release_year,
    target_condition: 'mint',
    observations,
    condition_multipliers: valuationProfile?.condition_multipliers ?? [],
    valuation_rule: valuationProfile?.valuation_rules?.[0] ?? null,
  })

  const hasApprovedImage = ball.images.some((img) => img.review_status === 'approved')
  const completenessInput: CompletenessInput = {
    specs: ball.specs,
    visual: ball.visual,
    priceObservationCount: observations.filter((o) => !o.is_archived).length,
    hasApprovedImage,
  }

  const summaryText = buildBallSummary({
    name: ball.name,
    segmentSlug: primarySegment?.slug ?? null,
    constructionLayers: ball.specs?.construction_layers ?? null,
    coverMaterial: ball.specs?.cover_material ?? null,
    compression: ball.specs?.compression ?? null,
    launchProfile: ball.specs?.launch_profile ?? null,
    spinProfile: ball.specs?.spin_profile ?? null,
    feelProfile: ball.specs?.feel_profile ?? null,
  })

  const segmentIds = segments.map((s) => s!.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ball.name,
    description: summaryText,
    url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/balls/${ball.slug}`,
    ...(brand && { brand: { '@type': 'Brand', name: brand.name } }),
    ...(ball.release_year && { releaseDate: String(ball.release_year) }),
  }

  return (
    <RegistryLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-600">
          <Link href="/search" className="transition-colors hover:text-neutral-400">
            {t('browse')}
          </Link>
          {brand && (
            <>
              <span>/</span>
              <Link
                href={`/brands/${brand.slug}`}
                className="transition-colors hover:text-neutral-400"
              >
                {brand.name}
              </Link>
            </>
          )}
          {family && (
            <>
              <span>/</span>
              <Link
                href={`/search?q=${encodeURIComponent(family.name)}`}
                className="transition-colors hover:text-neutral-400"
              >
                {family.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-500">{ball.name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-12 border-b border-white/[0.04] pb-10">
          {/* Brand pill + status */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {brand && (
              <Link
                href={`/brands/${brand.slug}`}
                className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs font-medium text-neutral-400 transition-all duration-150 hover:border-white/[0.10] hover:text-neutral-200"
              >
                {brand.name}
              </Link>
            )}
            {ball.status === 'discontinued' && (
              <span className="rounded-full border border-white/[0.04] bg-neutral-800/50 px-3 py-1 text-xs text-neutral-500">
                {t('discontinued')}
              </span>
            )}
          </div>

          {/* Ball name — primary focal point */}
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-neutral-100 sm:text-5xl">
            {ball.name}
          </h1>

          {/* Metadata strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {ball.release_year && (
              <span className="font-mono text-sm text-neutral-500">{ball.release_year}</span>
            )}
            {segments.map((seg) => (
              <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
            ))}
            {ball.msrp_usd != null && (
              <span className="text-sm text-neutral-600">
                {t('atLaunch', { price: ball.msrp_usd })}
              </span>
            )}
          </div>

          {/* Intelligence summary */}
          {summaryText && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-500">{summaryText}</p>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
          {/* Left column */}
          <div className="flex flex-col gap-10">
            <Section title={t('sections.technicalSpecs')}>
              <SpecGrid specs={ball.specs} />
            </Section>

            <Section title={t('sections.visualIdentification')}>
              <VisualIdentityCard visual={ball.visual} />
            </Section>

            <Section title={t('sections.similarBalls')}>
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02]"
                      />
                    ))}
                  </div>
                }
              >
                <SimilarBalls
                  versionId={ball.id}
                  segmentIds={segmentIds}
                  compression={ball.specs?.compression ?? null}
                  currentBallSpecs={ball.specs}
                  currentBallSegments={
                    segments.filter(Boolean) as { id: string; slug: string; name: string }[]
                  }
                />
              </Suspense>
            </Section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <ValuationCard
              primarySegment={primarySegment?.slug ?? null}
              valuationResult={valuationResult}
            />

            <DataCompletenessCard input={completenessInput} />

            {/* Brand info */}
            {brand && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                  {t('sections.brand')}
                </p>
                <Link
                  href={`/brands/${brand.slug}`}
                  className="text-sm font-medium text-neutral-200 transition-colors hover:text-white"
                >
                  {brand.name}
                </Link>
                {brand.country && (
                  <p className="mt-0.5 text-xs text-neutral-600">{brand.country}</p>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-neutral-600 underline-offset-2 hover:text-neutral-400 hover:underline"
                  >
                    {brand.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}

            {/* Quick stats */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
                {t('sections.quickFacts')}
              </p>
              <div className="flex flex-col gap-2.5 text-sm">
                {ball.specs?.construction_layers != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{t('specs.construction')}</span>
                    <span className="text-neutral-300">
                      {t('specs.constructionPiece', { layers: ball.specs.construction_layers })}
                    </span>
                  </div>
                )}
                {ball.specs?.compression != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{t('specs.compression')}</span>
                    <span className="font-mono text-neutral-300">{ball.specs.compression}</span>
                  </div>
                )}
                {ball.specs?.cover_material && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{t('specs.cover')}</span>
                    <span className="text-neutral-300">{ball.specs.cover_material}</span>
                  </div>
                )}
                {ball.release_year && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{t('specs.year')}</span>
                    <span className="font-mono text-neutral-300">{ball.release_year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compare link */}
            <Link
              href={`/compare?balls=${ball.slug}`}
              className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center text-xs text-neutral-500 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-neutral-300"
            >
              {t('compareCta')}
            </Link>
          </div>
        </div>

        {/* Feedback */}
        <div className="mt-12 border-t border-white/[0.04] pt-8">
          <FeedbackForm versionId={ball.id} ballName={ball.name} />
        </div>
      </div>
    </RegistryLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600">
        {title}
      </h2>
      {children}
    </section>
  )
}
