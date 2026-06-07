import { z } from 'zod'

export const AliasTypeSchema = z.enum([
  'common_name',
  'abbreviation',
  'misspelling',
  'regional_name',
  'generation_tag',
])

export const BallAliasSchema = z.object({
  id: z.string().uuid(),
  version_id: z.string().uuid(),
  alias: z.string().min(1).max(200),
  alias_type: AliasTypeSchema.default('common_name'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const CreateBallAliasSchema = BallAliasSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type AliasType = z.infer<typeof AliasTypeSchema>
export type BallAlias = z.infer<typeof BallAliasSchema>
export type CreateBallAlias = z.infer<typeof CreateBallAliasSchema>
