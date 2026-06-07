import { z } from 'zod'

export const ImageTypeSchema = z.enum([
  'hero',
  'side',
  'logo',
  'alignment',
  'number',
  'dimple',
  'packaging',
])

export const ImageReviewStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const ImageQualityScoreSchema = z.number().int().min(1).max(10)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export const ImageUploadSchema = z.object({
  version_id: z.string().uuid(),
  image_type: ImageTypeSchema,
  license: z.string().min(1).max(200),
  attribution: z.string().max(500).optional().nullable(),
  alt_text: z.string().max(300).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  image_quality_score: ImageQualityScoreSchema.optional().nullable(),
})

export const ImageFileValidationSchema = z.object({
  size: z
    .number()
    .max(MAX_FILE_SIZE_BYTES, `File must be under ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`),
  type: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: `File must be JPEG, PNG, WebP, or AVIF` }),
  }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export const ImageReviewSchema = z.object({
  review_status: ImageReviewStatusSchema,
  image_quality_score: ImageQualityScoreSchema.optional().nullable(),
  reviewed_by: z.string().min(1).max(200).optional(),
})

export type ImageType = z.infer<typeof ImageTypeSchema>
export type ImageReviewStatus = z.infer<typeof ImageReviewStatusSchema>
export type ImageUploadInput = z.infer<typeof ImageUploadSchema>
export type ImageReviewInput = z.infer<typeof ImageReviewSchema>
