'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { IdentificationResult } from '@ballatlas/golf-data'

import { IdentificationForm } from '@/components/registry/IdentificationForm'
import { IdentificationResultCard } from '@/components/registry/IdentificationResultCard'

export function IdentifyInterface() {
  const t = useTranslations('identify')
  const [results, setResults] = useState<IdentificationResult[]>([])
  const [searched, setSearched] = useState(false)

  function handleResults(r: IdentificationResult[]) {
    setResults(r)
    setSearched(true)
  }

  return (
    <>
      {/* Form */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
      >
        <IdentificationForm onResults={handleResults} />
      </div>

      {/* Results */}
      {searched && (
        <div className="mt-8">
          {results.length === 0 ? (
            <div
              className="rounded-xl px-6 py-8 text-center"
              style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line)' }}
            >
              <p className="text-sm" style={{ color: 'var(--ba-subtle)' }}>
                {t('results.noResults')}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--ba-ghost)' }}>
                {t('results.noResultsHint')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium" style={{ color: 'var(--ba-ink)' }}>
                  {t('results.candidates', { count: results.length })}
                </h2>
                <p className="text-xs" style={{ color: 'var(--ba-ghost)' }}>
                  {t('results.rankedByConfidence')}
                </p>
              </div>

              {results.length >= 2 &&
                results[0] !== undefined &&
                results[1] !== undefined &&
                results[0].confidence - results[1].confidence <= 10 && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: 'var(--ba-gold-soft)',
                      border: '1px solid rgba(138,100,32,0.22)',
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: 'var(--ba-gold)' }}>
                      {t('results.closeMatch')}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {t('results.closeMatchDescription')}
                    </p>
                  </div>
                )}

              {results.map((result, i) => (
                <IdentificationResultCard key={result.versionId} result={result} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
