import { getTranslations } from 'next-intl/server'

import {
  computeIdentificationConfidence,
  type IdentificationConfidenceInput,
  type IdentificationConfidenceRating,
} from '@ballatlas/golf-data'

type IdentificationConfidenceCardProps = {
  input: IdentificationConfidenceInput
}

function ratingStyle(rating: IdentificationConfidenceRating) {
  switch (rating) {
    case 'exceptional':
    case 'excellent':
      return { color: 'var(--ba-green)', bar: 'var(--ba-green)' }
    case 'good':
      return { color: 'var(--ba-subtle)', bar: 'var(--ba-subtle)' }
    case 'limited':
      return { color: 'var(--ba-gold)', bar: 'var(--ba-gold)' }
    case 'insufficient':
      return { color: 'var(--ba-ghost)', bar: 'var(--ba-sand)' }
  }
}

// Map package-generated English strength strings to translation keys
const STRENGTH_KEY_MAP: Record<string, string> = {
  'Brand text feature': 'brandText',
  'Model text feature': 'modelText',
  'Distinct alignment aid': 'alignmentAid',
  'Logo style documented': 'logoStyle',
  'Unique visual markings': 'uniqueMarkings',
}

// Map package-generated English gap strings to translation keys
const GAP_KEY_MAP: Record<string, string> = {
  'Brand text': 'brandText',
  'Model text': 'modelText',
  'Alignment marking': 'alignmentMarking',
  'Number color': 'numberColor',
  'Logo style': 'logoStyle',
}

export async function IdentificationConfidenceCard({ input }: IdentificationConfidenceCardProps) {
  const t = await getTranslations('idConfidence')
  const result = computeIdentificationConfidence(input)
  const { score, rating, strengths, gaps } = result

  const ratingLabel = t(`ratings.${rating}`)
  const explanation = t(`explanations.${rating}`)
  const style = ratingStyle(rating)

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="kicker">{t('title')}</p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: style.color }}>
            {ratingLabel}
          </p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-2xl font-bold leading-none tracking-tight"
            style={{ color: style.color }}
          >
            {score}
          </span>
          <span className="ml-0.5 font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
            / 100
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div
        className="mb-3 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: style.bar }}
        />
      </div>

      {/* Explanation */}
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--ba-ghost)' }}>
        {explanation}
      </p>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {strengths.slice(0, 3).map((s, i) => {
            // Handle "Distinctive number color (X)" which has a dynamic color value
            const isNumberColor = s.startsWith('Distinctive number color')
            const key = isNumberColor ? 'numberColor' : (STRENGTH_KEY_MAP[s] ?? null)
            const label = key ? t(`strengths.${key}`) : s
            return (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{
                  background: 'var(--ba-green-soft)',
                  color: 'var(--ba-green)',
                  border: '1px solid rgba(31,106,71,0.18)',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}

      {/* Gaps — only for limited/insufficient */}
      {gaps.length > 0 && (rating === 'limited' || rating === 'insufficient') && (
        <div className="mt-2 flex flex-wrap gap-1">
          {gaps.slice(0, 3).map((g, i) => {
            const key = GAP_KEY_MAP[g] ?? null
            const feature = key ? t(`gaps.${key}`) : g
            return (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                {t('missing', { feature })}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
