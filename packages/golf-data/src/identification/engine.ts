import {
  DEFAULT_IDENTIFICATION_WEIGHTS,
  IDENTIFICATION_CONFIDENCE_THRESHOLD,
  IDENTIFICATION_MAX_RESULTS,
  type IdentificationWeights,
} from './config'

// ─── Input types ──────────────────────────────────────────────────────────────

/**
 * Features observed about an unknown golf ball.
 * All fields are optional — the engine scores with whatever is provided.
 */
export type ObservedFeatures = {
  /** Brand name, e.g. "Titleist", "Callaway", "TaylorMade" */
  brand?: string
  /** Model text printed on ball, e.g. "Pro V1", "Chrome Soft", "TP5" */
  logoText?: string
  /** Alignment aid type, e.g. "Triple Track", "single line", "arrow", "none" */
  alignmentMarking?: string
  /** Color of the play number, e.g. "black", "red", "gold", "white" */
  numberColor?: string
  /** Visual style of the brand logo, e.g. "Titleist script", "Callaway V" */
  logoStyle?: string
  /** The play number itself, e.g. "1", "2", "3", "4" */
  playNumber?: string
  /** Ball finish type: "glossy" | "matte" | "satin" */
  coverFinish?: string
  /** Dominant ball color, e.g. "white", "yellow", "orange", "pink" */
  primaryColor?: string
  /** Distinctive surface pattern, e.g. "Truvis hexagonal", "camo", "marble" */
  visualPattern?: string
}

/**
 * A ball version candidate pre-loaded from the database.
 * The Next.js layer loads these; the engine is a pure function over them.
 */
export type IdentificationCandidate = {
  versionId: string
  versionSlug: string
  versionName: string
  brandName: string
  brandSlug: string
  features: Array<{
    featureType: string
    featureValue: string
    importanceScore: number
  }>
  visual: {
    primaryColor: string | null
    finish: string | null
    logoStyle: string | null
    logoText: string | null
    alignmentMarking: string | null
    numberStyle: string | null
    numberColor: string | null
    specialMarkings: string | null
  } | null
}

// ─── Output types ─────────────────────────────────────────────────────────────

export type MatchedFeature = {
  featureCategory: string
  observed: string
  matched: string
  points: number
}

export type IdentificationResult = {
  versionId: string
  versionSlug: string
  versionName: string
  brandName: string
  brandSlug: string
  /** 0–100, evidence-based confidence */
  confidence: number
  /** Raw points earned before normalization */
  rawScore: number
  matchedFeatures: MatchedFeature[]
  /** Feature categories the user did not provide (could improve results) */
  missingFeatures: string[]
  /** One-sentence plain-English explanation of why this candidate ranked */
  explanation: string
}

// ─── Matching helpers ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function textMatches(observed: string, candidate: string): boolean {
  const obs = normalize(observed)
  const cand = normalize(candidate)
  return cand.includes(obs) || obs.includes(cand)
}

