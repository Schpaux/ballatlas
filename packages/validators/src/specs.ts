import { z } from 'zod'

export const LaunchProfileSchema = z.enum(['low', 'mid', 'high'])
export const SpinProfileSchema = z.enum(['low', 'mid', 'high'])
export const FeelProfileSchema = z.enum(['soft', 'medium', 'firm'])

export const TechnicalSpecsSchema = z.object({
  version_id: z.string().uuid(),
  construction_layers: z.number().int().min(1).max(7).optional().nullable(),
  compression: z.number().int().min(1).max(120).optional().nullable(),
  cover_material: z.string().max(100).optional().nullable(),
  core_material: z.string().max(100).optional().nullable(),
  dimple_count: z.number().int().min(100).max(600).optional().nullable(),
  dimple_pattern: z.string().max(200).optional().nullable(),
  launch_profile: LaunchProfileSchema.optional().nullable(),
  spin_profile: SpinProfileSchema.optional().nullable(),
  feel_profile: FeelProfileSchema.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type TechnicalSpecsInput = z.infer<typeof TechnicalSpecsSchema>
