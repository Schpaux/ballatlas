'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

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

  const filterBtn = (label: string, isActive: boolean, href: string) => (
    <a
      key={label}
      href={href}
      onClick={(e) => {
        e.preventDefault()
        router.push(href)
      }}
      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
        isActive
          ? 'border-white/[0.20] bg-white/[0.08] text-neutral-100'
          : 'border-white/[0.06] bg-transparent text-neutral-500 hover:border-white/[0.10] hover:text-neutral-300'
      }`}
    >
      {label}
    </a>
  )

  const panelContent = (
    <div className="flex flex-col gap-6">
      {/* Brand */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">Brand</p>
        <div className="flex flex-wrap gap-1.5">
          {filterBtn('All', !activeBrand, buildUrl({ brand: '' }))}
          {brands
            .slice(0, 12)
            .map((b) => filterBtn(b.name, activeBrand === b.slug, buildUrl({ brand: b.slug })))}
        </div>
      </div>

      {/* Segment */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">
          Segment
        </p>
        <div className="flex flex-wrap gap-1.5">
          {filterBtn('All', !activeSegment, buildUrl({ segment: '' }))}
          {SEGMENTS.map((s) =>
            filterBtn(s.name, activeSegment === s.slug, buildUrl({ segment: s.slug }))
          )}
        </div>
      </div>

      {/* Year */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">Year</p>
        <div className="flex flex-wrap gap-1.5">
          {filterBtn('All', !activeYear, buildUrl({ year: '' }))}
          {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) =>
            filterBtn(String(y), activeYear === String(y), buildUrl({ year: String(y) }))
          )}
        </div>
      </div>

      {/* Cover material */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">Cover</p>
        <div className="flex flex-wrap gap-1.5">
          {filterBtn('All', !activeCover, buildUrl({ cover: '' }))}
          {COVER_MATERIALS.map((m) => filterBtn(m, activeCover === m, buildUrl({ cover: m })))}
        </div>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={() => router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}
          className="text-left text-xs text-neutral-600 underline-offset-2 hover:text-neutral-400 hover:underline"
        >
          Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
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
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-xs text-neutral-300">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            {panelContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden w-52 shrink-0 lg:block">{panelContent}</div>
    </>
  )
}
