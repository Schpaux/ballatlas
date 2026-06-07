import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch full version detail — all related entities
  const { data, error } = await supabase
    .from('ball_versions')
    .select(
      `
      *,
      family:ball_families(
        *,
        brand:brands(*)
      ),
      specs:technical_specs(*),
      visual:visual_signatures(*),
      identification_features(*),
      images(*),
      version_segments(
        segment:segments(*)
      ),
      price_observations(
        *,
        source:sources(id, name, url, reliability_score)
      )
      `
    )
    // Accept both UUID and slug as the id parameter
    .or(`id.eq.${id},slug.eq.${id}`)
    .in('status', ['published', 'discontinued'])
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return NextResponse.json({ data: null, error: 'Ball not found' }, { status: 404 })
    }
    console.error('[GET /api/balls/[id]]', error)
    return NextResponse.json({ data: null, error: 'Failed to fetch ball' }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
