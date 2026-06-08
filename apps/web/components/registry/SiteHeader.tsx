import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from './LanguageSwitcher'

import { Link } from '@/i18n/navigation'

export async function SiteHeader() {
  const t = await getTranslations('navigation')

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-1 transition-opacity hover:opacity-75">
          <span className="text-sm font-semibold tracking-tight text-neutral-100">Ball</span>
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold tracking-tight text-neutral-500">Atlas</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/search"
            className="text-neutral-400 transition-colors hover:text-neutral-100"
          >
            {t('browse')}
          </Link>
          <Link
            href="/brands"
            className="text-neutral-400 transition-colors hover:text-neutral-100"
          >
            {t('brands')}
          </Link>
          <Link
            href="/compare"
            className="text-neutral-400 transition-colors hover:text-neutral-100"
          >
            {t('compare')}
          </Link>
          {/* Identify — intelligence feature, gets subtle accent treatment */}
          <Link
            href="/identify"
            className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-neutral-100"
          >
            <span className="h-1 w-1 rounded-full bg-emerald-500/70" />
            {t('identify')}
          </Link>
          <a href="/admin" className="text-neutral-700 transition-colors hover:text-neutral-500">
            {t('admin')}
          </a>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}
