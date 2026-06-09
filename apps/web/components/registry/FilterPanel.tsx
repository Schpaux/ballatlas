'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { useRouter } from '@/i18n/navigation'

type Brand = { id: string; name: string; slug: string }

const SEGMENTS = [
  { slug: 'tour-premium', name: 'Tour Premium' },
  { slug: 'performance', name: 'Performance' },
  { slug: 'soft-feel', name: 'Soft Feel' },
  { slug: 'value', name: 'Value' },
  { slug: 'distance', name: 'Distance' },
]

const COVER_MATERIALS = ['Urethane', 'Surlyn', 'Ionomer', 'Rubber']

export function FilterPanel({ brands }: { brands: Brand[] }) {
  const t = useTranslations('filters')
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)

  const q = params.get('q') ?? ''
  const activeBrand = params.get('brand') ?? ''
  const activeSegment = params.get('segment') ?? ''
  const activeYear = params.get('year') ?? ''
  const activeCover = params.get('cover') ?? ''
  const activeCompMin = params.get('compression_min') ?? ''
  const activeCompMax = params.get('compression_max') ?? ''

  const activeCount =
    [activeBrand, activeSegment, activeYear, activeCover].filter(Boolean).length +
    (activeCompMin || activeCompMax ? 1 : 0)

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const next = new URLSearchParams()
      const current: Record<string, string> = {
        q,
        brand: activeBrand,
        segment: activeSegment,
        year: activeYear,
        cover: activeCover,
        compression_min: activeCompMin,
        compression_max: activeCompMax,
        ...overrides,
      }
      Object.entries(current).forEach(([k, v]) => {
        if (v) next.set(k, v)
      })
      return `/search?${next.toString()}`
    },
    [q, activeBrand, activeSegment, activeYear, activeCover, activeCompMin, activeCompMax]
  )

  const filterChip = (label: string, isActive: boolean, href: string) => (
    <a
      key={label}
      href={href}
      onClick={(e) => {
        e.preventDefault()
        router.push(href)
      }}
      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={{
        background: isActive ? 'var(--ba-ink)' : 'var(--ba-surface)',
        color: isActive ? 'var(--ba-paper)' : 'var(--ba-subtle)',
        border: isActive ? '1px solid var(--ba-ink)' : '1px solid var(--ba-line-strong)',
      }}
    >
      {label}
    </a>
  )

  const sectionLabel = (text: string) => (
    <p
      className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: 'var(--ba-ghost)' }}
    >
      {text}
    </p>
  )

  const panelContent = (
    <div className="flex flex-col gap-5">
      <div>
        {sectionLabel(t('brand'))}
        <div className="flex flex-wrap gap-1.5">
          {filterChip(t('all'), !activeBrand, buildUrl({ brand: '' }))}
          {brands
            .slice(0, 12)
            .map((b) => filterChip(b.name, activeBrand === b.slug, buildUrl({ brand: b.slug })))}
        </div>
      </div>

      <div>
        {sectionLabel(t('segment'))}
        <div className="flex flex-wrap gap-1.5">
          {filterChip(t('all'), !activeSegment, buildUrl({ segment: '' }))}
          {SEGMENTS.map((s) =>
            filterChip(s.name, activeSegment === s.slug, buildUrl({ segment: s.slug }))
          )}
        </div>
      </div>

      <div>
        {sectionLabel(t('year'))}
        <div className="flex flex-wrap gap-1.5">
          {filterChip(t('all'), !activeYear, buildUrl({ year: '' }))}
          {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) =>
            filterChip(String(y), activeYear === String(y), buildUrl({ year: String(y) }))
          )}
        </div>
      </div>

      <div>
        {sectionLabel(t('cover'))}
        <div className="flex flex-wrap gap-1.5">
          {filterChip(t('all'), !activeCover, buildUrl({ cover: '' }))}
          {COVER_MATERIALS.map((m) => filterChip(m, activeCover === m, buildUrl({ cover: m })))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}
          className="text-left text-xs underline-offset-2 hover:underline"
          style={{ color: 'var(--ba-clay)' }}
        >
          {t('clearFilters', { count: activeCount })}
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors"
          style={{
            background: 'var(--ba-surface)',
            border: '1px solid var(--ba-line-strong)',
            color: 'var(--ba-subtle)',
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25"
            />
          </svg>
          {t('title')}
          {activeCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--ba-ink)', color: 'var(--ba-paper)' }}
            >
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="mt-3 rounded-xl p-4"
            style={{
              background: 'var(--ba-surface)',
              border: '1px solid var(--ba-line-strong)',
            }}
          >
            {panelContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-52 shrink-0 lg:block">{panelContent}</div>
    </>
  )
}
