import type { Route } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export default async function VersionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const {
    data: versions,
    error,
    count,
  } = await supabase
    .from('ball_versions')
    .select(
      `id, name, slug, release_year, status, msrp_usd,
       family:ball_families(name, brand:brands(name))`,
      { count: 'exact' }
    )
    .order('release_year', { ascending: false })
    .range(from, to)

  if (error) {
    return <p className="text-red-600">Failed to load versions: {error.message}</p>
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Versions</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {count ?? 0} versions
          </p>
        </div>
        <Link
          href="/admin/versions/new"
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--ba-ink)', color: 'var(--ba-paper)' }}
        >
          + New Version
        </Link>
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
              {['Brand', 'Name', 'Year', 'MSRP', 'Status', ''].map((h) => (
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
            {versions?.map((v) => {
              const brandName = v.family?.brand?.name as string | undefined
              const statusStyle =
                v.status === 'published'
                  ? { background: 'var(--ba-green-soft)', color: 'var(--ba-green)' }
                  : v.status === 'discontinued'
                    ? { background: 'var(--ba-paper-2)', color: 'var(--ba-ghost)' }
                    : { background: 'var(--ba-gold-soft)', color: 'var(--ba-gold)' }
              return (
                <tr key={v.id} className="admin-table-row">
                  <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                    {brandName ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ba-ink)' }}>
                    <Link
                      href={`/admin/versions/${v.id}` as Route}
                      className="transition-opacity hover:opacity-70"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                    {v.release_year ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ba-subtle)' }}>
                    {v.msrp_usd ? `$${v.msrp_usd}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      style={statusStyle}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/versions/${v.id}/edit` as Route}
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

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/versions?page=${page - 1}` as Route}
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--ba-subtle)' }}
            >
              ← Previous
            </Link>
          )}
          <span style={{ color: 'var(--ba-ghost)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/versions?page=${page + 1}` as Route}
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--ba-subtle)' }}
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
