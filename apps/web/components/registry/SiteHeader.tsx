import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from './LanguageSwitcher'

import { Link } from '@/i18n/navigation'

export async function SiteHeader() {
  const t = await getTranslations('navigation')

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
      {/* Subtle emerald gradient along the bottom edge */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <span className="text-sm font-semibold tracking-tight text-neutral-100">Ball</span>
          {/* Emerald dot — brand mark */}
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/40 blur-[2px]" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
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
          {/* Identify — intelligence feature, subtle emerald accent */}
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
