import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from './LanguageSwitcher'

import { Link } from '@/i18n/navigation'

export async function SiteHeader() {
  const t = await getTranslations('navigation')

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(244,241,232,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--ba-line)',
        height: '64px',
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-1 transition-opacity hover:opacity-75"
        >
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--ba-ink)' }}>
            Ball
          </span>
          {/* Green dot — brand mark */}
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--ba-green)', flexShrink: 0 }}
          />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--ba-subtle)' }}
          >
            Atlas
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/search"
            className="transition-colors hover:opacity-100"
            style={{ color: 'var(--ba-subtle)' }}
          >
            {t('browse')}
          </Link>
          <Link
            href="/brands"
            className="transition-colors hover:opacity-100"
            style={{ color: 'var(--ba-subtle)' }}
          >
            {t('brands')}
          </Link>
          <Link
            href="/compare"
            className="transition-colors hover:opacity-100"
            style={{ color: 'var(--ba-subtle)' }}
          >
            {t('compare')}
          </Link>
          <Link
            href="/identify"
            className="flex items-center gap-1.5 transition-colors hover:opacity-100"
            style={{ color: 'var(--ba-subtle)' }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: 'var(--ba-green)', opacity: 0.8 }}
            />
            {t('identify')}
          </Link>
          <a href="/admin" className="transition-colors" style={{ color: 'var(--ba-ghost)' }}>
            {t('admin')}
          </a>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
