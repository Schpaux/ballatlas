'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external initialValue changes (e.g. browser back/forward)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const navigate = useCallback(
    (query: string) => {
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}` as Route)
      } else {
        router.push('/search' as Route)
      }
    },
    [router]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(v), 350)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigate(value)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all focus:border-white/[0.16] focus:bg-white/[0.06]"
      />
    </form>
  )
}
