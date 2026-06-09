import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { resolveBrandLogoUrlsBatch } from '@/lib/brand-logo'
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
  logoUrl: string | null
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

    const brandIds = brands.map((b) => b.id)
    const logoMap = await resolveBrandLogoUrlsBatch(supabase, brandIds)

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
        logoUrl: logoMap.get(brand.id) ?? null,
      }
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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ba-ink)' }}>
            {t('title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {t('subtitle', { count: brands.length })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex flex-col gap-3 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(24,36,29,0.10)]"
              style={{
                background: 'var(--ba-surface)',
                border: '1px solid var(--ba-line-strong)',
              }}
            >
              {brand.logoUrl && (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-6 w-auto max-w-[100px] object-contain transition-opacity group-hover:opacity-70"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <p
                  className="font-medium transition-opacity group-hover:opacity-80"
                  style={{ color: 'var(--ba-ink)' }}
                >
                  {brand.name}
                </p>
                {brand.country && (
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 font-mono text-xs"
                    style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
                  >
                    {brand.country}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--ba-ghost)' }}>
                <span>{t('models', { count: brand.familyCount })}</span>
                <span>{t('versions', { count: brand.versionCount })}</span>
              </div>
            </Link>
          ))}
        </div>

        {brands.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--ba-ghost)' }}>
            {t('empty')}
          </p>
        )}
      </div>
    </RegistryLayout>
  )
}
