'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'

import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS } from '@ballatlas/validators'

import { submitFeedback, type FeedbackFormState } from '@/app/[locale]/balls/[slug]/actions'

type FeedbackFormProps = {
  versionId: string
  ballName: string
}

const inputStyle = {
  background: 'var(--ba-paper)',
  border: '1px solid var(--ba-line-strong)',
  color: 'var(--ba-ink)',
  borderRadius: '8px',
  outline: 'none',
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.875rem',
}

export function FeedbackForm({ versionId, ballName }: FeedbackFormProps) {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    null
  )

  if (state?.ok) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-subtle)' }}>
        {t('thanks')}
      </p>
    )
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs underline-offset-2 transition-colors hover:underline"
          style={{ color: 'var(--ba-ghost)' }}
        >
          {t('reportIssue')}
        </button>
      ) : (
        <div className="max-w-md">
          <p className="mb-4 text-xs" style={{ color: 'var(--ba-subtle)' }}>
            {t('reportIssueFor')} <span style={{ color: 'var(--ba-ink)' }}>{ballName}</span>
          </p>

          <form action={action} className="space-y-3">
            <input type="hidden" name="version_id" value={versionId} />

            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
                {t('type')}
              </label>
              <select name="type" required style={inputStyle}>
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FEEDBACK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
                {t('message')} <span style={{ color: 'var(--ba-ghost)' }}>{t('messageHint')}</span>
              </label>
              <textarea
                name="message"
                required
                maxLength={500}
                rows={3}
                placeholder={t('placeholder.message')}
                style={{
                  ...inputStyle,
                  resize: 'none',
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
                {t('sourceUrl')}{' '}
                <span style={{ color: 'var(--ba-ghost)' }}>{t('sourceUrlHint')}</span>
              </label>
              <input
                type="url"
                name="source_url"
                placeholder={t('placeholder.sourceUrl')}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
                {t('email')} <span style={{ color: 'var(--ba-ghost)' }}>{t('emailHint')}</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder={t('placeholder.email')}
                style={inputStyle}
              />
            </div>

            {state?.error && (
              <p className="text-xs" style={{ color: 'var(--ba-clay)' }}>
                {state.error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--ba-ink)',
                  color: 'var(--ba-paper)',
                }}
              >
                {isPending ? t('submitting') : t('submit')}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs transition-colors"
                style={{ color: 'var(--ba-ghost)' }}
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
