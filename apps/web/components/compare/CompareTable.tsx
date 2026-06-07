import type { CompareBallProfile, FieldRow, HighlightTag } from '@ballatlas/golf-data'

type CompareTableProps = {
  profiles: CompareBallProfile[]
  rows: FieldRow[]
}

function cellClass(tag: HighlightTag): string {
  switch (tag) {
    case 'highest':
      return 'text-emerald-400 font-medium'
    case 'lowest':
      return 'text-amber-400 font-medium'
    case 'unique':
      return 'text-sky-400'
    case 'missing':
      return 'text-neutral-700 italic'
    default:
      return 'text-neutral-300'
  }
}

function formatValue(value: string | number | null, format?: FieldRow['format']): string {
  if (value == null) return '—'
  if (format === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return String(value)
}

export function CompareTable({ profiles, rows }: CompareTableProps) {
  if (profiles.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="w-36 pb-4 text-left text-xs font-medium uppercase tracking-wider text-neutral-600 sm:w-44" />
            {profiles.map((p) => (
              <th key={p.id} className="pb-4 text-left font-normal">
                <div className="pr-4">
                  <p className="text-xs text-neutral-600">{p.brandName}</p>
                  <a
                    href={`/balls/${p.slug}`}
                    className="font-medium text-neutral-200 transition-colors hover:text-white"
                  >
                    {p.name}
                  </a>
                  {p.releaseYear && (
                    <p className="font-mono text-xs text-neutral-600">{p.releaseYear}</p>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            // Skip rows where every value is missing
            const allMissing = row.highlights.every((h) => h === 'missing')
            if (allMissing) return null

            return (
              <tr
                key={row.key}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-3 pr-4 text-xs text-neutral-500">{row.label}</td>
                {profiles.map((p, i) => (
                  <td
                    key={p.id}
                    className={`py-3 pr-4 ${cellClass(row.highlights[i] ?? 'missing')}`}
                  >
                    {formatValue(row.values[i] ?? null, row.format)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Highest value
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-600" />
          Lowest value
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-700" />
          Unique to this ball
        </div>
      </div>
    </div>
  )
}
