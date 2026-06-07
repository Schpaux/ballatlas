import type { Tables } from '@ballatlas/database'

export type Segment = Tables<'segments'>

// Standard segment slugs — typed constants for use in code without magic strings
export const SEGMENT_SLUGS = {
  TOUR_PREMIUM: 'tour-premium',
  PERFORMANCE: 'performance',
  DISTANCE: 'distance',
  SOFT_FEEL: 'soft-feel',
  VALUE: 'value',
  LAKE_BALL: 'lake-ball',
} as const

export type SegmentSlug = (typeof SEGMENT_SLUGS)[keyof typeof SEGMENT_SLUGS]

// Segments that indicate premium quality (useful for filtering/display logic)
export const PREMIUM_SEGMENT_SLUGS: SegmentSlug[] = [
  SEGMENT_SLUGS.TOUR_PREMIUM,
  SEGMENT_SLUGS.PERFORMANCE,
]

export function isPremiumSegment(slug: string): boolean {
  return (PREMIUM_SEGMENT_SLUGS as string[]).includes(slug)
}
