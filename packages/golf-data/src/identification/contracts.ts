// AI Readiness Contracts — Phase 7
//
// These interfaces define the boundary between future vision/OCR systems
// and the BallAtlas identification engine.
//
// Future AI systems (Phase 9) will:
//   1. Accept FeatureExtractionInput (image + context)
//   2. Return FeatureExtractionResult (structured features)
//
// The identification engine consumes FeatureExtractionResult directly
// (it is structurally identical to ObservedFeatures).
//
// Do NOT implement image recognition here.
// Do NOT integrate any vision model here.
// Define the contract only.

/**
 * Input to a future feature extraction system.
 * Represents the image and any context about the extraction task.
 */
export type FeatureExtractionInput = {
  /** Storage path or URL of the image to analyze */
  imagePath: string
  /** MIME type, e.g. "image/jpeg", "image/png" */
  mimeType: string
  /** Optional pixel dimensions for preprocessing decisions */
  widthPx?: number
  heightPx?: number
  /** Hint about which side of the ball is visible */
  imageAngle?: 'front' | 'back' | 'side' | 'unknown'
  /** Request specific feature categories only (default: all) */
  requestedFeatures?: FeatureCategory[]
}

export type FeatureCategory =
  | 'brand'
  | 'logo_text'
  | 'alignment_marking'
  | 'number_color'
  | 'logo_style'
  | 'play_number'
  | 'cover_finish'
  | 'primary_color'
  | 'visual_pattern'

/**
 * Result from a feature extraction system.
 * Structurally identical to ObservedFeatures — the engine accepts it directly.
 */
export type FeatureExtractionResult = {
  /** Brand name detected, e.g. "Titleist" */
  brand?: string
  /** Model text detected, e.g. "Pro V1" */
  logoText?: string
  /** Alignment marking detected, e.g. "Triple Track" */
  alignmentMarking?: string
  /** Number color detected, e.g. "black" */
  numberColor?: string
  /** Logo style detected, e.g. "Titleist script" */
  logoStyle?: string
  /** Play number detected, e.g. "3" */
  playNumber?: string
  /** Cover finish detected: "glossy" | "matte" | "satin" */
  coverFinish?: string
  /** Primary color detected, e.g. "white" */
  primaryColor?: string
  /** Visual pattern detected, e.g. "Truvis hexagonal" */
  visualPattern?: string

  /**
   * Per-feature confidence from the extraction model (0.0–1.0).
   * The identification engine does not use these — they are metadata
   * for logging and debugging extraction quality.
   */
  extractionConfidence?: Partial<Record<FeatureCategory, number>>

  /** Which extraction model produced this result */
  extractionModel?: string
  /** How long extraction took in milliseconds */
  extractionMs?: number
}
