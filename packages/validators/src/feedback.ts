import { z } from 'zod'

export const FEEDBACK_TYPES = [
  'incorrect_info',
  'suggest_correction',
  'request_ball',
  'missing_specs',
] as const

export const FEEDBACK_TYPE_LABELS: Record<(typeof FEEDBACK_TYPES)[number], string> = {
  incorrect_info: 'Incorrect information',
  suggest_correction: 'Suggest a correction',
  request_ball: 'Request a missing ball',
  missing_specs: 'Report missing specifications',
}

export const FeedbackSubmissionSchema = z.object({
  version_id: z.string().uuid().nullable().optional(),
  type: z.enum(FEEDBACK_TYPES),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message must be 500 characters or fewer'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  source_url: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
})

export type FeedbackSubmission = z.infer<typeof FeedbackSubmissionSchema>
