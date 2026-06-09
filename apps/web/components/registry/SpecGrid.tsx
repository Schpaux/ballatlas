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
            className="rounded px-2 py-0.5 text-[11px] capitalize transition-colors"
            style={
              isActive
                ? {
                    background: 'var(--ba-green-soft)',
                    color: 'var(--ba-green)',
                    boxShadow: '0 0 0 1px rgba(31,106,71,0.2)',
                  }
                : { color: 'var(--ba-ghost)' }
            }
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
    <div
      className="flex items-center justify-between gap-4 py-3"
      style={{ borderBottom: '1px solid var(--ba-line)' }}
    >
      <span className="text-sm" style={{ color: 'var(--ba-subtle)' }}>
        {label}
      </span>
      <span className="text-right text-sm" style={{ color: 'var(--ba-ink)' }}>
        {value}
      </span>
    </div>
  )
}

function CompressionBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 120) * 100)
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, var(--ba-green-d), var(--ba-green-l))',
          }}
        />
      </div>
      <span className="font-mono" style={{ color: 'var(--ba-ink)' }}>
        {value}
      </span>
    </div>
  )
}

export function SpecGrid({ specs }: { specs: Specs | null }) {
  if (!specs) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        Specifications not yet available for this version.
      </p>
    )
  }

  const hasAny = Object.values(specs).some((v) => v !== null && v !== undefined && v !== '')
  if (!hasAny) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        Specifications not yet available for this version.
      </p>
    )
  }

  return (
    <div>
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
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ba-subtle)' }}>
            {specs.notes}
          </p>
        </div>
      )}
    </div>
  )
}
