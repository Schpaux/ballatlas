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
    return <p className="text-red-400">Failed to load families: {error.message}</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Families</h1>
          <p className="mt-1 text-sm text-neutral-400">{families?.length ?? 0} families</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Brand</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Family</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Years</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Status</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400"></th>
            </tr>
          </thead>
          <tbody>
            {families?.map((family) => (
              <tr
                key={family.id}
                className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
              >
                <td className="px-4 py-3 text-neutral-400">
                  {(family.brand as { name: string } | null)?.name ?? '—'}
                </td>
                <td className="px-4 py-3 font-medium">{family.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                  {family.first_release_year ?? '?'} – {family.last_release_year ?? 'present'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      family.status === 'published'
                        ? 'bg-green-950 text-green-400'
                        : family.status === 'discontinued'
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-yellow-950 text-yellow-400'
                    }`}
                  >
                    {family.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/families/${family.id}/edit` as Route}
                    className="text-xs text-neutral-500 hover:text-neutral-200"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
