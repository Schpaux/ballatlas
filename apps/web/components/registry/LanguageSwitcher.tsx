'use client'

import { useLocale, useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'

const FLAG: Record<string, string> = {
  en: '🇬🇧',
  no: '🇳🇴',
}

export function LanguageSwitcher() {
  const t = useTranslations('languageSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchTo(next: string) {
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={t('label')}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          aria-label={t(l)}
          title={t(l)}
          className="rounded px-1.5 py-1 text-xs transition-opacity"
          style={{
            background: locale === l ? 'var(--ba-line-strong)' : 'transparent',
            opacity: locale === l ? 1 : 0.55,
          }}
        >
          <span aria-hidden="true">{FLAG[l]}</span>
          <span className="sr-only">{t(l)}</span>
        </button>
      ))}
    </div>
  )
}
