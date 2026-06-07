import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SearchQuerySchema } from '@ballatlas/validators'

import { createClient } from '@/lib/supabase/server'

const BallsQuerySchema = SearchQuerySchema.extend({
  brand_id: z.string().uuid().optional(),
  family_id: z.string().uuid().optional(),
  segment: z.string().optional(), // segment slug
  release_year: z.coerce.number().int().min(1900).max(2100).optional(),
  cover: z.string().optional(), // cover_material contains filter
  compression_min: z.coerce.number().int().optional(),
  compression_max: z.coerce.number().int().optional(),
  status: z.enum(['published', 'discontinued', 'draft', 'archived']).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = BallsQuerySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid query parameters' }, { status: 400 })
  }

  const {
    q,
    brand_id,
    family_id,
    release_year,
    cover,
    compression_min,
    compression_max,
    status,
    page,
    pageSize,
  } = parsed.data
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Full version summary with nested family + brand + segment names
  let query = supabase
    .from('ball_versions')
    .select(
      `
      id, name, slug, release_year, msrp_usd, msrp_nok, status,
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
    .order('release_year', { ascending: false })
    .range(from, to)

  if (q) query = query.textSearch('search_vector', q, { type: 'plain' })
  if (release_year) query = query.eq('release_year', release_year)
  if (status) query = query.eq('status', status)
  else query = query.in('status', ['published', 'discontinued'])

  if (family_id) {
    query = query.eq('family_id', family_id)
  }

  // brand_id and segment need subquery-style filters — use a join approach
  if (brand_id) {
    query = query.eq('family.brand_id', brand_id)
  }

  // Compression range filter on joined technical_specs
  if (compression_min != null) {
    query = query.gte('specs.compression', compression_min)
  }
  if (compression_max != null) {
    query = query.lte('specs.compression', compression_max)
  }
  if (cover) {
    query = query.ilike('specs.cover_material', `%${cover}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/balls]', error)
    return NextResponse.json({ data: null, error: 'Failed to fetch balls' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, pageSize },
    error: null,
  })
}
