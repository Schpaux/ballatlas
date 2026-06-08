'use client'

import { useState } from 'react'

import type { IdentificationResult } from '@ballatlas/golf-data'

import { IdentificationForm } from '@/components/registry/IdentificationForm'
import { IdentificationResultCard } from '@/components/registry/IdentificationResultCard'
import { RegistryLayout } from '@/components/registry/RegistryLayout'

export default function IdentifyPage() {
  const [results, setResults] = useState<IdentificationResult[]>([])
  const [searched, setSearched] = useState(false)

  function handleResults(r: IdentificationResult[]) {
    setResults(r)
    setSearched(true)
  }

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
            Identify a Golf Ball
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Enter what you can observe about the ball. The more features you provide, the more
            precise the result.
          </p>
        </div>

        {/* Feature guide */}
        <div className="mb-8 rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
            How to use
          </p>
          <ol className="space-y-1 text-xs text-neutral-500">
            <li>1. Enter the brand name printed on the ball</li>
            <li>2. Add the model text, e.g. &quot;Pro V1&quot; or &quot;Chrome Soft&quot;</li>
            <li>3. Note any alignment markings, number color, or special patterns</li>
            <li>4. Submit to see ranked candidates with confidence scores</li>
          </ol>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
          <IdentificationForm onResults={handleResults} />
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-6 py-8 text-center">
                <p className="text-sm text-neutral-500">
                  No candidates matched the provided features.
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Try fewer or different features — brand and logo text give the strongest signal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-neutral-300">
                    {results.length} candidate{results.length !== 1 ? 's' : ''} found
                  </h2>
                  <p className="text-xs text-neutral-600">Ranked by confidence</p>
                </div>
                {results.map((result, i) => (
                  <IdentificationResultCard key={result.versionId} result={result} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </RegistryLayout>
  )
}
