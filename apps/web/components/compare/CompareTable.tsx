'use client'

import type { CSSProperties } from 'react'
import { useTranslations } from 'next-intl'

import type { CompareBallProfile, FieldRow, HighlightTag } from '@ballatlas/golf-data'

import { Link } from '@/i18n/navigation'

type CompareTableProps = {
  profiles: CompareBallProfile[]
  rows: FieldRow[]
}

function cellStyle(tag: HighlightTag): CSSProperties {
  switch (tag) {
    case 'highest':
      return { color: 'var(--ba-green)', fontWeight: 500 }
    case 'lowest':
      return { color: 'var(--ba-gold)', fontWeight: 500 }
    case 'unique':
      return { color: 'var(--ba-seg-blue)' }
    case 'missing':
      return { color: 'var(--ba-ghost)', fontStyle: 'italic' }
    default:
      return { color: 'var(--ba-ink)' }
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
  const t = useTranslations('compare.legend')

  if (profiles.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--ba-line-strong)' }}>
            <th
              className="w-36 pb-4 text-left text-xs font-medium uppercase tracking-wider sm:w-44"
              style={{ color: 'var(--ba-ghost)' }}
            />
            {profiles.map((p) => (
              <th key={p.id} className="pb-4 text-left font-normal">
                <div className="pr-4">
                  <p className="text-xs" style={{ color: 'var(--ba-ghost)' }}>
                    {p.brandName}
                  </p>
                  <Link
                    href={`/balls/${p.slug}`}
                    className="font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--ba-ink)' }}
                  >
                    {p.name}
                  </Link>
                  {p.releaseYear && (
                    <p className="font-mono text-xs" style={{ color: 'var(--ba-ghost)' }}>
                      {p.releaseYear}
                    </p>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const allMissing = row.highlights.every((h) => h === 'missing')
            if (allMissing) return null

            return (
              <tr key={row.key} className="admin-table-row">
                <td className="py-3 pr-4 text-xs" style={{ color: 'var(--ba-subtle)' }}>
                  {row.label}
                </td>
                {profiles.map((p, i) => (
                  <td
                    key={p.id}
                    className="py-3 pr-4"
                    style={cellStyle(row.highlights[i] ?? 'missing')}
                  >
                    {formatValue(row.values[i] ?? null, row.format)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-6 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--ba-ghost)' }}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ba-green)' }} />
          {t('highest')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ba-gold)' }} />
          {t('lowest')}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ba-seg-blue)' }} />
          {t('unique')}
        </div>
      </div>
    </div>
  )
}
