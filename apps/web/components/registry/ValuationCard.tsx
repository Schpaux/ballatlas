import type { ValuationResult } from '@ballatlas/golf-data'

export type ValuationCardProps = {
  primarySegment: string | null
  valuationResult: ValuationResult | null
}

function fmt(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'NOK' ? 'NOK' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const barColor = pct >= 70 ? 'var(--ba-green)' : pct >= 40 ? 'var(--ba-gold)' : 'var(--ba-ghost)'
  const textColor = pct >= 70 ? 'var(--ba-green)' : pct >= 40 ? 'var(--ba-gold)' : 'var(--ba-ghost)'

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-1.5 w-20 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs" style={{ color: textColor }}>
        {pct}% confidence
      </span>
    </div>
  )
}

export function ValuationCard({ primarySegment, valuationResult }: ValuationCardProps) {
  if (!valuationResult || !valuationResult.ok) {
    const reason = valuationResult && !valuationResult.ok ? valuationResult.reason : null
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--ba-subtle)' }}
            >
              Market Value
            </p>
            {primarySegment && (
              <p className="mt-0.5 text-xs capitalize" style={{ color: 'var(--ba-ghost)' }}>
                {primarySegment.replace(/-/g, ' ')}
              </p>
            )}
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: 'var(--ba-paper)',
              color: 'var(--ba-ghost)',
              border: '1px solid var(--ba-line)',
            }}
          >
            No data
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ba-ghost)' }}>
          {reason ??
            "Market data for this ball hasn't been collected yet. Valuations are based on observed sale prices — missing values are left empty rather than estimated."}
        </p>
      </div>
    )
  }

  const { valuation } = valuationResult

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      {/* Header */}
      <div className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-[0.1em]"
          style={{ color: 'var(--ba-subtle)' }}
        >
          Market Value
        </p>
        {primarySegment && (
          <p className="mt-0.5 text-xs capitalize" style={{ color: 'var(--ba-ghost)' }}>
            {primarySegment.replace(/-/g, ' ')}
          </p>
        )}
      </div>

      {/* Price range */}
      <div className="mb-1">
        <p
          className="font-mono text-2xl font-bold tracking-tight"
          style={{ color: 'var(--ba-ink)' }}
        >
          {fmt(valuation.low, valuation.currency)}
          <span className="mx-2 text-base font-normal" style={{ color: 'var(--ba-ghost)' }}>
            –
          </span>
          {fmt(valuation.high, valuation.currency)}
        </p>
      </div>
      <p className="mb-4 text-xs" style={{ color: 'var(--ba-ghost)' }}>
        Mint condition · mid {fmt(valuation.mid, valuation.currency)}
      </p>

      <ConfidenceBar score={valuation.confidence} />

      {/* Footer meta */}
      <p className="mt-3 text-xs" style={{ color: 'var(--ba-ghost)' }}>
        {valuation.observation_count} market observation
        {valuation.observation_count !== 1 ? 's' : ''}
        {valuation.data_age_days != null && ` · data ${valuation.data_age_days}d old`}
      </p>
      {valuation.confidence < 0.7 && (
        <p className="mt-1 text-xs" style={{ color: 'var(--ba-ghost)' }}>
          {valuation.confidence_reason}
        </p>
      )}
    </div>
  )
}
