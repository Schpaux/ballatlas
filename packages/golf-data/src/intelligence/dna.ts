// Ball DNA Engine — derives golfer-relevant trait scores from technical specifications.
//
// Scoring model: weighted-average over available signals.
// Each spec that has a value contributes a (score, weight) pair toward each trait.
// Specs that are null are excluded from both numerator and denominator, so scores
// reflect actual data rather than penalizing incompleteness.
//
// To tune the model: edit the score tables or per-signal weights below.
// Never hardcode trait values in consuming components.

import { coverMaterialCategory } from '../entities/specs'
import { SEGMENT_SLUGS } from '../taxonomy/segments'

// ─── Input ────────────────────────────────────────────────────────────────────

export type BallDNAInput = {
  segmentSlugs: string[]
  specs: {
    compression: number | null
    construction_layers: number | null
    cover_material: string | null
    launch_profile: string | null
    spin_profile: string | null
    feel_profile: string | null
  } | null
}

// ─── Output ───────────────────────────────────────────────────────────────────

export type DNATraitScore = {
  /** 0–100, derived from weighted-average of available signals */
  score: number
  /** Number of spec signals that contributed — lower = less certain */
  signalCount: number
}

export type BallDNAProfile = {
  /** How much the design prioritises carry/total distance */
  distance: DNATraitScore | null
  /** Shot-shape precision, stopping power, spin retention */
  control: DNATraitScore | null
  /** Softness and responsiveness at impact */
  feel: DNATraitScore | null
  /** Ability to shape shots and manipulate trajectory */
  workability: DNATraitScore | null
  /** Error correction for off-centre strikes */
  forgiveness: DNATraitScore | null
  /** Total signals across all five traits — 0 means no specs available */
  totalSignalCount: number
}

// ─── Score tables ─────────────────────────────────────────────────────────────
// Each table maps a signal value → score (0–100) per trait.
// Scores reflect the design intent of each value, not a golfer's skill level.

type AllTraitScores = {
  distance: number
  control: number
  feel: number
  workability: number
  forgiveness: number
}

// Segment — reflects market-positioning intent for each segment
const SEGMENT_SCORES: Partial<Record<string, AllTraitScores>> = {
  [SEGMENT_SLUGS.TOUR_PREMIUM]: {
    distance: 35,
    control: 88,
    feel: 72,
    workability: 88,
    forgiveness: 30,
  },
  [SEGMENT_SLUGS.PERFORMANCE]: {
    distance: 55,
    control: 68,
    feel: 62,
    workability: 65,
    forgiveness: 52,
  },
  [SEGMENT_SLUGS.DISTANCE]: {
    distance: 90,
    control: 28,
    feel: 32,
    workability: 22,
    forgiveness: 85,
  },
  [SEGMENT_SLUGS.SOFT_FEEL]: {
    distance: 48,
    control: 42,
    feel: 88,
    workability: 38,
    forgiveness: 72,
  },
  [SEGMENT_SLUGS.VALUE]: { distance: 65, control: 22, feel: 32, workability: 18, forgiveness: 82 },
  [SEGMENT_SLUGS.LAKE_BALL]: {
    distance: 60,
    control: 25,
    feel: 35,
    workability: 20,
    forgiveness: 75,
  },
}

// Launch — not used for Feel (no meaningful relationship)
type LaunchSpinTraitScores = Pick<
  AllTraitScores,
  'distance' | 'control' | 'workability' | 'forgiveness'
>

const LAUNCH_SCORES: Record<string, LaunchSpinTraitScores> = {
  high: { distance: 88, control: 28, workability: 30, forgiveness: 72 },
  mid: { distance: 55, control: 55, workability: 52, forgiveness: 52 },
  low: { distance: 20, control: 72, workability: 68, forgiveness: 30 },
}

// Spin — not used for Feel (captured by feel_profile and compression)
const SPIN_SCORES: Record<string, LaunchSpinTraitScores> = {
  low: { distance: 85, control: 22, workability: 22, forgiveness: 88 },
  mid: { distance: 52, control: 58, workability: 52, forgiveness: 52 },
  high: { distance: 22, control: 88, workability: 85, forgiveness: 18 },
}

// Cover material
const COVER_SCORES: Record<string, AllTraitScores> = {
  urethane: { distance: 28, control: 90, feel: 80, workability: 90, forgiveness: 25 },
  surlyn: { distance: 82, control: 28, feel: 38, workability: 22, forgiveness: 82 },
  ionomer: { distance: 72, control: 32, feel: 45, workability: 25, forgiveness: 78 },
  other: { distance: 50, control: 42, feel: 52, workability: 40, forgiveness: 52 },
}

// Construction layers (key clamped to 2–5; 1 → 2, 6+ → 5)
const LAYERS_SCORES: Record<number, AllTraitScores> = {
  2: { distance: 80, control: 22, feel: 38, workability: 18, forgiveness: 80 },
  3: { distance: 52, control: 55, feel: 55, workability: 60, forgiveness: 55 },
  4: { distance: 28, control: 80, feel: 68, workability: 85, forgiveness: 28 },
  5: { distance: 20, control: 88, feel: 72, workability: 90, forgiveness: 22 },
}

// Feel profile → Feel score only
const FEEL_PROFILE_SCORES: Record<string, number> = {
  soft: 92,
  medium: 55,
  firm: 22,
}

