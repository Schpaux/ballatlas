// Identification scoring weights.
//
// Weights are a business rule — they define "what evidence matters most" for
// identifying a golf ball. Change them here to tune scoring without touching
// the engine algorithm.

export type IdentificationWeights = {
  /** Brand text match — highest signal; narrows field dramatically */
  brandMatch: number
  /** Model/logo text match — e.g. "Pro V1", "Chrome Soft" */
  logoText: number
  /** Alignment marking match — Triple Track, single line, arrow, none */
  alignmentMarking: number
  /** Number color match — black, red, gold, white */
  numberColor: number
  /** Logo style match — script, block, symbol */
  logoStyle: number
  /** Play number match — 1, 2, 3, 4 (lower signal, many balls share numbers) */
  playNumber: number
  /** Other visual feature match — color, finish, visual_pattern */
  otherVisual: number
}

export const DEFAULT_IDENTIFICATION_WEIGHTS: IdentificationWeights = {
  brandMatch: 40,
  logoText: 20,
  alignmentMarking: 15,
  numberColor: 10,
  logoStyle: 5,
  playNumber: 5,
  otherVisual: 5,
}

/** Minimum confidence (0–100) to include a candidate in results */
export const IDENTIFICATION_CONFIDENCE_THRESHOLD = 30

/** Maximum candidates to return */
export const IDENTIFICATION_MAX_RESULTS = 8
