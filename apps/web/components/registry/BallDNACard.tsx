import { computeBallDNA, type BallDNAInput, type DNATraitScore } from '@ballatlas/golf-data'

type BallDNACardProps = {
  input: BallDNAInput
}

const TRAITS: {
  key: keyof Omit<ReturnType<typeof computeBallDNA>, 'totalSignalCount'>
  label: string
  sublabel: string
}[] = [
  { key: 'distance', label: 'Distance', sublabel: 'Carry & total distance' },
  { key: 'control', label: 'Control', sublabel: 'Spin & shot precision' },
  { key: 'feel', label: 'Feel', sublabel: 'Softness at impact' },
  { key: 'workability', label: 'Workability', sublabel: 'Shot shaping ability' },
  { key: 'forgiveness', label: 'Forgiveness', sublabel: 'Off-centre correction' },
]

function TraitBar({ trait, score }: { trait: string; score: DNATraitScore }) {
  const { score: value, signalCount } = score
  const pct = value
  const lowConfidence = signalCount <= 1

  return (
    <div className="group flex items-center gap-4">
      {/* Label */}
      <div className="w-24 shrink-0">
        <span
          className={`text-xs font-medium ${lowConfidence ? 'text-neutral-600' : 'text-neutral-400'}`}
        >
          {trait}
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800/80">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
            lowConfidence
              ? 'bg-neutral-700'
              : value >= 70
                ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-400/70'
                : value >= 40
                  ? 'bg-gradient-to-r from-neutral-500/80 to-neutral-400/60'
                  : 'bg-neutral-700/80'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Score */}
      <div className="w-8 shrink-0 text-right">
        <span
          className={`font-mono text-xs tabular-nums ${
            lowConfidence
              ? 'text-neutral-700'
              : value >= 70
                ? 'text-emerald-400/80'
                : value >= 40
                  ? 'text-neutral-400'
                  : 'text-neutral-600'
          }`}
        >
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
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
        <Header />
        <p className="text-sm text-neutral-700">
          Technical specifications required for DNA analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
      <Header />

      <div className="flex flex-col gap-3.5">
        {TRAITS.map(({ key, label }) => {
          const traitScore = profile[key]
          if (!traitScore) {
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <span className="text-xs font-medium text-neutral-700">{label}</span>
                </div>
                <div className="h-1.5 flex-1 rounded-full bg-neutral-800/50" />
                <div className="w-8 shrink-0 text-right">
                  <span className="font-mono text-xs text-neutral-800">—</span>
                </div>
              </div>
            )
          }
          return <TraitBar key={key} trait={label} score={traitScore} />
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-neutral-800">
        Derived from specifications · {profile.totalSignalCount} signals
      </p>
    </div>
  )
}

function Header() {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">
          Ball DNA
        </p>
        <p className="mt-0.5 text-[11px] text-neutral-700">Performance trait profile</p>
      </div>
      {/* Decorative instrument marks */}
      <div className="flex items-end gap-px opacity-30" aria-hidden="true">
        {[2, 3, 4, 5, 4, 3, 4, 5, 6, 5, 4, 3].map((h, i) => (
          <div
            key={i}
            className="w-px rounded-full bg-emerald-500"
            style={{ height: `${h * 2}px` }}
          />
        ))}
      </div>
    </div>
  )
}
