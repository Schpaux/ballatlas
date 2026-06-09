import type { Route } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*, families_count:ball_families(count)')
    .order('name')

  if (error) {
    return <p className="text-red-600">Failed to load brands: {error.message}</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brands</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {brands?.length ?? 0} brands
          </p>
        </div>
        <Link
          href="/admin/brands/new"
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--ba-ink)', color: 'var(--ba-paper)' }}
        >
          + New Brand
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
              <th className="px-4 py-3 text-left font-normal" style={{ color: 'var(--ba-subtle)' }}>
                Name
              </th>
              <th className="px-4 py-3 text-left font-normal" style={{ color: 'var(--ba-subtle)' }}>
                Slug
              </th>
              <th className="px-4 py-3 text-left font-normal" style={{ color: 'var(--ba-subtle)' }}>
                Country
              </th>
              <th className="px-4 py-3 text-left font-normal" style={{ color: 'var(--ba-subtle)' }}>
                Website
              </th>
              <th
                className="px-4 py-3 text-left font-normal"
                style={{ color: 'var(--ba-subtle)' }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {brands?.map((brand) => (
              <tr key={brand.id} className="admin-table-row">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--ba-ink)' }}>
                  {brand.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ba-subtle)' }}>
                  {brand.slug}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                  {brand.country ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 transition-opacity hover:opacity-70"
                    >
                      {new URL(brand.website).hostname}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/brands/${brand.id}/edit` as Route}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--ba-green)' }}
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
