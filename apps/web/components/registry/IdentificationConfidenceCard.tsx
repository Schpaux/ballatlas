import {
  computeIdentificationConfidence,
  CONFIDENCE_RATING_LABELS,
  type IdentificationConfidenceInput,
  type IdentificationConfidenceRating,
} from '@ballatlas/golf-data'

type IdentificationConfidenceCardProps = {
  input: IdentificationConfidenceInput
}

function ratingColor(rating: IdentificationConfidenceRating): string {
  switch (rating) {
    case 'exceptional':
      return 'text-emerald-300'
    case 'excellent':
      return 'text-emerald-400'
    case 'good':
      return 'text-neutral-300'
    case 'limited':
      return 'text-amber-400'
    case 'insufficient':
      return 'text-neutral-600'
  }
}

function barColor(rating: IdentificationConfidenceRating): string {
  switch (rating) {
    case 'exceptional':
    case 'excellent':
      return 'bg-gradient-to-r from-emerald-600/80 to-emerald-400/60'
    case 'good':
      return 'bg-neutral-500'
    case 'limited':
      return 'bg-amber-600/70'
    case 'insufficient':
      return 'bg-neutral-700'
  }
}

export function IdentificationConfidenceCard({ input }: IdentificationConfidenceCardProps) {
  const result = computeIdentificationConfidence(input)
  const { score, rating, explanation, strengths, gaps } = result

  const ratingLabel = CONFIDENCE_RATING_LABELS[rating]
  const color = ratingColor(rating)
  const bar = barColor(rating)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-400">Identification Confidence</p>
          <p className={`mt-0.5 text-xs font-medium ${color}`}>{ratingLabel}</p>
        </div>
        <div className="text-right">
          <span className={`font-mono text-2xl font-bold leading-none tracking-tight ${color}`}>
            {score}
          </span>
          <span className="ml-0.5 font-mono text-xs text-neutral-600">/ 100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Explanation */}
      <p className="mb-3 text-[11px] leading-relaxed text-neutral-600">{explanation}</p>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {strengths.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="rounded-full border border-emerald-500/10 bg-emerald-500/[0.06] px-2 py-0.5 text-[10px] text-emerald-600"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Gaps — only show for limited/insufficient */}
      {gaps.length > 0 && (rating === 'limited' || rating === 'insufficient') && (
        <div className="mt-2 flex flex-wrap gap-1">
          {gaps.slice(0, 3).map((g, i) => (
            <span
              key={i}
              className="rounded-full bg-neutral-800/60 px-2 py-0.5 text-[10px] text-neutral-700"
            >
              Missing: {g}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
