// Identification Confidence System
// Per-ball measure of visual identification reliability.
//
// Answers: "Given the feature data we have on this specific ball, how reliably
// can it be visually identified?"
//
// This is distinct from IdentificationCoverageSummary, which measures
// coverage across the entire database. This function scores a single version.
//
// Scoring model: additive points per documented feature type.
// Features with higher discriminative power (brand text, model text) earn more
// points than secondary features (number style, extra feature types).

// ─── Input ────────────────────────────────────────────────────────────────────

export type IdentificationConfidenceInput = {
  visual: {
    logo_text: string | null
    logo_style: string | null
    alignment_marking: string | null
    number_color: string | null
    number_style: string | null
    special_markings: string | null
    primary_color: string | null
    finish: string | null
  } | null
  /** feature_type values from identification_features for this version */
  featureTypes: string[]
}

// ─── Output ───────────────────────────────────────────────────────────────────

export type IdentificationConfidenceRating =
  | 'exceptional' // 90–100
  | 'excellent' // 75–89
  | 'good' // 55–74
  | 'limited' // 35–54
  | 'insufficient' // 0–34

export const CONFIDENCE_RATING_LABELS: Record<IdentificationConfidenceRating, string> = {
  exceptional: 'Exceptional',
  excellent: 'Excellent',
  good: 'Good',
  limited: 'Limited',
  insufficient: 'Insufficient',
}

export type IdentificationConfidenceResult = {
  score: number
  rating: IdentificationConfidenceRating
  /** One-to-two sentence plain-English explanation */
  explanation: string
  /** Factors that contributed positively to the score */
  strengths: string[]
  /** Feature types that are missing and would improve the score */
  gaps: string[]
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function computeIdentificationConfidence(
  input: IdentificationConfidenceInput
): IdentificationConfidenceResult {
  const { visual, featureTypes } = input
  const ft = new Set(featureTypes)

  let score = 0
  const strengths: string[] = []
  const gaps: string[] = []

  // ── Brand text (+22) — uniquely identifies manufacturer ───────────────────
  if (ft.has('brand_text')) {
    score += 22
    strengths.push('Brand text feature')
  } else {
    gaps.push('Brand text')
  }

  // ── Model text (+20) — identifies model within brand ──────────────────────
  if (ft.has('model_text')) {
    score += 20
    strengths.push('Model text feature')
  } else {
    gaps.push('Model text')
  }

  // ── Alignment marking (+15) — often highly distinctive ────────────────────
  const hasAlignmentFeature = ft.has('alignment_marking')
  const alignmentVisual = visual?.alignment_marking ?? null
  const hasAlignmentVisual = alignmentVisual != null
  if (hasAlignmentFeature || hasAlignmentVisual) {
    score += 15
    const isDistinctive =
      alignmentVisual != null && !['none', 'no', 'n/a', '-'].includes(alignmentVisual.toLowerCase())
    if (isDistinctive) {
      strengths.push(`Distinct alignment aid`)
    }
  } else {
    gaps.push('Alignment marking')
  }

  // ── Number color (+10) — differentiates many models ───────────────────────
  const hasNumberColorFeature = ft.has('number_color')
  const numberColorVisual = visual?.number_color ?? null
  if (hasNumberColorFeature || numberColorVisual != null) {
    score += 10
    if (numberColorVisual && numberColorVisual.toLowerCase() !== 'black') {
      strengths.push(`Distinctive number color (${numberColorVisual})`)
    }
  } else {
    gaps.push('Number color')
  }

  // ── Logo style (+10) — brand visual identity ──────────────────────────────
  const hasLogoStyle = visual?.logo_style != null
  const hasLogoFeature = ft.has('logo')
  if (hasLogoStyle || hasLogoFeature) {
    score += 10
    strengths.push('Logo style documented')
  } else {
    gaps.push('Logo style')
  }

  // ── Special markings (+8) — Truvis, unique patterns, etc. ─────────────────
  if (visual?.special_markings != null) {
    score += 8
    strengths.push(`Unique visual markings`)
  }

  // ── Number style (+6) — typography style of play number ───────────────────
  if (visual?.number_style != null) {
    score += 6
  }

  // ── Extra feature types (+3 each, max +9) ─────────────────────────────────
  const coreFt = new Set(['brand_text', 'model_text', 'alignment_marking', 'number_color', 'logo'])
  const extraCount = [...ft].filter((t) => !coreFt.has(t)).length
  score += Math.min(extraCount * 3, 9)

  score = Math.max(0, Math.min(100, score))

  const rating = ratingFromScore(score)
  const explanation = buildExplanation(rating, strengths, gaps)

  return { score, rating, explanation, strengths, gaps }
}

function ratingFromScore(score: number): IdentificationConfidenceRating {
  if (score >= 90) return 'exceptional'
  if (score >= 75) return 'excellent'
  if (score >= 55) return 'good'
  if (score >= 35) return 'limited'
  return 'insufficient'
}

function buildExplanation(
  rating: IdentificationConfidenceRating,
  strengths: string[],
  gaps: string[]
): string {
  if (rating === 'exceptional' || rating === 'excellent') {
    const top = strengths
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('. ')
    return `${top}. High visual identification reliability.`
  }

  if (rating === 'good') {
    const primary = strengths[0]
      ? strengths[0].charAt(0).toUpperCase() + strengths[0].slice(1)
      : 'Some features documented'
    const gapNote = gaps[0] ? ` ${gaps[0]} data would improve accuracy.` : ''
    return `${primary}.${gapNote}`
  }

  if (rating === 'limited') {
    const missing = gaps.slice(0, 2).join(' and ')
    return `Identification data is incomplete. Adding ${missing} would significantly improve reliability.`
  }

  return 'Insufficient visual feature data. This ball cannot be reliably identified from visual features alone.'
}
