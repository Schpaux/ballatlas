// Identification framework — Phase 5 placeholder
//
// This module will contain:
//   - Image preprocessing utilities
//   - Feature extraction interfaces
//   - Similarity matching logic
//   - Confidence scoring
//
// All identification_features and visual_signatures data collected in Phase 2
// will feed directly into this module in Phase 5.
//
// See docs/decisions/ADR-004 for why these are first-class DB entities.

export type IdentificationResult = {
  version_id: string
  confidence: number
  matched_features: string[]
}

export type IdentificationRequest = {
  image_path: string
  extracted_features?: Record<string, string>
}
