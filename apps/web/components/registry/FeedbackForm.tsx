'use client'

import { useActionState, useState } from 'react'

import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS } from '@ballatlas/validators'

import { submitFeedback, type FeedbackFormState } from '@/app/balls/[slug]/actions'

type FeedbackFormProps = {
  versionId: string
  ballName: string
}

export function FeedbackForm({ versionId, ballName }: FeedbackFormProps) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    null
  )

  if (state?.ok) {
    return (
      <p className="text-sm text-neutral-500">
        Thanks — your feedback has been submitted and will be reviewed.
      </p>
    )
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-neutral-600 underline-offset-2 transition-colors hover:text-neutral-400 hover:underline"
        >
          Report an issue with this ball
        </button>
      ) : (
        <div className="max-w-md">
          <p className="mb-4 text-xs text-neutral-600">
            Report an issue with <span className="text-neutral-400">{ballName}</span>
          </p>

          <form action={action} className="space-y-3">
            <input type="hidden" name="version_id" value={versionId} />

            {/* Type */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Type</label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.16]"
              >
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FEEDBACK_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Message <span className="text-neutral-700">(required, max 500 chars)</span>
              </label>
              <textarea
                name="message"
                required
                maxLength={500}
                rows={3}
                placeholder="Describe the issue or correction…"
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-white/[0.16]"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Source URL <span className="text-neutral-700">(optional)</span>
              </label>
              <input
                type="url"
                name="source_url"
                placeholder="https://…"
                className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-white/[0.16]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Email <span className="text-neutral-700">(optional, for follow-up)</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-white/[0.16]"
              />
            </div>

            {state?.error && <p className="text-xs text-red-400">{state.error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:opacity-50"
              >
                {isPending ? 'Submitting…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
