import type { Tables, Enums } from '@ballatlas/database'

export type VisualSignature = Tables<'visual_signatures'>
export type IdentificationFeature = Tables<'identification_features'>
export type BallFinish = Enums<'ball_finish'>
export type IdentificationFeatureType = Enums<'identification_feature_type'>

// Importance score thresholds from research report
export const FEATURE_IMPORTANCE_LABELS: Record<string, string> = {
  brand_text: 'Very High — 10',
  model_text: 'Very High — 10',
  logo: 'Very High — 9',
  alignment_marking: 'Very High — 9',
  color: 'High — 8',
  finish: 'Medium — 6',
  dimple_pattern: 'Medium — 5',
  number_color: 'Low — 3',
  special_marking: 'Medium — 5',
}

export function isHighImportanceFeature(feature: IdentificationFeature): boolean {
  return feature.importance_score >= 8
}

export function sortFeaturesByImportance(
  features: IdentificationFeature[]
): IdentificationFeature[] {
  return [...features].sort((a, b) => b.importance_score - a.importance_score)
}
