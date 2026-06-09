import { getTranslations } from 'next-intl/server'

import { IdentifyInterface } from './IdentifyInterface'

import { RegistryLayout } from '@/components/registry/RegistryLayout'

export default async function IdentifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'identify' })

  return (
    <RegistryLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--ba-ink)' }}>
            {t('title')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {t('description')}
          </p>
        </div>

        {/* Feature guide */}
        <div
          className="mb-8 rounded-xl px-4 py-3"
          style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
        >
          <p className="kicker mb-2">{t('howToUse')}</p>
          <ol className="space-y-1 text-xs" style={{ color: 'var(--ba-subtle)' }}>
            <li>1. {t('steps.step1')}</li>
            <li>2. {t('steps.step2')}</li>
            <li>3. {t('steps.step3')}</li>
            <li>4. {t('steps.step4')}</li>
          </ol>
        </div>

        {/* Interactive form + results — client component */}
        <IdentifyInterface />
      </div>
    </RegistryLayout>
  )
}
