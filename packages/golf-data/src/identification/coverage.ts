// Identification coverage measurement.
// Works over pre-loaded data — no DB client dependency.

export type CandidateCoverageInput = {
  versionId: string
  versionName: string
  brandName: string
  hasVisualSignature: boolean
  hasIdentificationFeatures: boolean
  featureTypes: string[]
}

export type IdentificationReadiness =
  | 'full' // has visual + features with brand_text + model_text
  | 'partial' // has some data but missing key features
  | 'minimal' // has only visual or only features, no brand/model
  | 'none' // no identification data at all

export type VersionCoverage = {
  versionId: string
  versionName: string
  brandName: string
  readiness: IdentificationReadiness
  featureCount: number
  hasVisual: boolean
  hasFeatures: boolean
  hasBrandText: boolean
  hasModelText: boolean
  hasAlignmentMarking: boolean
  hasNumberColor: boolean
}

export type IdentificationCoverageSummary = {
  totalVersions: number
  full: number
  partial: number
  minimal: number
  none: number
  fullPct: number
  partialPct: number
  minimalPct: number
  nonePct: number
  withVisualSignature: number
  withIdentificationFeatures: number
  withBrandText: number
  withModelText: number
  withAlignmentMarking: number
  withNumberColor: number
  versions: VersionCoverage[]
}

export function computeIdentificationCoverage(
  candidates: CandidateCoverageInput[]
): IdentificationCoverageSummary {
  const versions: VersionCoverage[] = candidates.map((c) => {
    const hasBrandText = c.featureTypes.includes('brand_text')
    const hasModelText = c.featureTypes.includes('model_text')
    const hasAlignmentMarking = c.featureTypes.includes('alignment_marking') || c.hasVisualSignature
    const hasNumberColor = c.featureTypes.includes('number_color') || c.hasVisualSignature

    let readiness: IdentificationReadiness
    if (c.hasVisualSignature && c.hasIdentificationFeatures && hasBrandText && hasModelText) {
      readiness = 'full'
    } else if (
      c.hasVisualSignature ||
      (c.hasIdentificationFeatures && (hasBrandText || hasModelText))
    ) {
      readiness = 'partial'
    } else if (c.hasVisualSignature || c.hasIdentificationFeatures) {
      readiness = 'minimal'
    } else {
      readiness = 'none'
    }

    return {
      versionId: c.versionId,
      versionName: c.versionName,
      brandName: c.brandName,
      readiness,
      featureCount: c.featureTypes.length,
      hasVisual: c.hasVisualSignature,
      hasFeatures: c.hasIdentificationFeatures,
      hasBrandText,
      hasModelText,
      hasAlignmentMarking,
      hasNumberColor,
    }
  })

  const total = versions.length
  const full = versions.filter((v) => v.readiness === 'full').length
  const partial = versions.filter((v) => v.readiness === 'partial').length
  const minimal = versions.filter((v) => v.readiness === 'minimal').length
  const none = versions.filter((v) => v.readiness === 'none').length

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return {
    totalVersions: total,
    full,
    partial,
    minimal,
    none,
    fullPct: pct(full),
    partialPct: pct(partial),
    minimalPct: pct(minimal),
    nonePct: pct(none),
    withVisualSignature: versions.filter((v) => v.hasVisual).length,
    withIdentificationFeatures: versions.filter((v) => v.hasFeatures).length,
    withBrandText: versions.filter((v) => v.hasBrandText).length,
    withModelText: versions.filter((v) => v.hasModelText).length,
    withAlignmentMarking: versions.filter((v) => v.hasAlignmentMarking).length,
    withNumberColor: versions.filter((v) => v.hasNumberColor).length,
    versions,
  }
}
