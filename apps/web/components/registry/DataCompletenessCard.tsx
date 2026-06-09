import { getTranslations } from 'next-intl/server'

import { computeCompleteness, type CompletenessInput } from '@ballatlas/golf-data'

type DataCompletenessCardProps = {
  input: CompletenessInput
}

// Map package-generated English category names to translation keys
const CATEGORY_KEYS: Record<string, 'technicalSpecs' | 'valuation' | 'visualId' | 'images'> = {
  'Technical Specs': 'technicalSpecs',
  Valuation: 'valuation',
  'Visual ID': 'visualId',
  Images: 'images',
}

// Map package-generated English missing field labels to translation keys
type MissingFieldKey =
  | 'compression'
  | 'constructionLayers'
  | 'coverMaterial'
  | 'coreMaterial'
  | 'dimpleCount'
  | 'launchProfile'
  | 'spinProfile'
  | 'feelProfile'
  | 'ballColor'
  | 'finishType'
  | 'logoStyle'
  | 'logoText'
  | 'marketPriceData'
  | 'productImage'

const MISSING_FIELD_KEYS: Record<string, MissingFieldKey> = {
  Compression: 'compression',
  'Construction layers': 'constructionLayers',
  'Cover material': 'coverMaterial',
  'Core material': 'coreMaterial',
  'Dimple count': 'dimpleCount',
  'Launch profile': 'launchProfile',
  'Spin profile': 'spinProfile',
  'Feel profile': 'feelProfile',
  'Ball color': 'ballColor',
  'Finish type': 'finishType',
  'Logo style': 'logoStyle',
  'Logo text': 'logoText',
  'Market price data': 'marketPriceData',
  'Product image': 'productImage',
}

export async function DataCompletenessCard({ input }: DataCompletenessCardProps) {
  const t = await getTranslations('ballProfile')
  const result = computeCompleteness(input)

  const { label: coverageLabel, color } = (() => {
    if (result.score >= 80) return { label: t('coverageLabels.full'), color: 'var(--ba-green)' }
    if (result.score >= 60) return { label: t('coverageLabels.good'), color: 'var(--ba-subtle)' }
    if (result.score >= 40) return { label: t('coverageLabels.partial'), color: 'var(--ba-gold)' }
    return { label: t('coverageLabels.minimal'), color: 'var(--ba-ghost)' }
  })()

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="kicker">{t('title')}</p>
          <p className="mt-0.5 text-xs font-medium" style={{ color }}>
            {coverageLabel}
          </p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-2xl font-bold leading-none tracking-tight"
            style={{ color }}
          >
            {result.score}
          </span>
          <span className="ml-0.5 text-xs" style={{ color: 'var(--ba-ghost)' }}>
            %
          </span>
        </div>
      </div>

      {/* Overall bar */}
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--ba-sand)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${result.score}%`, background: color }}
        />
      </div>

      {/* Category breakdown */}
      {result.score < 100 && (
        <div className="space-y-2.5">
          {result.categories.map((cat) => {
            const key = CATEGORY_KEYS[cat.name]
            const catLabel = key ? t(`categories.${key}`) : cat.name
            return (
              <div key={cat.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span style={{ color: 'var(--ba-subtle)' }}>{catLabel}</span>
                  <span className="font-mono" style={{ color: 'var(--ba-ghost)' }}>
                    {cat.filled}/{cat.total}
                  </span>
                </div>
                <div
                  className="h-px overflow-hidden rounded-full"
                  style={{ background: 'var(--ba-sand)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.pct}%`, background: 'var(--ba-subtle)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Missing fields */}
      {result.missingFields.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--ba-line)' }}>
          <div className="flex flex-wrap gap-1">
            {result.missingFields.slice(0, 4).map((f) => {
              const key = MISSING_FIELD_KEYS[f]
              const fieldLabel = key ? t(`missingFields.${key}`) : f
              return (
                <span
                  key={f}
                  className="rounded px-1.5 py-0.5 text-[10px]"
                  style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
                >
                  {fieldLabel}
                </span>
              )
            })}
            {result.missingFields.length > 4 && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px]"
                style={{ background: 'var(--ba-paper)', color: 'var(--ba-ghost)' }}
              >
                +{result.missingFields.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
