import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import '../../app/globals.css'

import { locales, type Locale } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.home' })

  return {
    title: {
      template: '%s | BallAtlas',
      default: t('title'),
    },
    description: t('description'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [
          l,
          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/${l}`,
        ])
      ),
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!(locales as readonly string[]).includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale: locale as Locale })

  return (
    // Font variables on <html> — required for Tailwind CSS variable resolution
    // suppressHydrationWarning prevents dark mode class hydration mismatch
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-background min-h-screen font-sans antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
