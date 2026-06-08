import { computeCompleteness, type CompletenessInput } from '@ballatlas/golf-data'

type DataCompletenessCardProps = {
  input: CompletenessInput
}

function readinessLevel(score: number) {
  if (score >= 80)
    return { label: 'Full Coverage', color: 'text-emerald-400', bar: 'bg-emerald-500' }
  if (score >= 60)
    return { label: 'Good Coverage', color: 'text-neutral-300', bar: 'bg-neutral-400' }
  if (score >= 40) return { label: 'Partial', color: 'text-amber-400', bar: 'bg-amber-500' }
  return { label: 'Minimal', color: 'text-neutral-500', bar: 'bg-neutral-600' }
}

export function DataCompletenessCard({ input }: DataCompletenessCardProps) {
  const result = computeCompleteness(input)
  const level = readinessLevel(result.score)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-400">Ball Profile</p>
          <p className={`mt-0.5 text-xs ${level.color}`}>{level.label}</p>
        </div>
        <div className="text-right">
          <span
            className={`font-mono text-2xl font-bold leading-none tracking-tight ${level.color}`}
          >
            {result.score}
          </span>
          <span className="ml-0.5 text-xs text-neutral-600">%</span>
        </div>
      </div>

      {/* Overall bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all ${level.bar}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Category breakdown */}
      {result.score < 100 && (
        <div className="space-y-2.5">
          {result.categories.map((cat) => (
            <div key={cat.name}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-600">{cat.name}</span>
                <span className="font-mono text-neutral-700">
                  {cat.filled}/{cat.total}
                </span>
              </div>
              <div className="h-px overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-neutral-600 transition-all"
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing fields */}
      {result.missingFields.length > 0 && (
        <div className="mt-3 border-t border-white/[0.04] pt-3">
          <div className="flex flex-wrap gap-1">
            {result.missingFields.slice(0, 4).map((f) => (
              <span
                key={f}
                className="rounded bg-neutral-800/60 px-1.5 py-0.5 text-[10px] text-neutral-700"
              >
                {f}
              </span>
            ))}
            {result.missingFields.length > 4 && (
              <span className="rounded bg-neutral-800/60 px-1.5 py-0.5 text-[10px] text-neutral-700">
                +{result.missingFields.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
