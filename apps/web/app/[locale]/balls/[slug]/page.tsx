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

import { BallDNACard } from '@/components/registry/BallDNACard'
import { DataCompletenessCard } from '@/components/registry/DataCompletenessCard'
import { FeedbackForm } from '@/components/registry/FeedbackForm'
import { GolfBall } from '@/components/registry/GolfBall'
import { IdentificationConfidenceCard } from '@/components/registry/IdentificationConfidenceCard'
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
  identification_features: Array<{
    feature_type: string
    importance_score: number
  }>
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
        images(review_status),
        identification_features(feature_type, importance_score)
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

  const dnaInput = {
    segmentSlugs: segments.filter(Boolean).map((s) => s!.slug),
    specs: ball.specs,
  }

  const confidenceInput = {
    visual: ball.visual,
    featureTypes: ball.identification_features.map((f) => f.feature_type),
  }

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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav
          className="mb-8 flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--ba-ghost)' }}
        >
          <Link href="/search" className="transition-opacity hover:opacity-70">
            {t('browse')}
          </Link>
          {brand && (
            <>
              <span>/</span>
              <Link href={`/brands/${brand.slug}`} className="transition-opacity hover:opacity-70">
                {brand.name}
              </Link>
            </>
          )}
          {family && (
            <>
              <span>/</span>
              <Link
                href={`/search?q=${encodeURIComponent(family.name)}`}
                className="transition-opacity hover:opacity-70"
              >
                {family.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: 'var(--ba-subtle)' }}>{ball.name}</span>
        </nav>

        {/* Hero grid */}
        <div
          className="mb-10 grid grid-cols-1 gap-8 pb-10 lg:grid-cols-[1fr_auto]"
          style={{ borderBottom: '1px solid var(--ba-line)' }}
        >
          {/* Left: text */}
          <div>
            {/* Brand pill + status */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {brand && (
                <Link
                  href={`/brands/${brand.slug}`}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-150"
                  style={{
                    background: 'var(--ba-paper)',
                    border: '1px solid var(--ba-line-strong)',
                    color: 'var(--ba-subtle)',
                  }}
                >
                  {brand.name}
                </Link>
              )}
              {ball.status === 'discontinued' && (
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: 'var(--ba-paper)',
                    border: '1px solid var(--ba-line)',
                    color: 'var(--ba-ghost)',
                  }}
                >
                  {t('discontinued')}
                </span>
              )}
            </div>

            <h1
              className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: 'var(--ba-ink)' }}
            >
              {ball.name}
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {ball.release_year && (
                <span className="font-mono text-sm" style={{ color: 'var(--ba-subtle)' }}>
                  {ball.release_year}
                </span>
              )}
              {segments.map((seg) => (
                <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
              ))}
              {ball.msrp_usd != null && (
                <span className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
                  {t('atLaunch', { price: ball.msrp_usd })}
                </span>
              )}
            </div>

            {summaryText && (
              <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--ba-subtle)' }}>
                {summaryText}
              </p>
            )}
          </div>

          {/* Right: floating ball */}
          <div className="hidden items-start justify-center lg:flex">
            <GolfBall size="lg" />
          </div>
        </div>

        {/* Ball DNA — full width */}
        <div className="mb-10">
          <Section title="Ball DNA">
            <BallDNACard input={dnaInput} />
          </Section>
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
                        className="h-24 animate-pulse rounded-xl"
                        style={{
                          background: 'var(--ba-surface)',
                          border: '1px solid var(--ba-line)',
                        }}
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
          <div className="flex flex-col gap-4">
            <IdentificationConfidenceCard input={confidenceInput} />

            <ValuationCard
              primarySegment={primarySegment?.slug ?? null}
              valuationResult={valuationResult}
            />

            <DataCompletenessCard input={completenessInput} />

            {/* Brand info */}
            {brand && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--ba-surface)',
                  border: '1px solid var(--ba-line-strong)',
                }}
              >
                <p className="kicker mb-2">{t('sections.brand')}</p>
                <Link
                  href={`/brands/${brand.slug}`}
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--ba-ink)' }}
                >
                  {brand.name}
                </Link>
                {brand.country && (
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--ba-ghost)' }}>
                    {brand.country}
                  </p>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs underline-offset-2 hover:underline"
                    style={{ color: 'var(--ba-ghost)' }}
                  >
                    {brand.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}

            {/* Quick facts */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--ba-surface)',
                border: '1px solid var(--ba-line-strong)',
              }}
            >
              <p className="kicker mb-3">{t('sections.quickFacts')}</p>
              <div className="flex flex-col gap-2.5 text-sm">
                {ball.specs?.construction_layers != null && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ba-subtle)' }}>{t('specs.construction')}</span>
                    <span style={{ color: 'var(--ba-ink)' }}>
                      {t('specs.constructionPiece', { layers: ball.specs.construction_layers })}
                    </span>
                  </div>
                )}
                {ball.specs?.compression != null && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ba-subtle)' }}>{t('specs.compression')}</span>
                    <span className="font-mono" style={{ color: 'var(--ba-ink)' }}>
                      {ball.specs.compression}
                    </span>
                  </div>
                )}
                {ball.specs?.cover_material && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ba-subtle)' }}>{t('specs.cover')}</span>
                    <span style={{ color: 'var(--ba-ink)' }}>{ball.specs.cover_material}</span>
                  </div>
                )}
                {ball.release_year && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--ba-subtle)' }}>{t('specs.year')}</span>
                    <span className="font-mono" style={{ color: 'var(--ba-ink)' }}>
                      {ball.release_year}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Compare CTA */}
            <Link
              href={`/compare?balls=${ball.slug}`}
              className="block rounded-xl p-3 text-center text-xs transition-all duration-150 hover:opacity-80"
              style={{
                background: 'var(--ba-surface)',
                border: '1px solid var(--ba-line-strong)',
                color: 'var(--ba-subtle)',
              }}
            >
              {t('compareCta')}
            </Link>
          </div>
        </div>

        {/* Feedback */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--ba-line)' }}>
          <FeedbackForm versionId={ball.id} ballName={ball.name} />
        </div>
      </div>
    </RegistryLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--ba-line)' }} />
        <h2 className="kicker">{title}</h2>
        <div className="h-px flex-1" style={{ background: 'var(--ba-line)' }} />
      </div>
      {children}
    </section>
  )
}
