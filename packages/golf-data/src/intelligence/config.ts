// Similarity scoring configuration.
//
// Weights are a business rule, not an implementation detail — they live here
// so product decisions about "what makes two balls similar" can be changed in
// one place without touching the scoring algorithm.

export type CompressionBrackets = {
  delta5: number
  delta10: number
  delta15: number
  delta20: number
  delta30: number
}

export type SimilarityWeights = {
  /** Primary segment match (same segment in first position) */
  segmentPrimary: number
  /** Secondary segment overlap (shared segment that isn't primary for both) */
  segmentSecondary: number
  /** Points for compression within each delta bracket */
  compression: CompressionBrackets
  /** Same number of construction layers */
  constructionLayers: number
  /** Same cover material category (urethane / surlyn / ionomer) */
  coverMaterial: number
  /** Same launch profile enum value */
  launchProfile: number
  /** Same spin profile enum value */
  spinProfile: number
  /** Same feel profile enum value */
  feelProfile: number
}

export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  segmentPrimary: 40,
  segmentSecondary: 20,
  compression: {
    delta5: 25,
    delta10: 20,
    delta15: 15,
    delta20: 10,
    delta30: 5,
  },
  constructionLayers: 10,
  coverMaterial: 10,
  launchProfile: 7,
  spinProfile: 5,
  feelProfile: 3,
}

/** Minimum score (0–100) for a ball to be surfaced as a similar alternative */
export const SIMILARITY_THRESHOLD = 50

/** Maximum number of similar balls to return */
export const SIMILARITY_MAX_RESULTS = 6
