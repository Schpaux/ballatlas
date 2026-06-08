import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { Link } from '@/i18n/navigation'

export default async function BallNotFound() {
  const t = await getTranslations('common.notFound')

  return (
    <RegistryLayout>
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
        <div className="text-center">
          <p className="font-mono text-4xl font-bold text-neutral-700">404</p>
          <h1 className="mt-3 text-lg font-medium text-neutral-300">{t('title')}</h1>
          <p className="mt-2 text-sm text-neutral-600">{t('description')}</p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-neutral-400 transition-colors hover:border-white/[0.14] hover:text-neutral-100"
          >
            {t('browseRegistry')}
          </Link>
        </div>
      </div>
    </RegistryLayout>
  )
}
