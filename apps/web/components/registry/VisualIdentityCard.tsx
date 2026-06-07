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

function VisualRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-200">{value}</span>
    </div>
  )
}

export function VisualIdentityCard({ visual }: { visual: VisualSignature | null }) {
  if (!visual) {
    return <p className="text-sm text-neutral-600">Visual identification data not yet available.</p>
  }

  const allRows: Array<{ label: string; value: string | null }> = [
    { label: 'Primary color', value: visual.primary_color },
    { label: 'Finish', value: visual.finish },
    { label: 'Logo text', value: visual.logo_text },
    { label: 'Logo style', value: visual.logo_style },
    { label: 'Alignment marking', value: visual.alignment_marking },
    { label: 'Number style', value: visual.number_style },
    { label: 'Number color', value: visual.number_color },
    { label: 'Special markings', value: visual.special_markings },
  ]
  const rows = allRows.filter(
    (r): r is { label: string; value: string } => r.value !== null && r.value !== ''
  )

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-600">Visual identification data not yet available.</p>
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {rows.map((r) => (
        <VisualRow key={r.label} label={r.label} value={r.value} />
      ))}
    </div>
  )
}
