import type { Metadata, Route } from 'next'
import Link from 'next/link'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Golf Ball Brands | BallAtlas',
  description: 'Explore every golf ball manufacturer in the BallAtlas registry.',
}

type BrandStat = {
  id: string
  name: string
  slug: string
  country: string | null
  website: string | null
  familyCount: number
  versionCount: number
}

async function getBrandsWithStats(): Promise<BrandStat[]> {
  try {
    const supabase = await createClient()

    const [{ data: brands }, { data: families }, { data: versions }] = await Promise.all([
      supabase.from('brands').select('id, name, slug, country, website').order('name'),
      supabase.from('ball_families').select('id, brand_id'),
      supabase
        .from('ball_versions')
        .select('id, family_id')
        .in('status', ['published', 'discontinued']),
    ])

    if (!brands) return []

    // Group families by brand
    const familiesByBrand = (families ?? []).reduce<Record<string, string[]>>((acc, f) => {
      if (!acc[f.brand_id]) acc[f.brand_id] = []
      acc[f.brand_id]!.push(f.id)
      return acc
    }, {})

    // Group versions by family
    const versionsByFamily = (versions ?? []).reduce<Record<string, number>>((acc, v) => {
      acc[v.family_id] = (acc[v.family_id] ?? 0) + 1
      return acc
    }, {})

    return brands.map((brand) => {
      const brandFamilyIds = familiesByBrand[brand.id] ?? []
      const versionCount = brandFamilyIds.reduce(
        (sum, fid) => sum + (versionsByFamily[fid] ?? 0),
        0
      )
      return {
        ...brand,
        familyCount: brandFamilyIds.length,
        versionCount,
      }
    })
  } catch {
    return []
  }
}

export default async function BrandsPage() {
  const brands = await getBrandsWithStats()

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Brands</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {brands.length} manufacturer{brands.length !== 1 ? 's' : ''} in the registry
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}` as Route}
              className="group flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-neutral-200 transition-colors group-hover:text-white">
                  {brand.name}
                </p>
                {brand.country && (
                  <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-500">
                    {brand.country}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-neutral-600">
                <span>
                  {brand.familyCount} model{brand.familyCount !== 1 ? 's' : ''}
                </span>
                <span>
                  {brand.versionCount} version{brand.versionCount !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {brands.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-600">
            No brands in the registry yet.
          </p>
        )}
      </div>
    </RegistryLayout>
  )
}
