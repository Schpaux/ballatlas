'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import type { AutocompleteSuggestion } from '@/app/api/autocomplete/route'
import { useRouter } from '@/i18n/navigation'

type BallSelectorProps = {
  selectedSlugs: string[]
  selectedNames: Record<string, string>
}

export function BallSelector({ selectedSlugs, selectedNames }: BallSelectorProps) {
  const t = useTranslations('compare')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`)
        const data: AutocompleteSuggestion[] = await res.json()
        const filtered = data.filter((s) => s.type !== 'version' || !selectedSlugs.includes(s.slug))
        setSuggestions(filtered)
        setOpen(filtered.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selectedSlugs])

  function addBall(slug: string) {
    if (selectedSlugs.includes(slug) || selectedSlugs.length >= 4) return
    const next = [...selectedSlugs, slug]
    router.push(`/compare?balls=${next.join(',')}`)
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  function removeBall(slug: string) {
    const next = selectedSlugs.filter((s) => s !== slug)
    if (next.length === 0) {
      router.push('/compare')
    } else {
      router.push(`/compare?balls=${next.join(',')}`)
    }
  }

  const canAdd = selectedSlugs.length < 4

  return (
    <div className="mb-8">
      {selectedSlugs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedSlugs.map((slug) => (
            <div
              key={slug}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{
                background: 'var(--ba-surface)',
                border: '1px solid var(--ba-line-strong)',
                color: 'var(--ba-ink)',
              }}
            >
              <span>{selectedNames[slug] ?? slug}</span>
              <button
                onClick={() => removeBall(slug)}
                className="ml-0.5 transition-opacity hover:opacity-70"
                style={{ color: 'var(--ba-ghost)' }}
                aria-label={`Remove ${selectedNames[slug] ?? slug}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="relative max-w-md">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={selectedSlugs.length === 0 ? t('searchPlaceholder') : t('addPlaceholder')}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            style={{
              background: 'var(--ba-paper)',
              border: '1px solid var(--ba-line-strong)',
              color: 'var(--ba-ink)',
            }}
          />
          {loading && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border border-t-transparent"
                style={{ borderColor: 'var(--ba-line-strong)', borderTopColor: 'var(--ba-green)' }}
              />
            </div>
          )}

          {open && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg shadow-xl"
              style={{
                background: 'var(--ba-paper)',
                border: '1px solid var(--ba-line-strong)',
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.href}
                  onMouseDown={() => s.type === 'version' && addBall(s.slug)}
                  onClick={() => {
                    if (s.type !== 'version') {
                      router.push(s.href as never)
                    }
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-black/[0.03]"
                >
                  <div>
                    <span style={{ color: 'var(--ba-ink)' }}>{s.name}</span>
                    {s.meta && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--ba-ghost)' }}>
                        {s.meta}
                      </span>
                    )}
                  </div>
                  <span
                    className="shrink-0 text-xs capitalize"
                    style={{ color: 'var(--ba-ghost)' }}
                  >
                    {s.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlugs.length >= 4 && (
        <p className="mt-2 text-xs" style={{ color: 'var(--ba-ghost)' }}>
          {t('maxBalls')}
        </p>
      )}
    </div>
  )
}
