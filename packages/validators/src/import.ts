import { z } from 'zod'

import { BallStatusSchema } from './ball'
import { SlugSchema } from './common'
import { TechnicalSpecsSchema } from './specs'
import { VisualSignatureSchema, IdentificationFeatureSchema } from './visual'

// ─── Raw import shapes (use slugs instead of UUIDs for human-authored JSON) ─

export const RawBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  country: z.string().length(2).toUpperCase().optional().nullable(),
  website: z.string().url().optional().nullable(),
  logo_url: z.string().optional().nullable(),
})

export const RawFamilySchema = z.object({
  brand_slug: SlugSchema,
  name: z.string().min(1).max(100),
  slug: SlugSchema,
  description: z.string().max(1000).optional().nullable(),
  first_release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  last_release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  status: BallStatusSchema.default('published'),
})

// Inline specs/visual/features — resolved during import normalization
const InlineSpecsSchema = TechnicalSpecsSchema.omit({ version_id: true }).optional()
const InlineVisualSchema = VisualSignatureSchema.omit({ version_id: true }).optional()
const InlineFeatureSchema = IdentificationFeatureSchema.omit({ version_id: true })

export const RawVersionSchema = z.object({
  brand_slug: SlugSchema,
  family_slug: SlugSchema,
  name: z.string().min(1).max(150),
  slug: SlugSchema,
  release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  release_date: z.string().date().optional().nullable(),
  msrp_usd: z.number().positive().optional().nullable(),
  msrp_nok: z.number().positive().optional().nullable(),
  status: BallStatusSchema.default('published'),
  specs: InlineSpecsSchema,
  visual: InlineVisualSchema,
  features: z.array(InlineFeatureSchema).optional().default([]),
  segments: z.array(SlugSchema).optional().default([]),
})

// Raw alias shape — uses version_slug instead of UUID for human-authored JSON
export const RawAliasSchema = z.object({
  version_slug: SlugSchema,
  alias: z.string().min(1).max(200),
  alias_type: z
    .enum(['common_name', 'abbreviation', 'misspelling', 'regional_name', 'generation_tag'])
    .default('common_name'),
})

export const RawBrandsFileSchema = z.array(RawBrandSchema)
export const RawFamiliesFileSchema = z.array(RawFamilySchema)
export const RawVersionsFileSchema = z.array(RawVersionSchema)
export const RawAliasesFileSchema = z.array(RawAliasSchema)

export type RawBrand = z.infer<typeof RawBrandSchema>
export type RawFamily = z.infer<typeof RawFamilySchema>
export type RawVersion = z.infer<typeof RawVersionSchema>
export type RawAlias = z.infer<typeof RawAliasSchema>
