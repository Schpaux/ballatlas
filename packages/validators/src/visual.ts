import { z } from 'zod'

export const BallFinishSchema = z.enum(['glossy', 'matte', 'satin'])

export const IdentificationFeatureTypeSchema = z.enum([
  'brand_text',
  'model_text',
  'logo',
  'alignment_marking',
  'number_color',
  'finish',
  'color',
  'dimple_pattern',
  'special_marking',
  'play_number',
  'number_style',
  'visual_pattern',
])

export const VisualSignatureSchema = z.object({
  version_id: z.string().uuid(),
  primary_color: z.string().max(50).optional().nullable(),
  finish: BallFinishSchema.optional().nullable(),
  logo_style: z.string().max(200).optional().nullable(),
  logo_text: z.string().max(100).optional().nullable(),
  alignment_marking: z.string().max(200).optional().nullable(),
  number_style: z.string().max(100).optional().nullable(),
  number_color: z.string().max(50).optional().nullable(),
  special_markings: z.string().max(500).optional().nullable(),
})

export const IdentificationFeatureSchema = z.object({
  version_id: z.string().uuid(),
  feature_type: IdentificationFeatureTypeSchema,
  feature_value: z.string().min(1).max(500),
  importance_score: z.number().int().min(1).max(10),
})

export type VisualSignatureInput = z.infer<typeof VisualSignatureSchema>
export type IdentificationFeatureInput = z.infer<typeof IdentificationFeatureSchema>
