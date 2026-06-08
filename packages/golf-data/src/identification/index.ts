export type { IdentificationWeights } from './config'
export {
  DEFAULT_IDENTIFICATION_WEIGHTS,
  IDENTIFICATION_CONFIDENCE_THRESHOLD,
  IDENTIFICATION_MAX_RESULTS,
} from './config'

export type {
  ObservedFeatures,
  IdentificationCandidate,
  MatchedFeature,
  IdentificationResult,
} from './engine'
export { identifyBall } from './engine'

export type {
  CandidateCoverageInput,
  IdentificationReadiness,
  VersionCoverage,
  IdentificationCoverageSummary,
} from './coverage'
export { computeIdentificationCoverage } from './coverage'

export type { FeatureExtractionInput, FeatureExtractionResult, FeatureCategory } from './contracts'
