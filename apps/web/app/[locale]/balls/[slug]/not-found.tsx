import { getTranslations } from 'next-intl/server'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { Link } from '@/i18n/navigation'

export default async function BallNotFound() {
  const t = await getTranslations('common.notFound')

  return (
    <RegistryLayout>
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="text-center">
          <p className="font-mono text-4xl font-bold" style={{ color: 'var(--ba-ghost)' }}>
            404
          </p>
          <h1 className="mt-3 text-lg font-medium" style={{ color: 'var(--ba-ink)' }}>
            {t('title')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {t('description')}
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-lg px-4 py-2 text-sm transition-opacity hover:opacity-75"
            style={{
              border: '1px solid var(--ba-line-strong)',
              color: 'var(--ba-subtle)',
            }}
          >
            {t('browseRegistry')}
          </Link>
        </div>
      </div>
    </RegistryLayout>
  )
}
