'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('identify.form')
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
      setError(t('networkError'))
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('brand')} hint={t('brandHint')}>
          <input
            type="text"
            value={features.brand}
            onChange={set('brand')}
            placeholder="Titleist"
            className={inputClass}
          />
        </Field>
        <Field label={t('logoText')} hint={t('logoTextHint')}>
          <input
            type="text"
            value={features.logoText}
            onChange={set('logoText')}
            placeholder="Pro V1"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('alignmentMarking')} hint={t('alignmentMarkingHint')}>
          <input
            type="text"
            value={features.alignmentMarking}
            onChange={set('alignmentMarking')}
            placeholder="Triple Track"
            className={inputClass}
          />
        </Field>
        <Field label={t('numberColor')} hint={t('numberColorHint')}>
          <select value={features.numberColor} onChange={set('numberColor')} className={inputClass}>
            {NUMBER_COLOR_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? t('select') : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('logoStyle')} hint={t('logoStyleHint')}>
          <input
            type="text"
            value={features.logoStyle}
            onChange={set('logoStyle')}
            placeholder="Titleist script"
            className={inputClass}
          />
        </Field>
        <Field label={t('playNumber')} hint={t('playNumberHint')}>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('coverFinish')} hint={t('coverFinishHint')}>
          <select value={features.coverFinish} onChange={set('coverFinish')} className={inputClass}>
            {FINISH_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? t('select') : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('ballColor')} hint={t('ballColorHint')}>
          <select
            value={features.primaryColor}
            onChange={set('primaryColor')}
            className={inputClass}
          >
            {COLOR_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === '' ? t('select') : capitalize(o)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('visualPattern')} hint={t('visualPatternHint')}>
        <input
          type="text"
          value={features.visualPattern}
          onChange={set('visualPattern')}
          placeholder="Truvis hexagonal"
          className={inputClass}
        />
      </Field>

      {error && (
        <p
          className="rounded-md px-3 py-2 text-sm"
          style={{
            background: 'rgba(180,60,40,0.08)',
            border: '1px solid rgba(180,60,40,0.2)',
            color: '#b43c28',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!hasAnyFeature || loading}
          className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--ba-ink)', color: 'var(--ba-paper)' }}
        >
          {loading ? t('submitting') : t('submit')}
        </button>
        {hasAnyFeature && !loading && (
          <button
            type="button"
            onClick={handleReset}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--ba-ghost)' }}
          >
            {t('reset')}
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
      <label className="block text-xs font-medium" style={{ color: 'var(--ba-ink)' }}>
        {label}
      </label>
      {children}
      <p className="text-[11px]" style={{ color: 'var(--ba-ghost)' }}>
        {hint}
      </p>
    </div>
  )
}

const inputClass = 'ba-input'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
