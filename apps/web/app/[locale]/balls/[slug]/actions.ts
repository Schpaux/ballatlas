'use server'

import { FeedbackSubmissionSchema } from '@ballatlas/validators'

import { createAdminClient } from '@/lib/supabase/server'

export type FeedbackFormState = {
  ok: boolean
  error?: string
} | null

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData
): Promise<FeedbackFormState> {
  const raw = {
    version_id: formData.get('version_id') as string | null,
    type: formData.get('type') as string,
    message: formData.get('message') as string,
    email: formData.get('email') as string,
    source_url: formData.get('source_url') as string,
  }

  const parsed = FeedbackSubmissionSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return { ok: false, error: first?.message ?? 'Invalid submission.' }
  }

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('feedback_submissions').insert({
      version_id: parsed.data.version_id ?? null,
      type: parsed.data.type,
      message: parsed.data.message,
      email: parsed.data.email ?? null,
      source_url: parsed.data.source_url ?? null,
    })

    if (error) throw error
    return { ok: true }
  } catch {
    return { ok: false, error: 'Failed to submit feedback. Please try again.' }
  }
}
