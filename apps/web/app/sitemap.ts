import type { MetadataRoute } from 'next'

import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL

  try {
    const supabase = await createClient()

    const [{ data: versions }, { data: brands }] = await Promise.all([
      supabase.from('ball_versions').select('slug, updated_at').eq('status', 'published'),
      supabase.from('brands').select('slug, updated_at'),
    ])

    const staticRoutes = ['', '/search', '/brands', '/compare', '/identify']

    const entries: MetadataRoute.Sitemap = []

    // Static routes — one entry per locale
    for (const locale of locales) {
      for (const route of staticRoutes) {
        if (route === '/search' || route === '/compare') continue // noindex
        entries.push({
          url: `${base}/${locale}${route}`,
          changeFrequency: route === '' ? 'weekly' : 'weekly',
          priority: route === '' ? 1 : 0.7,
          alternates: {
            languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${route}`])),
          },
        })
      }
    }

    // Brand pages — one entry per locale
    for (const b of brands ?? []) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/brands/${b.slug}`,
          changeFrequency: 'monthly',
          priority: 0.7,
          lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
          alternates: {
            languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/brands/${b.slug}`])),
          },
        })
      }
    }

    // Ball detail pages — one entry per locale
    for (const v of versions ?? []) {
      for (const locale of locales) {
        entries.push({
          url: `${base}/${locale}/balls/${v.slug}`,
          changeFrequency: 'monthly',
          priority: 0.8,
          lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
          alternates: {
            languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}/balls/${v.slug}`])),
          },
        })
      }
    }

    return entries
  } catch {
    return locales.map((locale) => ({
      url: `${base}/${locale}`,
      changeFrequency: 'weekly',
      priority: 1,
    }))
  }
}
