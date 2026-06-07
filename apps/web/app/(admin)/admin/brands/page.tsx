import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*, families_count:ball_families(count)')
    .order('name')

  if (error) {
    return <p className="text-red-400">Failed to load brands: {error.message}</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brands</h1>
          <p className="mt-1 text-sm text-neutral-400">{brands?.length ?? 0} brands</p>
        </div>
        <Link
          href="/admin/brands/new"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          + New Brand
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Name</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Slug</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Country</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Website</th>
            </tr>
          </thead>
          <tbody>
            {brands?.map((brand) => (
              <tr
                key={brand.id}
                className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
              >
                <td className="px-4 py-3 font-medium">{brand.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">{brand.slug}</td>
                <td className="px-4 py-3 text-neutral-400">{brand.country ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-neutral-100"
                    >
                      {new URL(brand.website).hostname}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