function exactMatches(observed: string, candidate: string): boolean {
  return normalize(observed) === normalize(candidate)
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function identifyBall(
  observed: ObservedFeatures,
  candidates: IdentificationCandidate[],
  weights: IdentificationWeights = DEFAULT_IDENTIFICATION_WEIGHTS,
  confidenceThreshold = IDENTIFICATION_CONFIDENCE_THRESHOLD,
  maxResults = IDENTIFICATION_MAX_RESULTS
): IdentificationResult[] {
  const totalWeight =
    weights.brandMatch +
    weights.logoText +
    weights.alignmentMarking +
    weights.numberColor +
    weights.logoStyle +
    weights.playNumber +
    weights.otherVisual

  const results: IdentificationResult[] = []

  for (const candidate of candidates) {
    let rawScore = 0
    const matchedFeatures: MatchedFeature[] = []

    // Helper: find feature values by type in identification_features
    const getFeatureValues = (type: string) =>
      candidate.features.filter((f) => f.featureType === type).map((f) => f.featureValue)

    // ── Brand match (40 pts) ────────────────────────────────────────────────
    if (observed.brand) {
      const brandFeatures = getFeatureValues('brand_text')
      // Also check brandName directly
      const brandCandidates = [...brandFeatures, candidate.brandName]
      const matched = brandCandidates.find((v) => textMatches(observed.brand!, v))
      if (matched) {
        rawScore += weights.brandMatch
        matchedFeatures.push({
          featureCategory: 'Brand',
          observed: observed.brand,
          matched,
          points: weights.brandMatch,
        })
      }
    }

    // ── Logo text / model text match (20 pts) ───────────────────────────────
    if (observed.logoText) {
      const modelFeatures = getFeatureValues('model_text')
      // Also check visual logoText
      const logoTextCandidates = [
        ...modelFeatures,
        ...(candidate.visual?.logoText ? [candidate.visual.logoText] : []),
      ]
      const matched = logoTextCandidates.find((v) => textMatches(observed.logoText!, v))
      if (matched) {
        rawScore += weights.logoText
        matchedFeatures.push({
          featureCategory: 'Logo Text',
          observed: observed.logoText,
          matched,
          points: weights.logoText,
        })
      }
    }

    // ── Alignment marking (15 pts) ──────────────────────────────────────────
    if (observed.alignmentMarking) {
      const alignFeatures = getFeatureValues('alignment_marking')
      const alignCandidates = [
        ...alignFeatures,
        ...(candidate.visual?.alignmentMarking ? [candidate.visual.alignmentMarking] : []),
      ]
      const matched = alignCandidates.find((v) => textMatches(observed.alignmentMarking!, v))
      if (matched) {
        rawScore += weights.alignmentMarking
        matchedFeatures.push({
          featureCategory: 'Alignment',
          observed: observed.alignmentMarking,
          matched,
          points: weights.alignmentMarking,
        })
      }
    }

    // ── Number color (10 pts) ───────────────────────────────────────────────
    if (observed.numberColor) {
      const numColorFeatures = getFeatureValues('number_color')
      const numColorCandidates = [
        ...numColorFeatures,
        ...(candidate.visual?.numberColor ? [candidate.visual.numberColor] : []),
      ]
      const matched = numColorCandidates.find((v) => exactMatches(observed.numberColor!, v))
      if (matched) {
        rawScore += weights.numberColor
        matchedFeatures.push({
          featureCategory: 'Number Color',
          observed: observed.numberColor,
          matched,
          points: weights.numberColor,
        })
      }
    }

    // ── Logo style (5 pts) ──────────────────────────────────────────────────
    if (observed.logoStyle) {
      const logoFeatures = getFeatureValues('logo')
      const logoCandidates = [
        ...logoFeatures,
        ...(candidate.visual?.logoStyle ? [candidate.visual.logoStyle] : []),
      ]
      const matched = logoCandidates.find((v) => textMatches(observed.logoStyle!, v))
      if (matched) {
        rawScore += weights.logoStyle
        matchedFeatures.push({
          featureCategory: 'Logo Style',
          observed: observed.logoStyle,
          matched,
          points: weights.logoStyle,
        })
      }
    }

    // ── Play number (5 pts) ─────────────────────────────────────────────────
    if (observed.playNumber) {
      const playNumFeatures = getFeatureValues('play_number')
      const matched = playNumFeatures.find((v) => exactMatches(observed.playNumber!, v))
      if (matched) {
        rawScore += weights.playNumber
        matchedFeatures.push({
          featureCategory: 'Play Number',
          observed: observed.playNumber,
          matched,
          points: weights.playNumber,
        })
      }
    }

    // ── Other visual features (5 pts total, split across sub-features) ──────
    let otherVisualEarned = 0

    if (observed.primaryColor) {
      const colorFeatures = getFeatureValues('color')
      const colorCandidates = [
        ...colorFeatures,
        ...(candidate.visual?.primaryColor ? [candidate.visual.primaryColor] : []),
      ]
      const matched = colorCandidates.find((v) => exactMatches(observed.primaryColor!, v))
      if (matched && otherVisualEarned === 0) {
        otherVisualEarned = weights.otherVisual
        matchedFeatures.push({
          featureCategory: 'Color',
          observed: observed.primaryColor,
          matched,
          points: weights.otherVisual,
        })
      }
    }

    if (observed.coverFinish && otherVisualEarned === 0) {
      const finishFeatures = getFeatureValues('finish')
      const finishCandidates = [
        ...finishFeatures,
        ...(candidate.visual?.finish ? [candidate.visual.finish] : []),
      ]
      const matched = finishCandidates.find((v) => exactMatches(observed.coverFinish!, v))
      if (matched) {
        otherVisualEarned = weights.otherVisual
        matchedFeatures.push({
          featureCategory: 'Finish',
          observed: observed.coverFinish,
          matched,
          points: weights.otherVisual,
        })
      }
    }

    if (observed.visualPattern && otherVisualEarned === 0) {
      const patternFeatures = [
        ...getFeatureValues('visual_pattern'),
        ...getFeatureValues('special_marking'),
        ...(candidate.visual?.specialMarkings ? [candidate.visual.specialMarkings] : []),
      ]
      const matched = patternFeatures.find((v) => textMatches(observed.visualPattern!, v))
      if (matched) {
        otherVisualEarned = weights.otherVisual
        matchedFeatures.push({
          featureCategory: 'Visual Pattern',
          observed: observed.visualPattern,
          matched,
          points: weights.otherVisual,
        })
      }
    }

    rawScore += otherVisualEarned

    // ── Confidence ────────────────────────────────────────────────────────────
    const confidence = totalWeight > 0 ? Math.round((rawScore / totalWeight) * 100) : 0

    if (confidence < confidenceThreshold) continue

    // ── Missing features ──────────────────────────────────────────────────────
    const missingFeatures: string[] = []
    if (!observed.brand) missingFeatures.push('Brand')
    if (!observed.logoText) missingFeatures.push('Logo Text')
    if (!observed.alignmentMarking) missingFeatures.push('Alignment Marking')
    if (!observed.numberColor) missingFeatures.push('Number Color')
    if (!observed.logoStyle) missingFeatures.push('Logo Style')

    // ── Explanation ───────────────────────────────────────────────────────────
    const explanation = buildExplanation(matchedFeatures, confidence)

    results.push({
      versionId: candidate.versionId,
      versionSlug: candidate.versionSlug,
      versionName: candidate.versionName,
      brandName: candidate.brandName,
      brandSlug: candidate.brandSlug,
      confidence,
      rawScore,
      matchedFeatures,
      missingFeatures,
      explanation,
    })
  }

  return results
    .sort((a, b) => b.confidence - a.confidence || b.rawScore - a.rawScore)
    .slice(0, maxResults)
}

function buildExplanation(matched: MatchedFeature[], confidence: number): string {
  if (matched.length === 0) return 'No features matched.'

  const categories = matched.map((m) => m.featureCategory.toLowerCase())

  if (categories.length === 1) {
    return `Matched on ${categories[0]} (${confidence}% confidence).`
  }

  const last = categories.pop()
  return `Matched on ${categories.join(', ')} and ${last} (${confidence}% confidence).`
}
