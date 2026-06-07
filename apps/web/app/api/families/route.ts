import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SearchQuerySchema } from '@ballatlas/validators'
import { z } from 'zod'

const FamilyQuerySchema = SearchQuerySchema.extend({
  brand_id: z.string().uuid().optional(),
  status: z.enum(['published', 'discontinued', 'draft', 'archived']).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = FamilyQuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    brand_id: searchParams.get('brand_id') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid query parameters' }, { status: 400 })
  }

  const { q, brand_id, status, page, pageSize } = parsed.data
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('ball_families')
    .select('*, brand:brands(id, name, slug)', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (q) query = query.textSearch('search_vector', q, { type: 'plain' })
  if (brand_id) query = query.eq('brand_id', brand_id)
  if (status) query = query.eq('status', status)
  else query = query.in('status', ['published', 'discontinued'])

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/families]', error)
    return NextResponse.json({ data: null, error: 'Failed to fetch families' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, pageSize },
    error: null,
  })
}
