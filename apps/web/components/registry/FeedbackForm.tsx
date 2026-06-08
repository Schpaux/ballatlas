'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'

import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS } from '@ballatlas/validators'

import { submitFeedback, type FeedbackFormState } from '@/app/[locale]/balls/[slug]/actions'

type FeedbackFormProps = {
  versionId: string
  ballName: string
}

export function FeedbackForm({ versionId, ballName }: FeedbackFormProps) {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    null
  )

  if (state?.ok) {
    return <p className="text-sm text-neutral-500">{t('thanks')}</p>
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-neutral-600 underline-offset-2 transition-colors hover:text-neutral-400 hover:underline"
        >
          {t('reportIssue')}
        </button>
      ) : (
        <div className="max-w-md">
          <p className="mb-4 text-xs text-neutral-600">
            {t('reportIssueFor')} <span className="text-neutral-400">{ballName}</span>
          </p>

          <form action={action} className="space-y-3">
            <input type="hidden" name="version_id" value={versionId} />

            <div>
              <label className="mb-1 block text-xs text-neutral-500">{t('type')}</label>
              <select
                name="type"
                required
                className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/[0.16]"
              >
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FEEDBACK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                {t('message')} <span className="text-neutral-700">{t('messageHint')}</span>
              </label>
              <textarea
                name="message"
                required
                maxLength={500}
                rows={3}
                placeholder={t('placeholder.message')}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-white/[0.16]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                {t('sourceUrl')} <span className="text-neutral-700">{t('sourceUrlHint')}</span>
              </label>
              <input
                type="url"
                name="source_url"
                placeholder={t('placeholder.sourceUrl')}
                className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-white/[0.16]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                {t('email')} <span className="text-neutral-700">{t('emailHint')}</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder={t('placeholder.email')}
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
                {isPending ? t('submitting') : t('submit')}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
