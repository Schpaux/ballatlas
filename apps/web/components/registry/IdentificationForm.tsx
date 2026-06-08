'use client'

import { useState } from 'react'

import type { IdentificationResult } from '@ballatlas/golf-data'

type ObservedFeatures = {
  brand: string
  logoText: string
  alignmentMarking: string
  numberColor: string
  logoStyle: string
  playNumber: string
  coverFinish: string
  primaryColor: string
  visualPattern: string
}

const EMPTY: ObservedFeatures = {
  brand: '',
  logoText: '',
  alignmentMarking: '',
  numberColor: '',
  logoStyle: '',
  playNumber: '',
  coverFinish: '',
  primaryColor: '',
  visualPattern: '',
}

const FINISH_OPTIONS = ['', 'glossy', 'matte', 'satin']
const COLOR_OPTIONS = [
  '',
  'white',
  'yellow',
  'orange',
  'pink',
  'matte-white',
  'red',
  'green',
  'blue',
]
const NUMBER_COLOR_OPTIONS = ['', 'black', 'red', 'gold', 'white', 'blue', 'silver']

type Props = {
  onResults: (results: IdentificationResult[]) => void
}

export function IdentificationForm({ onResults }: Props) {
  const [features, setFeatures] = useState<ObservedFeatures>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (key: keyof ObservedFeatures) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFeatures((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const hasAnyFeature = Object.values(features).some((v) => v.trim() !== '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasAnyFeature) return

    setLoading(true)
    setError(null)

    const body = Object.fromEntries(Object.entries(features).filter(([, v]) => v.trim() !== ''))

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as {
        data: IdentificationResult[] | null
        error: string | null
      }
      if (json.error || !json.data) {
        setError(json.error ?? 'Identification failed')
      } else {
        onResults(json.data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setFeatures(EMPTY)
    onResults([])
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand + Logo Text */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" hint="e.g. Titleist, Callaway, TaylorMade">
          <input
            type="text"
            value={features.brand}
            onChange={set('brand')}
            placeholder="Titleist"
            className={inputClass}
          />
        </Field>
        <Field label="Logo Text" hint="Text printed on the ball, e.g. Pro V1, Chrome Soft">
          <input
            type="text"
            value={features.logoText}
            onChange={set('logoText')}
            placeholder="Pro V1"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Alignment + Number Color */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alignment Marking" hint="e.g. Triple Track, single line, arrow, none">
          <input
            type="text"
            value={features.alignmentMarking}
            onChange={set('alignmentMarking')}
            placeholder="Triple Track"
            className={inputClass}
          />
        </Field>
        <Field label="Number Color" hint="Color of the play number">
          <select value={features.numberColor} onChange={set('numberColor')} className={inputClass}>
            {NUMBER_COLOR_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? 'Select…' : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Logo Style + Play Number */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo Style" hint="Visual style of the brand logo, e.g. Titleist script">
          <input
            type="text"
            value={features.logoStyle}
            onChange={set('logoStyle')}
            placeholder="Titleist script"
            className={inputClass}
          />
        </Field>
        <Field label="Play Number" hint="The number on the ball (1–8)">
          <input
            type="text"
            value={features.playNumber}
            onChange={set('playNumber')}
            placeholder="3"
            maxLength={2}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Cover Finish + Primary Color */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cover Finish" hint="Surface texture of the ball">
          <select value={features.coverFinish} onChange={set('coverFinish')} className={inputClass}>
            {FINISH_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? 'Select…' : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ball Color" hint="Dominant color of the ball">
          <select
            value={features.primaryColor}
            onChange={set('primaryColor')}
            className={inputClass}
          >
            {COLOR_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? 'Select…' : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Visual Pattern */}
      <Field
        label="Visual Pattern"
        hint="Any distinctive surface pattern, e.g. Truvis, hexagonal, camo"
      >
        <input
          type="text"
          value={features.visualPattern}
          onChange={set('visualPattern')}
          placeholder="Truvis hexagonal"
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!hasAnyFeature || loading}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Identifying…' : 'Identify Ball'}
        </button>
        {hasAnyFeature && !loading && (
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-neutral-300">{label}</label>
      {children}
      <p className="text-[11px] text-neutral-600">{hint}</p>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.05]'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
