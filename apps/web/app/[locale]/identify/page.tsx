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
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">{t('title')}</h1>
          <p className="mt-2 text-sm text-neutral-500">{t('description')}</p>
        </div>

        {/* Feature guide */}
        <div className="mb-8 rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
            {t('howToUse')}
          </p>
          <ol className="space-y-1 text-xs text-neutral-500">
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
