import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { BallCard, type BallCardData } from '@/components/registry/BallCard'
import { FilterPanel } from '@/components/registry/FilterPanel'
import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SearchBar } from '@/components/registry/SearchBar'
import { locales } from '@/i18n/routing'
import { resolveBrandLogoUrlsBatch } from '@/lib/brand-logo'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.search' })
  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: t('title'),
    robots: { index: false },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/search`])),
    },
  }
}

type SearchParams = {
  q?: string
  brand?: string
  segment?: string
  year?: string
  cover?: string
  compression_min?: string
  compression_max?: string
  page?: string
}

async function getBrands() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('brands').select('id, name, slug').order('name')
    return data ?? []
  } catch {
    return []
  }
}

function buildPrefixTsQuery(q: string): string {
  const words = q
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  return words.map((w, i) => (i === words.length - 1 ? `${w}:*` : w)).join(' & ')
}

async function searchBalls(params: SearchParams) {
  const { q, brand, segment, year, cover, compression_min, compression_max, page = '1' } = params

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const pageSize = 24
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()

    // Segment filter: pre-fetch matching version IDs
    let segmentVersionIds: string[] | null = null
    if (segment) {
      const { data: segRows } = await supabase
        .from('version_segments')
        .select('version_id, segment:segments!inner(slug)')
        .eq('segment.slug', segment)
      segmentVersionIds = segRows?.map((r) => r.version_id) ?? []
      if (segmentVersionIds.length === 0) {
        return { balls: [], total: 0, pageNum, pageSize, error: null }
      }
    }

    // Brand filter: pre-fetch matching family IDs (filtering on embedded resources
    // without !inner doesn't exclude non-matching parent rows in Supabase)
    let brandFamilyIds: string[] | null = null
    if (brand) {
      const { data: brandRow } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', brand)
        .single()
      if (!brandRow) {
        return { balls: [], total: 0, pageNum, pageSize, error: null }
      }
      const { data: familyRows } = await supabase
        .from('ball_families')
        .select('id')
        .eq('brand_id', brandRow.id)
      brandFamilyIds = familyRows?.map((r) => r.id) ?? []
      if (brandFamilyIds.length === 0) {
        return { balls: [], total: 0, pageNum, pageSize, error: null }
      }
    }

    // Specs filters: pre-fetch matching version IDs from technical_specs
    let specsVersionIds: string[] | null = null
    if (cover || compression_min || compression_max) {
      let specsQuery = supabase.from('technical_specs').select('version_id')
      if (cover) specsQuery = specsQuery.ilike('cover_material', `%${cover}%`)
      if (compression_min) specsQuery = specsQuery.gte('compression', parseInt(compression_min, 10))
      if (compression_max) specsQuery = specsQuery.lte('compression', parseInt(compression_max, 10))
      const { data: specsRows } = await specsQuery
      specsVersionIds = specsRows?.map((r) => r.version_id) ?? []
      if (specsVersionIds.length === 0) {
        return { balls: [], total: 0, pageNum, pageSize, error: null }
      }
    }

    let aliasVersionIds: string[] = []
    if (q) {
      const { data: aliasRows } = await supabase
        .from('ball_aliases')
        .select('version_id')
        .ilike('alias', `%${q}%`)
        .limit(20)
      aliasVersionIds = aliasRows?.map((r) => r.version_id) ?? []
    }

    let query = supabase
      .from('ball_versions')
      .select(
        `
        id, name, slug, release_year, msrp_usd, status,
        family:ball_families(
          id, name, slug,
          brand:brands(id, name, slug, logo_url)
        ),
        specs:technical_specs(compression, cover_material, construction_layers),
        version_segments(
          segment:segments(id, name, slug)
        ),
        images(image_type, storage_path, source_url, image_quality_score, alt_text)
        `,
        { count: 'exact' }
      )
      .in('status', ['published', 'discontinued'])
      .order('release_year', { ascending: false })
      .range(from, to)

    if (q) {
      const tsQuery = buildPrefixTsQuery(q)
      if (tsQuery) query = query.filter('search_vector', 'fts', tsQuery)
    }
    if (year) query = query.eq('release_year', parseInt(year, 10))
    if (brandFamilyIds !== null) query = query.in('family_id', brandFamilyIds)
    if (specsVersionIds !== null) query = query.in('id', specsVersionIds)
    if (segmentVersionIds !== null) query = query.in('id', segmentVersionIds)

    const { data: ftsBalls, count, error } = await query
    if (error) throw error

    const ftsData = (ftsBalls ?? []) as BallCardData[]

    let aliasBalls: BallCardData[] = []
    if (pageNum === 1 && aliasVersionIds.length > 0) {
      const ftsIds = new Set(ftsData.map((b) => b.id))
      const missingIds = aliasVersionIds.filter((id) => !ftsIds.has(id))
      if (missingIds.length > 0) {
        const { data: extra } = await supabase
          .from('ball_versions')
          .select(
            `
            id, name, slug, release_year, msrp_usd, status,
            family:ball_families(
              id, name, slug,
              brand:brands(id, name, slug, logo_url)
            ),
            specs:technical_specs(compression, cover_material, construction_layers),
            version_segments(
              segment:segments(id, name, slug)
            ),
            images(image_type, storage_path, source_url, image_quality_score, alt_text)
            `
          )
          .in('id', missingIds)
          .in('status', ['published', 'discontinued'])
        aliasBalls = (extra ?? []) as BallCardData[]
      }
    }

    const balls = pageNum === 1 ? [...aliasBalls, ...ftsData] : ftsData
    const total = (count ?? 0) + aliasBalls.length

    // Batch-fetch brand logos in a single query
    const brandIds = [
      ...new Set(
        balls
          .map((b) => (b.family?.brand as { id: string } | undefined)?.id)
          .filter(Boolean) as string[]
      ),
    ]
    const logoMap = await resolveBrandLogoUrlsBatch(supabase, brandIds)

    const enrichedBalls = balls.map((ball) => {
      const brandId = (ball.family?.brand as { id: string } | undefined)?.id
      const logoUrl = brandId ? (logoMap.get(brandId) ?? null) : null
      return {
        ...ball,
        family: ball.family ? { ...ball.family, brand: { ...ball.family.brand, logoUrl } } : null,
      }
    })

    return { balls: enrichedBalls, total, pageNum, pageSize, error: null }
  } catch {
    return { balls: [], total: 0, pageNum: 1, pageSize: 24, error: 'Search failed' }
  }
}

async function SearchResults({ params, locale }: { params: SearchParams; locale: string }) {
  const { balls, total, pageNum, pageSize, error } = await searchBalls(params)
  const { q } = params
  const t = await getTranslations({ locale, namespace: 'search' })

  if (error) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        Unable to load results — database may not be connected.
      </p>
    )
  }

  if (balls.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm" style={{ color: 'var(--ba-subtle)' }}>
          {q ? t('noResults', { query: q }) : t('noFilterResults')}
        </p>
        {q && (
          <p className="mt-2 text-xs" style={{ color: 'var(--ba-ghost)' }}>
            {t('noResultsHint')}
          </p>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <p className="mb-5 text-xs" style={{ color: 'var(--ba-ghost)' }}>
        {q ? t('resultsFor', { count: total, query: q }) : t('results', { count: total })}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {balls.map((ball) => (
          <BallCard key={ball.id} ball={ball} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          {pageNum > 1 && (
            <a
              href={buildPageUrl(params, pageNum - 1)}
              className="rounded-full px-4 py-2 transition-colors"
              style={{
                border: '1px solid var(--ba-line-strong)',
                color: 'var(--ba-subtle)',
                background: 'var(--ba-surface)',
              }}
            >
              {t('previous')}
            </a>
          )}
          <span className="text-xs" style={{ color: 'var(--ba-ghost)' }}>
            {t('pageOf', { current: pageNum, total: totalPages })}
          </span>
          {pageNum < totalPages && (
            <a
              href={buildPageUrl(params, pageNum + 1)}
              className="rounded-full px-4 py-2 transition-colors"
              style={{
                border: '1px solid var(--ba-line-strong)',
                color: 'var(--ba-subtle)',
                background: 'var(--ba-surface)',
              }}
            >
              {t('next')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function buildPageUrl(params: SearchParams, page: number) {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.brand) p.set('brand', params.brand)
  if (params.segment) p.set('segment', params.segment)
  if (params.year) p.set('year', params.year)
  if (params.cover) p.set('cover', params.cover)
  if (params.compression_min) p.set('compression_min', params.compression_min)
  if (params.compression_max) p.set('compression_max', params.compression_max)
  p.set('page', String(page))
  return `/search?${p.toString()}`
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-xl"
          style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line)' }}
        />
      ))}
    </div>
  )
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  const sp = await searchParams
  const [brands, t] = await Promise.all([
    getBrands(),
    getTranslations({ locale, namespace: 'search' }),
  ])

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Search bar */}
        <SearchBar initialValue={sp.q ?? ''} placeholder={t('placeholder')} className="mb-7" />

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ba-ink)' }}>
            {t('title')}
          </h1>
        </div>

        <div className="flex gap-8">
          <Suspense fallback={null}>
            <FilterPanel brands={brands} />
          </Suspense>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<ResultsSkeleton />}>
              <SearchResults params={sp} locale={locale} />
            </Suspense>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
