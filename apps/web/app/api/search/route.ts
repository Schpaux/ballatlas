import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

const BALL_SELECT = `
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = SearchSchema.safeParse({
    q: searchParams.get('q'),
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: 'Missing or invalid search query' },
      { status: 400 }
    )
  }

  const { q, page, pageSize } = parsed.data
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Run FTS and alias lookup in parallel
  const [ftsResult, aliasResult] = await Promise.all([
    supabase
      .from('ball_versions')
      .select(BALL_SELECT, { count: 'exact' })
      .in('status', ['published', 'discontinued'])
      .textSearch('search_vector', q, { type: 'plain' })
      .order('release_year', { ascending: false })
      .range(from, to),

    supabase.from('ball_aliases').select('version_id').ilike('alias', q).limit(20),
  ])

  if (ftsResult.error) {
    console.error('[GET /api/search] FTS error:', ftsResult.error)
    return NextResponse.json({ data: null, error: 'Search failed' }, { status: 500 })
  }

  const ftsData = ftsResult.data ?? []
  const ftsIds = new Set(ftsData.map((b) => b.id))

  // Fetch alias-matched versions that FTS didn't catch
  const aliasVersionIds = (aliasResult.data ?? [])
    .map((a) => a.version_id)
    .filter((id) => !ftsIds.has(id))

  let aliasBalls: typeof ftsData = []
  if (aliasVersionIds.length > 0) {
    const { data } = await supabase
      .from('ball_versions')
      .select(BALL_SELECT)
      .in('id', aliasVersionIds)
      .in('status', ['published', 'discontinued'])

    aliasBalls = (data ?? []) as typeof ftsData
  }

  // Alias matches float to top of page 1
  const data = page === 1 ? [...aliasBalls, ...ftsData] : ftsData

  return NextResponse.json({
    data,
    meta: {
      total: (ftsResult.count ?? 0) + aliasBalls.length,
      page,
      pageSize,
      query: q,
      aliasMatches: aliasBalls.length,
    },
    error: null,
  })
}
