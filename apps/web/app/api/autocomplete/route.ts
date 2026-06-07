import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export type AutocompleteSuggestion = {
  type: 'brand' | 'family' | 'version'
  slug: string
  name: string
  href: string
  meta?: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const supabase = await createClient()
    const pattern = `%${q}%`

    const [{ data: versions }, { data: brands }, { data: families }] = await Promise.all([
      supabase
        .from('ball_versions')
        .select('slug, name, family:ball_families!inner(slug, brand:brands!inner(name, slug))')
        .ilike('name', pattern)
        .eq('status', 'published')
        .limit(5),
      supabase.from('brands').select('slug, name').ilike('name', pattern).limit(3),
      supabase
        .from('ball_families')
        .select('slug, name, brand:brands!inner(name, slug)')
        .ilike('name', pattern)
        .limit(3),
    ])

    const suggestions: AutocompleteSuggestion[] = []

    for (const b of brands ?? []) {
      suggestions.push({
        type: 'brand',
        slug: b.slug,
        name: b.name,
        href: `/brands/${b.slug}`,
      })
    }

    for (const f of families ?? []) {
      const brand = Array.isArray(f.brand) ? f.brand[0] : f.brand
      suggestions.push({
        type: 'family',
        slug: f.slug,
        name: f.name,
        href: `/search?q=${encodeURIComponent(f.name)}`,
        meta: typeof brand === 'object' && brand !== null ? brand.name : undefined,
      })
    }

    for (const v of versions ?? []) {
      const family = Array.isArray(v.family) ? v.family[0] : v.family
      const brand =
        family && typeof family === 'object' && 'brand' in family
          ? Array.isArray(family.brand)
            ? family.brand[0]
            : family.brand
          : null
      suggestions.push({
        type: 'version',
        slug: v.slug,
        name: v.name,
        href: `/balls/${v.slug}`,
        meta: typeof brand === 'object' && brand !== null ? brand.name : undefined,
      })
    }

    // Deduplicate by href, keep first occurrence
    const seen = new Set<string>()
    const unique = suggestions.filter((s) => {
      if (seen.has(s.href)) return false
      seen.add(s.href)
      return true
    })

    return NextResponse.json(unique.slice(0, 8))
  } catch {
    return NextResponse.json([])
  }
}
