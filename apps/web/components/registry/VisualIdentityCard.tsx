type VisualSignature = {
  primary_color: string | null
  finish: 'glossy' | 'matte' | 'satin' | null
  logo_style: string | null
  logo_text: string | null
  alignment_marking: string | null
  number_style: string | null
  number_color: string | null
  special_markings: string | null
}

const COLOR_SWATCHES: Record<string, string> = {
  white: '#f5f5f5',
  'matte white': '#f5f5f5',
  'glossy white': '#ffffff',
  yellow: '#fde047',
  orange: '#f97316',
  pink: '#ec4899',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  black: '#262626',
}

function ColorSwatch({ color }: { color: string }) {
  const hex = COLOR_SWATCHES[color.toLowerCase()]
  if (!hex) return null
  return (
    <span
      className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle"
      style={{
        backgroundColor: hex,
        border: '1px solid var(--ba-line-strong)',
      }}
    />
  )
}

function VisualRow({ label, value }: { label: string; value: string }) {
  const isColor = label === 'Color'
  return (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: '1px solid var(--ba-line)' }}
    >
      <span className="text-sm" style={{ color: 'var(--ba-subtle)' }}>
        {label}
      </span>
      <span className="text-right text-sm" style={{ color: 'var(--ba-ink)' }}>
        {isColor && <ColorSwatch color={value} />}
        {value}
      </span>
    </div>
  )
}

export function VisualIdentityCard({ visual }: { visual: VisualSignature | null }) {
  if (!visual) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        Visual identification data not yet available.
      </p>
    )
  }

  const primaryRows: Array<{ label: string; value: string | null }> = [
    { label: 'Color', value: visual.primary_color },
    { label: 'Finish', value: visual.finish },
    { label: 'Logo', value: visual.logo_text },
    { label: 'Logo style', value: visual.logo_style },
  ]

  const secondaryRows: Array<{ label: string; value: string | null }> = [
    { label: 'Alignment', value: visual.alignment_marking },
    { label: 'Number style', value: visual.number_style },
    { label: 'Number color', value: visual.number_color },
    { label: 'Special markings', value: visual.special_markings },
  ]

  const primary = primaryRows.filter(
    (r): r is { label: string; value: string } => r.value !== null && r.value !== ''
  )
  const secondary = secondaryRows.filter(
    (r): r is { label: string; value: string } => r.value !== null && r.value !== ''
  )

  if (primary.length === 0 && secondary.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        Visual identification data not yet available.
      </p>
    )
  }

  return (
    <div>
      {primary.map((r) => (
        <VisualRow key={r.label} label={r.label} value={r.value} />
      ))}
      {secondary.map((r) => (
        <VisualRow key={r.label} label={r.label} value={r.value} />
      ))}
    </div>
  )
}
