import { computeBallDNA, type BallDNAInput, type DNATraitScore } from '@ballatlas/golf-data'

type BallDNACardProps = {
  input: BallDNAInput
}

const TRAITS: {
  key: keyof Omit<ReturnType<typeof computeBallDNA>, 'totalSignalCount'>
  label: string
}[] = [
  { key: 'distance', label: 'Distance' },
  { key: 'control', label: 'Control' },
  { key: 'feel', label: 'Feel' },
  { key: 'workability', label: 'Workability' },
  { key: 'forgiveness', label: 'Forgiveness' },
]

function TraitBar({ trait, score }: { trait: string; score: DNATraitScore }) {
  const { score: value, signalCount } = score
  const lowConfidence = signalCount <= 1

  const barColor = lowConfidence
    ? 'var(--ba-sand)'
    : value >= 70
      ? 'var(--ba-green)'
      : value >= 40
        ? 'var(--ba-subtle)'
        : 'var(--ba-sand)'

  const textColor = lowConfidence
    ? 'var(--ba-ghost)'
    : value >= 70
      ? 'var(--ba-green)'
      : value >= 40
        ? 'var(--ba-subtle)'
        : 'var(--ba-ghost)'

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 shrink-0">
        <span
          className="text-xs font-medium"
          style={{ color: lowConfidence ? 'var(--ba-ghost)' : 'var(--ba-subtle)' }}
        >
          {trait}
        </span>
      </div>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
      <div className="w-8 shrink-0 text-right">
        <span className="font-mono text-xs tabular-nums" style={{ color: textColor }}>
          {value}
        </span>
      </div>
    </div>
  )
}

export function BallDNACard({ input }: BallDNACardProps) {
  const profile = computeBallDNA(input)

  if (profile.totalSignalCount === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
      >
        <Header />
        <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
          Technical specifications required for DNA analysis.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      <Header />

      <div className="flex flex-col gap-3.5">
        {TRAITS.map(({ key, label }) => {
          const traitScore = profile[key]
          if (!traitScore) {
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <span className="text-xs font-medium" style={{ color: 'var(--ba-ghost)' }}>
                    {label}
                  </span>
                </div>
                <div
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: 'var(--ba-paper)' }}
                />
                <div className="w-8 shrink-0 text-right">
                  <span className="font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
                    —
                  </span>
                </div>
              </div>
            )
          }
          return <TraitBar key={key} trait={label} score={traitScore} />
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed" style={{ color: 'var(--ba-ghost)' }}>
        Derived from specifications · {profile.totalSignalCount} signals
      </p>
    </div>
  )
}

function Header() {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <p className="kicker">Ball DNA</p>
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ba-ghost)' }}>
          Performance trait profile
        </p>
      </div>
      <div className="flex items-end gap-px opacity-25" aria-hidden="true">
        {[2, 3, 4, 5, 4, 3, 4, 5, 6, 5, 4, 3].map((h, i) => (
          <div
            key={i}
            className="w-px rounded-full"
            style={{ height: `${h * 2}px`, background: 'var(--ba-green)' }}
          />
        ))}
      </div>
    </div>
  )
}
