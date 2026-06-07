'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AutocompleteSuggestion } from '@/app/api/autocomplete/route'

export function SearchBar({
  initialValue = '',
  placeholder = 'Search golf balls…',
  autoFocus = false,
  className,
}: {
  initialValue?: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const acRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const navigate = useCallback(
    (query: string) => {
      setShowSuggestions(false)
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}` as Route)
      } else {
        router.push('/search' as Route)
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
        router.push(s.href as Route)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-white/[0.16] focus:bg-white/[0.06]"
        />
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-white/[0.08] bg-neutral-900 shadow-xl">
          {suggestions.map((s, i) => (
            <a
              key={s.href}
              href={s.href}
              onMouseDown={(e) => {
                e.preventDefault()
                if (debounceRef.current) clearTimeout(debounceRef.current)
                setShowSuggestions(false)
                router.push(s.href as Route)
              }}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                i === activeIndex ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <span className="text-neutral-200">{s.name}</span>
                {s.meta && <span className="ml-2 text-xs text-neutral-600">{s.meta}</span>}
              </div>
              <span className="shrink-0 text-xs capitalize text-neutral-700">{s.type}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
