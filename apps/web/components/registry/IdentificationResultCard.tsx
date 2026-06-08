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
      ? 'text-emerald-400'
      : result.confidence >= 40
        ? 'text-amber-400'
        : 'text-neutral-500'

  const confidenceBarColor =
    result.confidence >= 70
      ? 'bg-emerald-500/60'
      : result.confidence >= 40
        ? 'bg-amber-500/60'
        : 'bg-neutral-600'

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.10]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-600">#{rank}</span>
            <span className="text-xs text-neutral-500">{result.brandName}</span>
          </div>
          <Link
            href={`/balls/${result.versionSlug}`}
            className="mt-0.5 block text-sm font-medium text-neutral-200 transition-colors hover:text-white"
          >
            {result.versionName}
          </Link>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`font-mono text-lg font-semibold ${confidenceColor}`}>
            {result.confidence}%
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className={`h-full rounded-full ${confidenceBarColor} transition-all`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {result.explanation && <p className="mt-2 text-xs text-neutral-500">{result.explanation}</p>}

      {result.matchedFeatures.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-600">
            {t('evidence')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedFeatures.map((f) => (
              <span
                key={f.featureCategory}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400"
              >
                <span className="text-emerald-600">✓</span>
                {f.featureCategory}
                <span className="text-emerald-700">+{f.points}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.missingFeatures.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-700">
            {t('couldImprove')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center rounded-full border border-white/[0.04] bg-white/[0.02] px-2 py-0.5 text-[11px] text-neutral-600"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-white/[0.04] pt-3">
        <Link
          href={`/balls/${result.versionSlug}`}
          className="text-[11px] text-neutral-600 transition-colors hover:text-neutral-400"
        >
          {t('viewFullSpecs')}
        </Link>
      </div>
    </div>
  )
}
