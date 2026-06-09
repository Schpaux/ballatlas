'use client'

import { useTranslations } from 'next-intl'

import type { IdentificationResult } from '@ballatlas/golf-data'

import { Link } from '@/i18n/navigation'

type Props = {
  result: IdentificationResult
  rank: number
}

export function IdentificationResultCard({ result, rank }: Props) {
  const t = useTranslations('identify')

  const confidenceColor =
    result.confidence >= 70
      ? 'var(--ba-green)'
      : result.confidence >= 40
        ? 'var(--ba-gold)'
        : 'var(--ba-ghost)'

  const confidenceBarColor =
    result.confidence >= 70
      ? 'var(--ba-green)'
      : result.confidence >= 40
        ? 'var(--ba-gold)'
        : 'var(--ba-ghost)'

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: 'var(--ba-ghost)' }}>
              #{rank}
            </span>
            <span className="text-xs" style={{ color: 'var(--ba-subtle)' }}>
              {result.brandName}
            </span>
          </div>
          <Link
            href={`/balls/${result.versionSlug}`}
            className="mt-0.5 block text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--ba-ink)' }}
          >
            {result.versionName}
          </Link>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-lg font-semibold" style={{ color: confidenceColor }}>
            {result.confidence}%
          </span>
          <div
            className="h-1.5 w-20 overflow-hidden rounded-full"
            style={{ background: 'var(--ba-sand)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${result.confidence}%`, background: confidenceBarColor }}
            />
          </div>
        </div>
      </div>

      {result.explanation && (
        <p className="mt-2 text-xs" style={{ color: 'var(--ba-subtle)' }}>
          {result.explanation}
        </p>
      )}

      {result.matchedFeatures.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="kicker">{t('evidence')}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedFeatures.map((f) => (
              <span
                key={f.featureCategory}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  background: 'var(--ba-green-soft)',
                  color: 'var(--ba-green)',
                  border: '1px solid rgba(31,106,71,0.18)',
                }}
              >
                <span>✓</span>
                {f.featureCategory}
                <span style={{ opacity: 0.6 }}>+{f.points}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.missingFeatures.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="kicker">{t('couldImprove')}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ba-line)' }}>
        <Link
          href={`/balls/${result.versionSlug}`}
          className="text-[11px] transition-opacity hover:opacity-70"
          style={{ color: 'var(--ba-ghost)' }}
        >
          {t('viewFullSpecs')}
        </Link>
      </div>
    </div>
  )
}
