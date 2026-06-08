import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.brands' })
  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${base}/${locale}/brands`,
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/brands`])),
    },
  }
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

    const familiesByBrand = (families ?? []).reduce<Record<string, string[]>>((acc, f) => {
      if (!acc[f.brand_id]) acc[f.brand_id] = []
      acc[f.brand_id]!.push(f.id)
      return acc
    }, {})

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
      return { ...brand, familyCount: brandFamilyIds.length, versionCount }
    })
  } catch {
    return []
  }
}

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [brands, t] = await Promise.all([
    getBrandsWithStats(),
    getTranslations({ locale, namespace: 'brands' }),
  ])

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">{t('title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('subtitle', { count: brands.length })}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-neutral-900/50 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-white/[0.13] hover:bg-neutral-900/70 hover:shadow-[0_8px_32px_rgba(0,0,0,0.32)]"
            >
              {/* Top inner highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-neutral-200 transition-colors group-hover:text-white">
                  {brand.name}
                </p>
                {brand.country && (
                  <span className="shrink-0 rounded border border-white/[0.05] bg-neutral-800/70 px-1.5 py-0.5 font-mono text-xs text-neutral-500">
                    {brand.country}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-neutral-600">
                <span>{t('models', { count: brand.familyCount })}</span>
                <span>{t('versions', { count: brand.versionCount })}</span>
              </div>
            </Link>
          ))}
        </div>

        {brands.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-600">{t('empty')}</p>
        )}
      </div>
    </RegistryLayout>
  )
}
