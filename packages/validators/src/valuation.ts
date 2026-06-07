import { z } from 'zod'

export const ValuationProfileSchema = z.object({
  id: z.string().uuid(),
  segment: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const CreateValuationProfileSchema = ValuationProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const ConditionMultiplierSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  condition: z.string().min(1).max(50),
  multiplier: z.number().nonnegative(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const CreateConditionMultiplierSchema = ConditionMultiplierSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const ValuationRuleSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  age_adjustment: z.number().nonnegative().default(1.0),
  demand_adjustment: z.number().nonnegative().default(1.0),
  availability_adjustment: z.number().nonnegative().default(1.0),
  notes: z.string().max(2000).optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const CreateValuationRuleSchema = ValuationRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type ValuationProfile = z.infer<typeof ValuationProfileSchema>
export type CreateValuationProfile = z.infer<typeof CreateValuationProfileSchema>
export type ConditionMultiplier = z.infer<typeof ConditionMultiplierSchema>
export type CreateConditionMultiplier = z.infer<typeof CreateConditionMultiplierSchema>
export type ValuationRule = z.infer<typeof ValuationRuleSchema>
export type CreateValuationRule = z.infer<typeof CreateValuationRuleSchema>
