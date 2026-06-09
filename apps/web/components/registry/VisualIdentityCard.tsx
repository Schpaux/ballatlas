import { getTranslations } from 'next-intl/server'

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

function VisualRow({ label, value, isColor }: { label: string; value: string; isColor: boolean }) {
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

export async function VisualIdentityCard({ visual }: { visual: VisualSignature | null }) {
  const t = await getTranslations('visualId')

  if (!visual) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        {t('noData')}
      </p>
    )
  }

  const primaryRows = [
    { labelKey: 'color' as const, value: visual.primary_color, isColor: true },
    { labelKey: 'finish' as const, value: visual.finish, isColor: false },
    { labelKey: 'logo' as const, value: visual.logo_text, isColor: false },
    { labelKey: 'logoStyle' as const, value: visual.logo_style, isColor: false },
  ]

  const secondaryRows = [
    { labelKey: 'alignment' as const, value: visual.alignment_marking, isColor: false },
    { labelKey: 'numberStyle' as const, value: visual.number_style, isColor: false },
    { labelKey: 'numberColor' as const, value: visual.number_color, isColor: false },
    { labelKey: 'specialMarkings' as const, value: visual.special_markings, isColor: false },
  ]

  const primary = primaryRows.filter(
    (r): r is typeof r & { value: string } => r.value !== null && r.value !== ''
  )
  const secondary = secondaryRows.filter(
    (r): r is typeof r & { value: string } => r.value !== null && r.value !== ''
  )

  if (primary.length === 0 && secondary.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--ba-ghost)' }}>
        {t('noData')}
      </p>
    )
  }

  return (
    <div>
      {primary.map((r) => (
        <VisualRow
          key={r.labelKey}
          label={t(`labels.${r.labelKey}`)}
          value={r.value}
          isColor={r.isColor}
        />
      ))}
      {secondary.map((r) => (
        <VisualRow
          key={r.labelKey}
          label={t(`labels.${r.labelKey}`)}
          value={r.value}
          isColor={r.isColor}
        />
      ))}
    </div>
  )
}
