type Specs = {
  construction_layers: number | null
  compression: number | null
  cover_material: string | null
  core_material: string | null
  dimple_count: number | null
  dimple_pattern: string | null
  launch_profile: 'low' | 'mid' | 'high' | null
  spin_profile: 'low' | 'mid' | 'high' | null
  feel_profile: 'soft' | 'medium' | 'firm' | null
  notes: string | null
}

const GAUGE_LEVELS_3 = ['low', 'mid', 'high'] as const
const GAUGE_LEVELS_FEEL = ['soft', 'medium', 'firm'] as const

function GaugePills({ levels, value }: { levels: readonly string[]; value: string }) {
  return (
    <div className="flex items-center gap-1">
      {levels.map((level) => {
        const isActive = level === value
        return (
          <span
            key={level}
            className={`rounded px-2 py-0.5 text-[11px] capitalize transition-colors ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
                : 'text-neutral-700'
            }`}
          >
            {level}
          </span>
        )
      })}
    </div>
  )
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-200">{value}</span>
    </div>
  )
}

function CompressionBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 120) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800/80">
        {/* Track gradient: emerald at low end → neutral at high */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-600/80 to-emerald-400/60 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-neutral-200">{value}</span>
    </div>
  )
}

export function SpecGrid({ specs }: { specs: Specs | null }) {
  if (!specs) {
    return (
      <p className="text-sm text-neutral-600">Specifications not yet available for this version.</p>
    )
  }

  const hasAny = Object.values(specs).some((v) => v !== null && v !== undefined && v !== '')
  if (!hasAny) {
    return (
      <p className="text-sm text-neutral-600">Specifications not yet available for this version.</p>
    )
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {specs.construction_layers != null && (
        <SpecRow label="Construction" value={`${specs.construction_layers}-piece`} />
      )}
      {specs.compression != null && (
        <SpecRow label="Compression" value={<CompressionBar value={specs.compression} />} />
      )}
      {specs.cover_material && <SpecRow label="Cover" value={specs.cover_material} />}
      {specs.core_material && <SpecRow label="Core" value={specs.core_material} />}
      {specs.dimple_count != null && (
        <SpecRow label="Dimples" value={`${specs.dimple_count} dimples`} />
      )}
      {specs.dimple_pattern && <SpecRow label="Dimple pattern" value={specs.dimple_pattern} />}
      {specs.launch_profile && (
        <SpecRow
          label="Launch"
          value={<GaugePills levels={GAUGE_LEVELS_3} value={specs.launch_profile} />}
        />
      )}
      {specs.spin_profile && (
        <SpecRow
          label="Spin"
          value={<GaugePills levels={GAUGE_LEVELS_3} value={specs.spin_profile} />}
        />
      )}
      {specs.feel_profile && (
        <SpecRow
          label="Feel"
          value={<GaugePills levels={GAUGE_LEVELS_FEEL} value={specs.feel_profile} />}
        />
      )}
      {specs.notes && (
        <div className="py-3">
          <p className="text-xs leading-relaxed text-neutral-500">{specs.notes}</p>
        </div>
      )}
    </div>
  )
}
