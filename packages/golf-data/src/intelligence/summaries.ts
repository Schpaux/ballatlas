// Deterministic ball and segment summary generation.
//
// No LLM. No dynamic generation. Templates are authored data — they encode
// product knowledge about what each segment and spec combination means.

import { SEGMENT_SLUGS, type SegmentSlug } from '../taxonomy/segments'

// ─── Segment descriptions ─────────────────────────────────────────────────────

export type SegmentDescription = {
  name: string
  shortDesc: string
  longDesc: string
  characteristics: string[]
}

export const SEGMENT_DESCRIPTIONS: Record<SegmentSlug, SegmentDescription> = {
  [SEGMENT_SLUGS.TOUR_PREMIUM]: {
    name: 'Tour Premium',
    shortDesc: 'Tour-level urethane ball for greenside spin and control.',
    longDesc:
      'Tour premium balls are designed for skilled players who prioritize greenside control and workability. They feature multi-layer urethane construction delivering maximum spin around the green while maintaining distance off the tee.',
    characteristics: [
      'Urethane cover',
      'Multi-layer construction',
      'High spin',
      'Soft feel',
      'Tour-caliber',
    ],
  },
  [SEGMENT_SLUGS.PERFORMANCE]: {
    name: 'Performance',
    shortDesc: 'High-performance ball balancing distance and spin.',
    longDesc:
      'Performance segment balls target mid-to-low handicap players seeking a blend of distance and greenside performance. They offer improved control over distance balls without the premium price of tour-level models.',
    characteristics: [
      'Urethane or cast cover',
      'Mid-to-high spin',
      'Balanced feel',
      'Distance + control',
    ],
  },
  [SEGMENT_SLUGS.DISTANCE]: {
    name: 'Distance',
    shortDesc: 'Engineered for maximum distance off the tee.',
    longDesc:
      'Distance balls prioritize low driver spin and high ball speed for maximum yardage. They typically use ionomer or surlyn covers for durability and feature firmer cores optimized for high swing speeds.',
    characteristics: [
      'Surlyn or ionomer cover',
      'Low spin off driver',
      'Firm feel',
      'High energy core',
    ],
  },
  [SEGMENT_SLUGS.SOFT_FEEL]: {
    name: 'Soft Feel',
    shortDesc: 'Low compression ball for maximum feel and forgiveness.',
    longDesc:
      'Soft feel balls use very low compression cores to provide a buttery feel across all swing speeds. Popular with slower swing speed players and those who prefer a softer response on short shots.',
    characteristics: ['Very low compression', 'Soft feel', 'Forgiving', 'Low swing speed friendly'],
  },
  [SEGMENT_SLUGS.VALUE]: {
    name: 'Value',
    shortDesc: 'Reliable everyday performance at an accessible price.',
    longDesc:
      'Value segment balls deliver consistent performance for recreational golfers without the premium price. They are durable, straight-flying, and forgiving — ideal for developing players or high-volume rounds.',
    characteristics: ['Surlyn cover', 'Durable', 'Straight flight', 'Budget-friendly'],
  },
  [SEGMENT_SLUGS.LAKE_BALL]: {
    name: 'Lake Ball',
    shortDesc: 'Recovered golf ball for practice or casual rounds.',
    longDesc:
      'Lake balls are recovered golf balls that have spent time submerged in water. Performance varies depending on time spent underwater and condition after recovery.',
    characteristics: ['Recovered ball', 'Variable performance', 'Budget option', 'Practice use'],
  },
}

export function getSegmentDescription(slug: string): SegmentDescription | null {
  return SEGMENT_DESCRIPTIONS[slug as SegmentSlug] ?? null
}

// ─── Ball summary ─────────────────────────────────────────────────────────────

type BallSummaryInput = {
  name: string
  segmentSlug: string | null
  constructionLayers: number | null
  coverMaterial: string | null
  compression: number | null
  launchProfile: string | null
  spinProfile: string | null
  feelProfile: string | null
}

export function buildBallSummary(input: BallSummaryInput): string {
  const parts: string[] = []

  // Construction + segment opening
  const segDesc = input.segmentSlug ? getSegmentDescription(input.segmentSlug) : null
  const layers = input.constructionLayers

  if (layers && segDesc) {
    parts.push(`A ${layers}-piece ${segDesc.name.toLowerCase()} golf ball`)
  } else if (layers) {
    parts.push(`A ${layers}-piece golf ball`)
  } else if (segDesc) {
    parts.push(`A ${segDesc.name.toLowerCase()} golf ball`)
  } else {
    parts.push('A golf ball')
  }

  // Cover material
  if (input.coverMaterial) {
    parts.push(`with a ${input.coverMaterial.toLowerCase()} cover`)
  }

  // Feel / compression character
  if (input.feelProfile) {
    parts.push(`and ${input.feelProfile} feel`)
  } else if (input.compression != null) {
    if (input.compression <= 60) parts.push('and very soft feel')
    else if (input.compression <= 75) parts.push('and soft feel')
    else if (input.compression >= 100) parts.push('and firm feel')
  }

  // Performance character
  const launchLabel = input.launchProfile
  const spinLabel = input.spinProfile
  if (launchLabel && spinLabel) {
    parts.push(`designed for ${launchLabel} launch and ${spinLabel} spin`)
  } else if (spinLabel === 'high') {
    parts.push('designed for high spin and control')
  } else if (spinLabel === 'low') {
    parts.push('designed for low spin and distance')
  }

  return parts.join(' ') + '.'
}
