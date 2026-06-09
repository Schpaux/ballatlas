import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { GolfBall } from '@/components/registry/GolfBall'
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
      <div className="flex min-h-[calc(100vh-64px)] flex-col">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
          {/* Floating golf ball — background, centered behind content */}
          <div
            className="pointer-events-none absolute right-[5%] top-1/2 -translate-y-1/2 opacity-20 sm:opacity-30 lg:right-[10%] lg:opacity-40"
            aria-hidden="true"
          >
            <GolfBall size="xl" float />
          </div>

          {/* Hero content — centered */}
          <div className="relative z-10 w-full max-w-2xl text-center">
            {/* Kicker badge */}
            <div className="anim d1 mb-6 flex justify-center">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em]"
                style={{
                  background: 'var(--ba-green-soft)',
                  color: 'var(--ba-green)',
                  border: '1px solid rgba(31,106,71,0.18)',
                }}
              >
                {t('liveIndicator')}
              </span>
            </div>

            {/* Eyebrow */}
            <p className="anim d2 kicker mb-3">Golf Intelligence Platform</p>

            {/* Wordmark */}
            <h1 className="anim d3 mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span style={{ color: 'var(--ba-ink)' }}>Ball</span>
              <span style={{ color: 'var(--ba-green)' }}>Atlas</span>
            </h1>

            <p
              className="anim d4 mb-10 text-base leading-relaxed"
              style={{ color: 'var(--ba-subtle)' }}
            >
              {t('tagline')}
            </p>

            {/* Search */}
            <div className="anim d5 mb-5">
              <SearchBar placeholder={t('searchPlaceholder')} autoFocus />
            </div>

            {/* Popular searches */}
            <div className="anim d6 flex flex-wrap justify-center gap-2">
              {POPULAR.map(({ label, query }) => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="rounded-full px-3 py-1 text-xs transition-all duration-150"
                  style={{
                    background: 'var(--ba-surface)',
                    border: '1px solid var(--ba-line-strong)',
                    color: 'var(--ba-subtle)',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats band ────────────────────────────────────────────────────── */}
        <div
          className="px-4 py-8 sm:px-6"
          style={{ borderTop: '1px solid var(--ba-line)', background: 'var(--ba-paper-2)' }}
        >
          <div className="mx-auto max-w-6xl">
            <div
              className="grid grid-cols-3 divide-x text-center"
              style={{ borderColor: 'var(--ba-line)' }}
            >
              <div className="px-4">
                <p
                  className="font-mono text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--ba-ink)' }}
                >
                  {stats.brands}
                </p>
                <p className="kicker mt-1">{t('stats.brands')}</p>
              </div>
              <div className="px-4">
                <p
                  className="font-mono text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--ba-ink)' }}
                >
                  {stats.families}
                </p>
                <p className="kicker mt-1">{t('stats.families')}</p>
              </div>
              <div className="px-4">
                <p
                  className="font-mono text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--ba-ink)' }}
                >
                  {stats.versions}
                </p>
                <p className="kicker mt-1">{t('stats.versions')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
