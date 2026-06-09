import { computeCompleteness, type CompletenessInput } from '@ballatlas/golf-data'

type DataCompletenessCardProps = {
  input: CompletenessInput
}

function readinessStyle(score: number) {
  if (score >= 80) return { label: 'Full Coverage', color: 'var(--ba-green)' }
  if (score >= 60) return { label: 'Good Coverage', color: 'var(--ba-subtle)' }
  if (score >= 40) return { label: 'Partial', color: 'var(--ba-gold)' }
  return { label: 'Minimal', color: 'var(--ba-ghost)' }
}

export function DataCompletenessCard({ input }: DataCompletenessCardProps) {
  const result = computeCompleteness(input)
  const style = readinessStyle(result.score)

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="kicker">Ball Profile</p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: style.color }}>
            {style.label}
          </p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-2xl font-bold leading-none tracking-tight"
            style={{ color: style.color }}
          >
            {result.score}
          </span>
          <span className="ml-0.5 text-xs" style={{ color: 'var(--ba-ghost)' }}>
            %
          </span>
        </div>
      </div>

      {/* Overall bar */}
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${result.score}%`, background: style.color }}
        />
      </div>

      {/* Category breakdown */}
      {result.score < 100 && (
        <div className="space-y-2.5">
          {result.categories.map((cat) => (
            <div key={cat.name}>
              <div className="mb-1 flex justify-between text-xs">
                <span style={{ color: 'var(--ba-subtle)' }}>{cat.name}</span>
                <span className="font-mono" style={{ color: 'var(--ba-ghost)' }}>
                  {cat.filled}/{cat.total}
                </span>
              </div>
              <div
                className="h-px overflow-hidden rounded-full"
                style={{ background: 'var(--ba-sand)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${cat.pct}%`, background: 'var(--ba-subtle)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing fields */}
      {result.missingFields.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ba-line)' }}>
          <div className="flex flex-wrap gap-1">
            {result.missingFields.slice(0, 4).map((f) => (
              <span
                key={f}
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                {f}
              </span>
            ))}
            {result.missingFields.length > 4 && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                +{result.missingFields.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
