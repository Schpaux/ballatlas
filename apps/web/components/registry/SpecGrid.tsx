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

function ProfilePills({ levels, value }: { levels: readonly string[]; value: string }) {
  return (
    <div className="flex items-center gap-1">
      {levels.map((level) => (
        <span
          key={level}
          className={`rounded px-2 py-0.5 text-[11px] capitalize transition-colors ${
            level === value ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-700'
          }`}
        >
          {level}
        </span>
      ))}
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
    <div className="divide-y divide-white/[0.04]">
      {specs.construction_layers != null && (
        <SpecRow label="Construction" value={`${specs.construction_layers}-piece`} />
      )}
      {specs.compression != null && (
        <SpecRow
          label="Compression"
          value={
            <div className="flex items-center gap-3">
              <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-neutral-400"
                  style={{ width: `${Math.min(100, (specs.compression / 120) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-neutral-200">{specs.compression}</span>
            </div>
          }
        />
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
          value={
            <ProfilePills levels={['low', 'mid', 'high'] as const} value={specs.launch_profile} />
          }
        />
      )}
      {specs.spin_profile && (
        <SpecRow
          label="Spin"
          value={
            <ProfilePills levels={['low', 'mid', 'high'] as const} value={specs.spin_profile} />
          }
        />
      )}
      {specs.feel_profile && (
        <SpecRow
          label="Feel"
          value={
            <ProfilePills levels={['soft', 'medium', 'firm'] as const} value={specs.feel_profile} />
          }
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
