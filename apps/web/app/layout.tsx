import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | BallAtlas',
    default: 'BallAtlas — Golf Ball Intelligence',
  },
  description:
    'The most comprehensive golf ball registry, identification platform, and intelligence database.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Font variables on <html> — required for Tailwind CSS variable resolution
    // suppressHydrationWarning prevents dark mode class hydration mismatch
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-background min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
