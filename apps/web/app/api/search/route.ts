import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SearchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

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

  // Cross-entity search: query ball_versions with joined family + brand name.
  // The search_vector on ball_versions covers version name (weight A).
  // We augment with a text filter on brand/family name for broader coverage.
  const { data, error, count } = await supabase
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
    .textSearch('search_vector', q, { type: 'plain' })
    .order('release_year', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ data: null, error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, pageSize, query: q },
    error: null,
  })
}
