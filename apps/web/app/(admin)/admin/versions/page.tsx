import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
    return <p className="text-red-400">Failed to load versions: {error.message}</p>
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Versions</h1>
          <p className="mt-1 text-sm text-neutral-400">{count ?? 0} versions</p>
        </div>
        <Link
          href="/admin/versions/new"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          + New Version
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Brand</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Name</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Year</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">MSRP</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {versions?.map((v) => {
              // @ts-expect-error — nested join type inference limitation
              const brandName = v.family?.brand?.name as string | undefined
              // @ts-expect-error
              const familyName = v.family?.name as string | undefined
              return (
                <tr
                  key={v.id}
                  className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
                >
                  <td className="px-4 py-3 text-neutral-400">{brandName ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/versions/${v.id}`} className="hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{v.release_year ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                    {v.msrp_usd ? `$${v.msrp_usd}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.status === 'published'
                          ? 'bg-green-950 text-green-400'
                          : v.status === 'discontinued'
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-yellow-950 text-yellow-400'
                      }`}
                    >
                      {v.status}
                    </span>
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
              href={`/admin/versions?page=${page - 1}`}
              className="text-neutral-400 hover:text-neutral-100"
            >
              ← Previous
            </Link>
          )}
          <span className="text-neutral-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/versions?page=${page + 1}`}
              className="text-neutral-400 hover:text-neutral-100"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
