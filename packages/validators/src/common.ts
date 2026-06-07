import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const SortDirectionSchema = z.enum(['asc', 'desc'])

export const SlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a valid slug (lowercase, hyphens only)')

export const IdSchema = z.string().uuid()

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  ...PaginationSchema.shape,
})

export type PaginationInput = z.infer<typeof PaginationSchema>
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>
