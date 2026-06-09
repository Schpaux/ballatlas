import {
  computeIdentificationConfidence,
  CONFIDENCE_RATING_LABELS,
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

export function IdentificationConfidenceCard({ input }: IdentificationConfidenceCardProps) {
  const result = computeIdentificationConfidence(input)
  const { score, rating, explanation, strengths, gaps } = result

  const ratingLabel = CONFIDENCE_RATING_LABELS[rating]
  const style = ratingStyle(rating)

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="kicker">ID Confidence</p>
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
          {strengths.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-[10px]"
              style={{
                background: 'var(--ba-green-soft)',
                color: 'var(--ba-green)',
                border: '1px solid rgba(31,106,71,0.18)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Gaps — only for limited/insufficient */}
      {gaps.length > 0 && (rating === 'limited' || rating === 'insufficient') && (
        <div className="mt-2 flex flex-wrap gap-1">
          {gaps.slice(0, 3).map((g, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-[10px]"
              style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
            >
              Missing: {g}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
