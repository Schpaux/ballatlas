import { NextResponse } from 'next/server'

import { SearchQuerySchema } from '@ballatlas/validators'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = SearchQuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: 'Invalid query parameters' }, { status: 400 })
  }

  const { q, page, pageSize } = parsed.data
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('brands')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (q) {
    query = query.textSearch('search_vector', q, { type: 'plain' })
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/brands]', error)
    return NextResponse.json({ data: null, error: 'Failed to fetch brands' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, pageSize },
    error: null,
  })
}
