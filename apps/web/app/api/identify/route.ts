import { NextResponse } from 'next/server'
import { z } from 'zod'

import { identifyBall, type IdentificationCandidate } from '@ballatlas/golf-data'

import { createClient } from '@/lib/supabase/server'

const ObservedFeaturesSchema = z.object({
  brand: z.string().min(1).max(100).optional(),
  logoText: z.string().min(1).max(150).optional(),
  alignmentMarking: z.string().min(1).max(200).optional(),
  numberColor: z.string().min(1).max(50).optional(),
  logoStyle: z.string().min(1).max(200).optional(),
  playNumber: z.string().min(1).max(10).optional(),
  coverFinish: z.enum(['glossy', 'matte', 'satin']).optional(),
  primaryColor: z.string().min(1).max(50).optional(),
  visualPattern: z.string().min(1).max(200).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ObservedFeaturesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    )
  }

  const observed = parsed.data

  // At least one feature must be provided
  const hasAnyFeature = Object.values(observed).some((v) => v !== undefined)
  if (!hasAnyFeature) {
    return NextResponse.json(
      { data: null, error: 'At least one feature must be provided' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: versions, error } = await supabase
    .from('ball_versions')
    .select(
      `
      id, slug, name,
      family:ball_families(
        brand:brands(name, slug)
      ),
      features:identification_features(feature_type, feature_value, importance_score),
      visual:visual_signatures(
        primary_color, finish, logo_style, logo_text,
        alignment_marking, number_style, number_color, special_markings
      )
    `
    )
    .in('status', ['published', 'discontinued'])

  if (error) {
    console.error('[POST /api/identify] DB error:', error)
    return NextResponse.json({ data: null, error: 'Identification failed' }, { status: 500 })
  }

  const candidates: IdentificationCandidate[] = (versions ?? []).map((v) => {
    const family = Array.isArray(v.family) ? v.family[0] : v.family
    const brand = family
      ? Array.isArray((family as { brand: unknown }).brand)
        ? ((family as { brand: unknown[] }).brand[0] as { name: string; slug: string } | undefined)
        : ((family as { brand: { name: string; slug: string } | null }).brand ?? undefined)
      : undefined
    const visual = Array.isArray(v.visual) ? v.visual[0] : v.visual

    return {
      versionId: v.id,
      versionSlug: v.slug,
      versionName: v.name,
      brandName: brand?.name ?? '',
      brandSlug: brand?.slug ?? '',
      features: (v.features ?? []).map((f) => ({
        featureType: f.feature_type,
        featureValue: f.feature_value,
        importanceScore: f.importance_score,
      })),
      visual: visual
        ? {
            primaryColor: visual.primary_color ?? null,
            finish: visual.finish ?? null,
            logoStyle: visual.logo_style ?? null,
            logoText: visual.logo_text ?? null,
            alignmentMarking: visual.alignment_marking ?? null,
            numberStyle: visual.number_style ?? null,
            numberColor: visual.number_color ?? null,
            specialMarkings: visual.special_markings ?? null,
          }
        : null,
    }
  })

  const results = identifyBall(observed, candidates)

  return NextResponse.json({ data: results, error: null })
}
