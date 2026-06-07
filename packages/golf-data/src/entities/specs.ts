import type { Tables, Enums } from '@ballatlas/database'

export type TechnicalSpecs = Tables<'technical_specs'>

export type LaunchProfile = Enums<'launch_profile'>
export type SpinProfile = Enums<'spin_profile'>
export type FeelProfile = Enums<'feel_profile'>

// Human-readable labels for enum display
export const LAUNCH_PROFILE_LABELS: Record<LaunchProfile, string> = {
  low: 'Low Launch',
  mid: 'Mid Launch',
  high: 'High Launch',
}

export const SPIN_PROFILE_LABELS: Record<SpinProfile, string> = {
  low: 'Low Spin',
  mid: 'Mid Spin',
  high: 'High Spin',
}

export const FEEL_PROFILE_LABELS: Record<FeelProfile, string> = {
  soft: 'Soft',
  medium: 'Medium',
  firm: 'Firm',
}

// Compression tends to fall in interpretable ranges
export function compressionCategory(compression: number | null): string | null {
  if (compression === null) return null
  if (compression <= 60) return 'Low (≤60)'
  if (compression <= 80) return 'Mid-Low (61–80)'
  if (compression <= 90) return 'Mid (81–90)'
  if (compression <= 100) return 'Mid-High (91–100)'
  return 'High (>100)'
}

export function coverMaterialCategory(
  material: string | null
): 'urethane' | 'surlyn' | 'ionomer' | 'other' | null {
  if (material === null) return null
  const lower = material.toLowerCase()
  if (lower.includes('urethane')) return 'urethane'
  if (lower.includes('surlyn')) return 'surlyn'
  if (lower.includes('ionomer')) return 'ionomer'
  return 'other'
}
