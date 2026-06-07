import { computeCompleteness, type CompletenessInput } from '@ballatlas/golf-data'

type DataCompletenessCardProps = {
  input: CompletenessInput
}

export function DataCompletenessCard({ input }: DataCompletenessCardProps) {
  const result = computeCompleteness(input)

  const scoreColor =
    result.score >= 70
      ? 'text-emerald-400'
      : result.score >= 40
        ? 'text-yellow-400'
        : 'text-neutral-500'

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">
          Data Completeness
        </p>
        <span className={`font-mono text-sm font-semibold ${scoreColor}`}>{result.score}%</span>
      </div>

      {result.score === 100 ? (
        <p className="text-xs text-neutral-600">Complete data coverage.</p>
      ) : (
        <>
          {/* Category bars */}
          <div className="space-y-2">
            {result.categories.map((cat) => (
              <div key={cat.name}>
                <div className="mb-1 flex justify-between text-xs text-neutral-600">
                  <span>{cat.name}</span>
                  <span className="font-mono">
                    {cat.filled}/{cat.total}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-neutral-500 transition-all"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Missing fields (up to 4) */}
          {result.missingFields.length > 0 && (
            <div className="mt-3 border-t border-white/[0.04] pt-3">
              <p className="mb-1.5 text-xs text-neutral-700">Missing:</p>
              <div className="flex flex-wrap gap-1">
                {result.missingFields.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className="rounded bg-neutral-800/50 px-1.5 py-0.5 text-xs text-neutral-600"
                  >
                    {f}
                  </span>
                ))}
                {result.missingFields.length > 4 && (
                  <span className="rounded bg-neutral-800/50 px-1.5 py-0.5 text-xs text-neutral-700">
                    +{result.missingFields.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
