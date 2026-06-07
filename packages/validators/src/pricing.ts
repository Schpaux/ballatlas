import { z } from 'zod'

export const PriceConditionSchema = z.enum([
  'new',
  'mint',
  'near_mint',
  'good',
  'fair',
  'recycled',
  'lake_ball',
])

export const PriceObservationSchema = z.object({
  version_id: z.string().uuid(),
  condition: PriceConditionSchema,
  market: z.string().min(2).max(10).default('global'),
  currency: z.string().length(3).toUpperCase(),
  price: z.number().nonnegative(),
  observed_at: z.string().datetime().optional(),
  source_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const ArchivePriceObservationSchema = z.object({
  id: z.string().uuid(),
})

export type PriceObservationInput = z.infer<typeof PriceObservationSchema>
