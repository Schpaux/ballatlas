'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AutocompleteSuggestion } from '@/app/api/autocomplete/route'
import { useRouter } from '@/i18n/navigation'

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--ba-ghost)' }}
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.364 10.07C8.523 10.664 7.502 11 6.5 11C4.015 11 2 8.985 2 6.5C2 4.015 4.015 2 6.5 2C8.985 2 11 4.015 11 6.5C11 7.502 10.664 8.523 10.07 9.364L13.354 12.646C13.549 12.842 13.549 13.158 13.354 13.354C13.158 13.549 12.842 13.549 12.646 13.354L9.364 10.07Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

const TYPE_LABELS: Record<string, string> = {
  ball: 'Ball',
  brand: 'Brand',
  family: 'Family',
}

export function SearchBar({
  initialValue = '',
  placeholder,
  autoFocus = false,
  className,
}: {
  initialValue?: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const t = useTranslations('search')
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const acRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const resolvedPlaceholder = placeholder ?? t('placeholder')

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const navigate = useCallback(
    (query: string) => {
      setShowSuggestions(false)
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      } else {
        router.push('/search')
      }
    },
    [router]
  )

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    if (acRef.current) clearTimeout(acRef.current)
    acRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`)
        const data: AutocompleteSuggestion[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 200)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    fetchSuggestions(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(v), 350)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (acRef.current) clearTimeout(acRef.current)
    setShowSuggestions(false)
    navigate(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const s = suggestions[activeIndex]
      if (s) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setShowSuggestions(false)
        router.push(s.href)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <SearchIcon />
        </div>
        <input
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={resolvedPlaceholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          className="h-14 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition-all duration-200"
          style={{
            background: 'var(--ba-surface)',
            border: '1px solid var(--ba-line-strong)',
            color: 'var(--ba-ink)',
            caretColor: 'var(--ba-green)',
          }}
          onMouseEnter={(e) => {
            ;(e.target as HTMLInputElement).style.borderColor = 'rgba(24,36,29,0.28)'
          }}
          onMouseLeave={(e) => {
            if (document.activeElement !== e.target) {
              ;(e.target as HTMLInputElement).style.borderColor = 'var(--ba-line-strong)'
            }
          }}
          onFocusCapture={(e) => {
            ;(e.target as HTMLInputElement).style.borderColor = 'var(--ba-green)'
            ;(e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(31,106,71,0.10)'
          }}
          onBlurCapture={(e) => {
            ;(e.target as HTMLInputElement).style.borderColor = 'var(--ba-line-strong)'
            ;(e.target as HTMLInputElement).style.boxShadow = 'none'
            setTimeout(() => setShowSuggestions(false), 150)
          }}
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl shadow-[0_16px_48px_rgba(24,36,29,0.14)]"
          style={{
            background: 'var(--ba-surface)',
            border: '1px solid var(--ba-line-strong)',
          }}
        >
          {suggestions.map((s, i) => (
            <a
              key={s.href}
              href={s.href}
              onMouseDown={(e) => {
                e.preventDefault()
                if (debounceRef.current) clearTimeout(debounceRef.current)
                setShowSuggestions(false)
                router.push(s.href)
              }}
              className="flex items-center justify-between px-4 py-3 text-sm transition-colors"
              style={{
                background: i === activeIndex ? 'var(--ba-green-soft)' : undefined,
                color: 'var(--ba-ink)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--ba-line)' : undefined,
              }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="truncate">{s.name}</span>
                {s.meta && (
                  <span className="shrink-0 text-xs" style={{ color: 'var(--ba-ghost)' }}>
                    {s.meta}
                  </span>
                )}
              </div>
              <span
                className="ml-3 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  color: 'var(--ba-subtle)',
                  background: 'var(--ba-paper)',
                }}
              >
                {TYPE_LABELS[s.type] ?? s.type}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
