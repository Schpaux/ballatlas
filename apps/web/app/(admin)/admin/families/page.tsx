import type { Route } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export default async function FamiliesPage() {
  const supabase = await createClient()
  const { data: families, error } = await supabase
    .from('ball_families')
    .select('*, brand:brands(id, name, slug)')
    .order('name')
    .limit(200)

  if (error) {
    return <p className="text-red-600">Failed to load families: {error.message}</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Families</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {families?.length ?? 0} families
          </p>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--ba-line-strong)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{ borderBottom: '1px solid var(--ba-line)', background: 'var(--ba-surface)' }}
            >
              {['Brand', 'Family', 'Years', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-normal"
                  style={{ color: 'var(--ba-subtle)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {families?.map((family) => {
              const statusStyle =
                family.status === 'published'
                  ? { background: 'var(--ba-green-soft)', color: 'var(--ba-green)' }
                  : family.status === 'discontinued'
                    ? { background: 'var(--ba-paper-2)', color: 'var(--ba-ghost)' }
                    : { background: 'var(--ba-gold-soft)', color: 'var(--ba-gold)' }
              return (
                <tr key={family.id} className="admin-table-row">
                  <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                    {(family.brand as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ba-ink)' }}>
                    {family.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ba-subtle)' }}>
                    {family.first_release_year ?? '?'} – {family.last_release_year ?? 'present'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={statusStyle}
                    >
                      {family.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/families/${family.id}/edit` as Route}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ color: 'var(--ba-green)' }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
