import { z } from 'zod'

import { SlugSchema } from './common'

export const BallStatusSchema = z.enum(['draft', 'published', 'archived', 'discontinued'])

export const BrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  country: z.string().length(2).toUpperCase().optional().nullable(),
  website: z.string().url().optional().nullable(),
  logo_url: z.string().optional().nullable(),
})

export const BallFamilySchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  description: z.string().max(1000).optional().nullable(),
  first_release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  last_release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  status: BallStatusSchema.default('published'),
})

export const BallVersionSchema = z.object({
  family_id: z.string().uuid(),
  name: z.string().min(1).max(150),
  slug: SlugSchema,
  release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  release_date: z.string().date().optional().nullable(),
  msrp_usd: z.number().positive().optional().nullable(),
  msrp_nok: z.number().positive().optional().nullable(),
  status: BallStatusSchema.default('published'),
})

export type BrandInput = z.infer<typeof BrandSchema>
export type BallFamilyInput = z.infer<typeof BallFamilySchema>
export type BallVersionInput = z.infer<typeof BallVersionSchema>
