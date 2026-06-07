import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SegmentBadge } from '@/components/registry/SegmentBadge'
import { SimilarBalls } from '@/components/registry/SimilarBalls'
import { SpecGrid } from '@/components/registry/SpecGrid'
import { ValuationCard, type ValuationCardProps } from '@/components/registry/ValuationCard'
import { VisualIdentityCard } from '@/components/registry/VisualIdentityCard'
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
    source: { id: string; name: string; url: string | null; reliability_score: number } | null
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
          condition, price, currency, observed_at,
          source:sources(id, name, url, reliability_score)
        )
        `
      )
      .or(`id.eq.${slug},slug.eq.${slug}`)
      .in('status', ['published', 'discontinued'])
      .single()

    if (error || !data) return null
    return data as unknown as BallDetail
  } catch {
    return null
  }
}

async function getValuationProfile(
  primarySegmentSlug: string | null
): Promise<ValuationCardProps['valuationProfile']> {
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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ball = await getBall(slug)
  if (!ball) return { title: 'Ball Not Found' }

  const brand = ball.family?.brand.name
  const description = [
    brand && `By ${brand}.`,
    ball.specs?.compression != null && `Compression ${ball.specs.compression}.`,
    ball.specs?.cover_material && `${ball.specs.cover_material} cover.`,
    ball.release_year && `Released ${ball.release_year}.`,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    title: ball.name,
    description: description || `${ball.name} golf ball — BallAtlas registry.`,
    openGraph: {
      title: `${ball.name} | BallAtlas`,
      description,
    },
  }
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-600">
        {title}
      </h2>
      {children}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BallDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ball = await getBall(slug)

  if (!ball) notFound()

  const brand = ball.family?.brand
  const family = ball.family
  const segments = ball.version_segments.map((vs) => vs.segment).filter(Boolean)
  const primarySegment = segments[0] ?? null

  const valuationProfile = await getValuationProfile(primarySegment?.slug ?? null)

  const segmentIds = segments.map((s) => s!.id)

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-600">
          <a href="/search" className="transition-colors hover:text-neutral-400">
            Browse
          </a>
          {brand && (
            <>
              <span>/</span>
              <a
                href={`/search?brand=${brand.slug}`}
                className="transition-colors hover:text-neutral-400"
              >
                {brand.name}
              </a>
            </>
          )}
          {family && (
            <>
              <span>/</span>
              <a
                href={`/search?q=${encodeURIComponent(family.name)}`}
                className="transition-colors hover:text-neutral-400"
              >
                {family.name}
              </a>
            </>
          )}
          <span>/</span>
          <span className="text-neutral-500">{ball.name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            {brand && <span className="text-sm font-medium text-neutral-500">{brand.name}</span>}
            {ball.status === 'discontinued' && (
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                Discontinued
              </span>
            )}
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
            {ball.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {ball.release_year && (
              <span className="font-mono text-sm text-neutral-500">{ball.release_year}</span>
            )}
            {segments.map((seg) => (
              <SegmentBadge key={seg!.id} slug={seg!.slug} name={seg!.name} />
            ))}
            {ball.msrp_usd != null && (
              <span className="text-sm text-neutral-600">${ball.msrp_usd}/dz at launch</span>
            )}
          </div>

          {family?.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500">
              {family.description}
            </p>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
          {/* Left column */}
          <div className="flex flex-col gap-10">
            <Section title="Technical Specifications">
              <SpecGrid specs={ball.specs} />
            </Section>

            <Section title="Visual Identification">
              <VisualIdentityCard visual={ball.visual} />
            </Section>

            {/* Similar balls */}
            <Section title="Similar Balls">
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
                />
              </Suspense>
            </Section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Valuation */}
            <ValuationCard
              primarySegment={primarySegment?.slug ?? null}
              releaseYear={ball.release_year}
              priceObservations={ball.price_observations}
              valuationProfile={valuationProfile}
            />

            {/* Brand info */}
            {brand && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-600">
                  Brand
                </p>
                <p className="text-sm font-medium text-neutral-200">{brand.name}</p>
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
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-600">
                Quick Facts
              </p>
              <div className="flex flex-col gap-2 text-sm">
                {ball.specs?.construction_layers != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Construction</span>
                    <span className="text-neutral-300">{ball.specs.construction_layers}-piece</span>
                  </div>
                )}
                {ball.specs?.compression != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Compression</span>
                    <span className="text-neutral-300">{ball.specs.compression}</span>
                  </div>
                )}
                {ball.specs?.cover_material && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Cover</span>
                    <span className="text-neutral-300">{ball.specs.cover_material}</span>
                  </div>
                )}
                {ball.release_year && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Year</span>
                    <span className="font-mono text-neutral-300">{ball.release_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
