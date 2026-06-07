import type { MetadataRoute } from 'next'

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

    return [
      {
        url: base,
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${base}/search`,
        changeFrequency: 'daily',
        priority: 0.3,
      },
      {
        url: `${base}/brands`,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      ...(brands ?? []).map((b) => ({
        url: `${base}/brands/${b.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
      })),
      ...(versions ?? []).map((v) => ({
        url: `${base}/balls/${v.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
      })),
    ]
  } catch {
    return [{ url: base, changeFrequency: 'weekly', priority: 1 }]
  }
}
