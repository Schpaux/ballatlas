import type { Metadata } from 'next'
import { Suspense } from 'react'

import { BallCard, type BallCardData } from '@/components/registry/BallCard'
import { FilterPanel } from '@/components/registry/FilterPanel'
import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SearchBar } from '@/components/registry/SearchBar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Browse Golf Balls',
  robots: { index: false },
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

async function searchBalls(params: SearchParams) {
  const { q, brand, segment, year, cover, compression_min, compression_max, page = '1' } = params

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const pageSize = 24
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = await createClient()

    // When filtering by segment, collect matching version IDs first via the
    // version_segments join. This avoids N+1 and works cleanly with pagination.
    let segmentVersionIds: string[] | null = null
    if (segment) {
      const { data: segRows } = await supabase
        .from('version_segments')
        .select('version_id, segment:segments!inner(slug)')
        .eq('segment.slug', segment)
      segmentVersionIds = segRows?.map((r) => r.version_id) ?? []
      // If segment exists but has no versions, return empty immediately
      if (segmentVersionIds.length === 0) {
        return { balls: [], total: 0, pageNum, pageSize, error: null }
      }
    }

    // Alias lookup — find version IDs matching the query as an alias
    let aliasVersionIds: string[] = []
    if (q) {
      const { data: aliasRows } = await supabase
        .from('ball_aliases')
        .select('version_id')
        .ilike('alias', q)
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
          brand:brands(id, name, slug)
        ),
        specs:technical_specs(compression, cover_material, construction_layers),
        version_segments(
          segment:segments(id, name, slug)
        )
        `,
        { count: 'exact' }
      )
      .in('status', ['published', 'discontinued'])
      .order('release_year', { ascending: false })
      .range(from, to)

    if (q) query = query.textSearch('search_vector', q, { type: 'plain' })
    if (year) query = query.eq('release_year', parseInt(year, 10))
    if (cover) query = query.ilike('specs.cover_material', `%${cover}%`)
    if (compression_min) query = query.gte('specs.compression', parseInt(compression_min, 10))
    if (compression_max) query = query.lte('specs.compression', parseInt(compression_max, 10))
    if (brand) query = query.eq('family.brand.slug', brand)
    // Segment filter applied as an IN constraint on pre-collected version IDs
    if (segmentVersionIds !== null) query = query.in('id', segmentVersionIds)

    const { data: ftsBalls, count, error } = await query
    if (error) throw error

    const ftsData = (ftsBalls ?? []) as BallCardData[]

    // Fetch alias-only hits not already in FTS results (page 1 only)
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
              brand:brands(id, name, slug)
            ),
            specs:technical_specs(compression, cover_material, construction_layers),
            version_segments(
              segment:segments(id, name, slug)
            )
            `
          )
          .in('id', missingIds)
          .in('status', ['published', 'discontinued'])
        aliasBalls = (extra ?? []) as BallCardData[]
      }
    }

    const balls = pageNum === 1 ? [...aliasBalls, ...ftsData] : ftsData
    const total = (count ?? 0) + aliasBalls.length

    return { balls, total, pageNum, pageSize, error: null }
  } catch {
    return { balls: [], total: 0, pageNum: 1, pageSize: 24, error: 'Search failed' }
  }
}

async function SearchResults({ params }: { params: SearchParams }) {
  const { balls, total, pageNum, pageSize, error } = await searchBalls(params)
  const { q } = params

  if (error) {
    return (
      <p className="text-sm text-neutral-600">
        Unable to load results — database may not be connected.
      </p>
    )
  }

  if (balls.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-neutral-400">
          {q ? `No results for "${q}"` : 'No balls found with these filters.'}
        </p>
        {q && (
          <p className="mt-2 text-xs text-neutral-600">
            Try a different spelling or browse by segment.
          </p>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <p className="mb-4 text-xs text-neutral-600">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        {q ? ` for "${q}"` : ''}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {balls.map((ball) => (
          <BallCard key={ball.id} ball={ball} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          {pageNum > 1 && (
            <a
              href={buildPageUrl(params, pageNum - 1)}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-neutral-400 transition-colors hover:border-white/[0.14] hover:text-neutral-100"
            >
              ← Previous
            </a>
          )}
          <span className="text-neutral-600">
            Page {pageNum} of {totalPages}
          </span>
          {pageNum < totalPages && (
            <a
              href={buildPageUrl(params, pageNum + 1)}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-neutral-400 transition-colors hover:border-white/[0.14] hover:text-neutral-100"
            >
              Next →
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
          className="h-36 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02]"
        />
      ))}
    </div>
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [brands] = await Promise.all([getBrands()])

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Search bar */}
        <SearchBar
          initialValue={params.q ?? ''}
          placeholder="Search golf balls…"
          className="mb-6"
        />

        <div className="flex gap-8">
          {/* Filters — sidebar on desktop, toggle on mobile */}
          <Suspense fallback={null}>
            <FilterPanel brands={brands} />
          </Suspense>

          {/* Results */}
          <div className="min-w-0 flex-1">
            <Suspense fallback={<ResultsSkeleton />}>
              <SearchResults params={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
