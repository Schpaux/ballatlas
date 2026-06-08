import { z } from 'zod'

// ─── SVG Safety ───────────────────────────────────────────────────────────────

const UNSAFE_SVG_PATTERNS = [
  /<script[\s>]/i,
  /on\w+\s*=/i, // event handlers: onclick=, onload=, etc.
  /javascript\s*:/i, // javascript: URIs
  /<use[^>]+href\s*=\s*["']https?:\/\//i, // external <use> references
  /<foreignobject[\s>]/i, // HTML injection via <foreignObject>
]

export type SvgValidationResult = { ok: true } | { ok: false; errors: string[] }

const SVG_MAX_BYTES = 512 * 1024 // 512 KB

export function validateSvgSafety(content: string, sizeBytes?: number): SvgValidationResult {
  const errors: string[] = []

  if (sizeBytes !== undefined && sizeBytes > SVG_MAX_BYTES) {
    errors.push(`SVG exceeds maximum size of 512 KB (got ${Math.round(sizeBytes / 1024)} KB)`)
  }

  if (!content.trim().startsWith('<') || !/<svg[\s>]/i.test(content)) {
    errors.push('File does not appear to be a valid SVG document')
  }

  for (const pattern of UNSAFE_SVG_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`SVG contains disallowed content (matched: ${pattern.source})`)
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

// ─── Brand Asset Schemas ──────────────────────────────────────────────────────

export const BrandAssetTypeEnum = z.enum([
  'logo_svg',
  'logo_png',
  'brand_mark',
  'hero_image',
  'packaging',
  'identification_reference',
])

export const AssetReviewStatusEnum = z.enum(['uploaded', 'pending_review', 'approved', 'archived'])

export const BrandAssetMetaSchema = z.object({
  brand_id: z.string().uuid(),
  asset_type: BrandAssetTypeEnum,
  storage_path: z.string().min(1),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().positive().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  attribution: z.string().max(500).nullable().optional(),
  license: z.string().max(100).nullable().optional(),
  alt_text: z.string().max(300).nullable().optional(),
  review_status: AssetReviewStatusEnum.optional(),
  quality_score: z.number().int().min(1).max(10).nullable().optional(),
})

export type BrandAssetMeta = z.infer<typeof BrandAssetMetaSchema>

export const BrandAssetUpdateSchema = z.object({
  attribution: z.string().max(500).nullable().optional(),
  license: z.string().max(100).nullable().optional(),
  alt_text: z.string().max(300).nullable().optional(),
  review_status: AssetReviewStatusEnum.optional(),
  quality_score: z.number().int().min(1).max(10).nullable().optional(),
})

export type BrandAssetUpdate = z.infer<typeof BrandAssetUpdateSchema>

// ─── Brand Identity Schema ────────────────────────────────────────────────────

const cssColorRegex = /^(#[0-9a-fA-F]{3,8}|[a-z]+)$/

export const BrandIdentitySchema = z.object({
  primary_color: z
    .string()
    .regex(cssColorRegex, 'Must be a CSS hex color or named color')
    .nullable()
    .optional(),
  secondary_color: z
    .string()
    .regex(cssColorRegex, 'Must be a CSS hex color or named color')
    .nullable()
    .optional(),
})

export type BrandIdentity = z.infer<typeof BrandIdentitySchema>