// Compression → Feel score (lower compression = softer feel)
function compressionFeelScore(c: number): number {
  if (c <= 55) return 95
  if (c <= 70) return 82
  if (c <= 80) return 68
  if (c <= 90) return 50
  if (c <= 100) return 32
  return 18
}

// Compression → Distance score (lower compression = more distance-oriented design)
function compressionDistanceScore(c: number): number {
  if (c <= 65) return 78
  if (c <= 80) return 62
  if (c <= 95) return 44
  return 28
}

// ─── Engine ───────────────────────────────────────────────────────────────────

type Signal = { score: number; weight: number }

function computeTrait(signals: Signal[]): DNATraitScore | null {
  if (signals.length === 0) return null
  const weightedSum = signals.reduce((acc, s) => acc + s.score * s.weight, 0)
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0)
  if (totalWeight === 0) return null
  return {
    score: Math.round(weightedSum / totalWeight),
    signalCount: signals.length,
  }
}

export function computeBallDNA(input: BallDNAInput): BallDNAProfile {
  const { segmentSlugs, specs } = input
  const primarySlug = segmentSlugs[0]

  const segScore = primarySlug ? SEGMENT_SCORES[primarySlug] : null
  const launch = specs?.launch_profile ?? null
  const spin = specs?.spin_profile ?? null
  const coverCat = coverMaterialCategory(specs?.cover_material ?? null)
  const layers = specs?.construction_layers ?? null
  const feelProfile = specs?.feel_profile ?? null
  const compression = specs?.compression ?? null

  const launchScore = launch ? LAUNCH_SCORES[launch] : null
  const spinScore = spin ? SPIN_SCORES[spin] : null
  const coverScore = coverCat ? COVER_SCORES[coverCat] : null
  const layersKey = layers != null ? Math.max(2, Math.min(layers, 5)) : null
  const layersScore = layersKey != null ? LAYERS_SCORES[layersKey] : null

  function mk(score: number, weight: number): Signal {
    return { score, weight }
  }

  // ── Distance ─────────────────────────────────────────────────────────────────
  // Signals: segment(35), launch(20), spin(20), cover(12), layers(8), compression(5)
  const distanceSignals: Signal[] = [
    ...(segScore ? [mk(segScore.distance, 35)] : []),
    ...(launchScore ? [mk(launchScore.distance, 20)] : []),
    ...(spinScore ? [mk(spinScore.distance, 20)] : []),
    ...(coverScore ? [mk(coverScore.distance, 12)] : []),
    ...(layersScore ? [mk(layersScore.distance, 8)] : []),
    ...(compression != null ? [mk(compressionDistanceScore(compression), 5)] : []),
  ]

  // ── Control ───────────────────────────────────────────────────────────────────
  // Signals: segment(35), spin(25), cover(20), layers(12), launch(6)
  const controlSignals: Signal[] = [
    ...(segScore ? [mk(segScore.control, 35)] : []),
    ...(launchScore ? [mk(launchScore.control, 6)] : []),
    ...(spinScore ? [mk(spinScore.control, 25)] : []),
    ...(coverScore ? [mk(coverScore.control, 20)] : []),
    ...(layersScore ? [mk(layersScore.control, 12)] : []),
  ]

  // ── Feel ─────────────────────────────────────────────────────────────────────
  // Signals: feel_profile(40), compression(30), cover(15), segment(15), layers(5)
  const feelSignals: Signal[] = [
    ...(segScore ? [mk(segScore.feel, 15)] : []),
    ...(coverScore ? [mk(coverScore.feel, 15)] : []),
    ...(layersScore ? [mk(layersScore.feel, 5)] : []),
    ...(feelProfile ? [mk(FEEL_PROFILE_SCORES[feelProfile] ?? 55, 40)] : []),
    ...(compression != null ? [mk(compressionFeelScore(compression), 30)] : []),
  ]

  // ── Workability ───────────────────────────────────────────────────────────────
  // Signals: cover(35), segment(25), spin(22), layers(15), launch(8)
  const workabilitySignals: Signal[] = [
    ...(segScore ? [mk(segScore.workability, 25)] : []),
    ...(launchScore ? [mk(launchScore.workability, 8)] : []),
    ...(spinScore ? [mk(spinScore.workability, 22)] : []),
    ...(coverScore ? [mk(coverScore.workability, 35)] : []),
    ...(layersScore ? [mk(layersScore.workability, 15)] : []),
  ]

  // ── Forgiveness ───────────────────────────────────────────────────────────────
  // Signals: spin(35), segment(30), cover(18), launch(15), layers(7)
  const forgivenessSignals: Signal[] = [
    ...(segScore ? [mk(segScore.forgiveness, 30)] : []),
    ...(launchScore ? [mk(launchScore.forgiveness, 15)] : []),
    ...(spinScore ? [mk(spinScore.forgiveness, 35)] : []),
    ...(coverScore ? [mk(coverScore.forgiveness, 18)] : []),
    ...(layersScore ? [mk(layersScore.forgiveness, 7)] : []),
  ]

  const distance = computeTrait(distanceSignals)
  const control = computeTrait(controlSignals)
  const feel = computeTrait(feelSignals)
  const workability = computeTrait(workabilitySignals)
  const forgiveness = computeTrait(forgivenessSignals)

  const totalSignalCount = [distance, control, feel, workability, forgiveness].reduce(
    (acc, t) => acc + (t?.signalCount ?? 0),
    0
  )

  return { distance, control, feel, workability, forgiveness, totalSignalCount }
}
