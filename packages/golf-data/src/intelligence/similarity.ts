import { coverMaterialCategory } from '../entities/specs'

import {
  DEFAULT_SIMILARITY_WEIGHTS,
  SIMILARITY_MAX_RESULTS,
  SIMILARITY_THRESHOLD,
  type SimilarityWeights,
} from './config'

// ─── Input types ─────────────────────────────────────────────────────────────

export type BallProfile = {
  id: string
  slug: string
  name: string
  brandName: string
  segments: { id: string; slug: string; name: string }[]
  specs: {
    compression: number | null
    construction_layers: number | null
    cover_material: string | null
    launch_profile: string | null
    spin_profile: string | null
    feel_profile: string | null
  } | null
}

// ─── Output types ─────────────────────────────────────────────────────────────

export type SimilarityReason =
  | { type: 'segment'; label: string }
  | { type: 'compression'; label: string }
  | { type: 'construction'; label: string }
  | { type: 'cover'; label: string }
  | { type: 'profile'; label: string }

export type SimilarityResult = {
  profile: BallProfile
  score: number
  reasons: SimilarityReason[]
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function computeSimilarityScore(
  reference: BallProfile,
  candidate: BallProfile,
  weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS
): { score: number; reasons: SimilarityReason[] } {
  let score = 0
  const reasons: SimilarityReason[] = []

  // ── Segment ──────────────────────────────────────────────────────────────────
  const refPrimary = reference.segments[0]?.slug
  const candPrimary = candidate.segments[0]?.slug
  const refSlugs = new Set(reference.segments.map((s) => s.slug))
  const candSlugs = new Set(candidate.segments.map((s) => s.slug))

  if (refPrimary && candPrimary && refPrimary === candPrimary) {
    score += weights.segmentPrimary
    const segName = reference.segments[0]?.name ?? refPrimary
    reasons.push({ type: 'segment', label: `Same ${segName} segment` })
  } else {
    const shared = [...refSlugs].find((s) => candSlugs.has(s))
    if (shared) {
      score += weights.segmentSecondary
      const seg = reference.segments.find((s) => s.slug === shared)
      reasons.push({ type: 'segment', label: `Shared ${seg?.name ?? shared} segment` })
    }
  }

  // ── Compression ──────────────────────────────────────────────────────────────
  const refComp = reference.specs?.compression
  const candComp = candidate.specs?.compression
  if (refComp != null && candComp != null) {
    const delta = Math.abs(refComp - candComp)
    const { compression: c } = weights
    let compressionPoints = 0
    if (delta <= 5) compressionPoints = c.delta5
    else if (delta <= 10) compressionPoints = c.delta10
    else if (delta <= 15) compressionPoints = c.delta15
    else if (delta <= 20) compressionPoints = c.delta20
    else if (delta <= 30) compressionPoints = c.delta30

    if (compressionPoints > 0) {
      score += compressionPoints
      if (delta <= 5) {
        reasons.push({ type: 'compression', label: `Similar compression (${candComp})` })
      } else if (delta <= 15) {
        reasons.push({
          type: 'compression',
          label: `Comparable compression (${candComp} vs ${refComp})`,
        })
      }
    }
  }

  // ── Construction layers ───────────────────────────────────────────────────────
  const refLayers = reference.specs?.construction_layers
  const candLayers = candidate.specs?.construction_layers
  if (refLayers != null && candLayers != null && refLayers === candLayers) {
    score += weights.constructionLayers
    reasons.push({ type: 'construction', label: `${candLayers}-piece construction` })
  }

  // ── Cover material ────────────────────────────────────────────────────────────
  const refCover = coverMaterialCategory(reference.specs?.cover_material ?? null)
  const candCover = coverMaterialCategory(candidate.specs?.cover_material ?? null)
  if (refCover != null && candCover != null && refCover === candCover && refCover !== 'other') {
    score += weights.coverMaterial
    const label = refCover.charAt(0).toUpperCase() + refCover.slice(1)
    reasons.push({ type: 'cover', label: `${label} cover` })
  }

  // ── Launch profile ────────────────────────────────────────────────────────────
  const refLaunch = reference.specs?.launch_profile
  const candLaunch = candidate.specs?.launch_profile
  if (refLaunch && candLaunch && refLaunch === candLaunch) {
    score += weights.launchProfile
    reasons.push({ type: 'profile', label: `${capitalize(refLaunch)} launch` })
  }

  // ── Spin profile ──────────────────────────────────────────────────────────────
  const refSpin = reference.specs?.spin_profile
  const candSpin = candidate.specs?.spin_profile
  if (refSpin && candSpin && refSpin === candSpin) {
    score += weights.spinProfile
  }

  // ── Feel profile ──────────────────────────────────────────────────────────────
  const refFeel = reference.specs?.feel_profile
  const candFeel = candidate.specs?.feel_profile
  if (refFeel && candFeel && refFeel === candFeel) {
    score += weights.feelProfile
    reasons.push({ type: 'profile', label: `${capitalize(refFeel)} feel` })
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.slice(0, 3),
  }
}

/**
 * Rank a list of candidate balls by similarity to the reference, returning the
 * top results that meet the threshold. Excludes the reference ball itself.
 */
export function rankBySimilarity(
  reference: BallProfile,
  candidates: BallProfile[],
  weights: SimilarityWeights = DEFAULT_SIMILARITY_WEIGHTS,
  threshold = SIMILARITY_THRESHOLD,
  maxResults = SIMILARITY_MAX_RESULTS
): SimilarityResult[] {
  return candidates
    .filter((c) => c.id !== reference.id)
    .map((c) => {
      const { score, reasons } = computeSimilarityScore(reference, c, weights)
      return { profile: c, score, reasons }
    })
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
