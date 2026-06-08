import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SearchBar } from '@/components/registry/SearchBar'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { env } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

const POPULAR = [
  { label: 'Pro V1', query: 'Pro V1' },
  { label: 'Chrome Soft', query: 'Chrome Soft' },
  { label: 'TP5', query: 'TP5' },
  { label: 'Z-Star', query: 'Z-Star' },
  { label: 'Tour B X', query: 'Tour B X' },
  { label: 'Vice Pro', query: 'Vice Pro' },
]

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.home' })
  const base = env.NEXT_PUBLIC_APP_URL

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${base}/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}`])),
    },
  }
}

async function getStats() {
  try {
    const supabase = await createClient()
    const [{ count: brands }, { count: families }, { count: versions }] = await Promise.all([
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('ball_families').select('*', { count: 'exact', head: true }),
      supabase
        .from('ball_versions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'discontinued']),
    ])
    return { brands: brands ?? 0, families: families ?? 0, versions: versions ?? 0 }
  } catch {
    return { brands: 0, families: 0, versions: 0 }
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [stats, t] = await Promise.all([getStats(), getTranslations({ locale, namespace: 'home' })])

  return (
    <RegistryLayout>
      <div className="flex min-h-[calc(100vh-56px)] flex-col">
        {/* Hero */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6">
          {/* Ambient glow behind search */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
            <div className="absolute left-1/2 top-20 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[100px]" />
          </div>

          <div className="relative w-full max-w-xl text-center">
            {/* Live indicator */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs text-neutral-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {t('liveIndicator')}
            </div>

            {/* Wordmark */}
            <h1 className="mb-5 text-5xl font-bold tracking-tight sm:text-6xl">
              <span className="text-neutral-100">Ball</span>
              <span className="text-neutral-600">Atlas</span>
            </h1>

            <p className="mb-10 text-base leading-relaxed text-neutral-500">{t('tagline')}</p>

            {/* Search */}
            <SearchBar placeholder={t('searchPlaceholder')} autoFocus className="mb-5" />

            {/* Popular links */}
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR.map(({ label, query }) => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs text-neutral-500 transition-all duration-150 hover:border-white/[0.10] hover:bg-white/[0.04] hover:text-neutral-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Registry stats */}
        <div className="border-t border-white/[0.04] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="grid grid-cols-3 divide-x divide-white/[0.04] text-center">
              <div className="px-4">
                <p className="font-mono text-3xl font-bold tracking-tight text-neutral-100">
                  {stats.brands}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-wider text-neutral-600">
                  {t('stats.brands')}
                </p>
              </div>
              <div className="px-4">
                <p className="font-mono text-3xl font-bold tracking-tight text-neutral-100">
                  {stats.families}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-wider text-neutral-600">
                  {t('stats.families')}
                </p>
              </div>
              <div className="px-4">
                <p className="font-mono text-3xl font-bold tracking-tight text-neutral-100">
                  {stats.versions}
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-wider text-neutral-600">
                  {t('stats.versions')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
