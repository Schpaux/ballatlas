import type { Metadata, Route } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import Link from 'next/link'

import '../../../app/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Admin — BallAtlas',
  robots: { index: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="min-h-screen" style={{ background: 'var(--ba-paper)' }}>
          <nav
            style={{
              background: 'var(--ba-ink)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
            className="px-6 py-3"
          >
            <div className="flex items-center gap-6">
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                BallAtlas Admin
              </span>
              <div
                className="flex flex-wrap gap-4 text-sm"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {[
                  { href: '/admin', label: 'Dashboard' },
                  { href: '/admin/brands', label: 'Brands' },
                  { href: '/admin/families', label: 'Families' },
                  { href: '/admin/versions', label: 'Versions' },
                  { href: '/admin/aliases', label: 'Aliases' },
                  { href: '/admin/images', label: 'Images' },
                  { href: '/admin/prices', label: 'Prices' },
                  { href: '/admin/valuation', label: 'Valuation' },
                  { href: '/admin/data-quality', label: 'Data Quality' },
                  { href: '/admin/brand-assets', label: 'Brand Assets' },
                  { href: '/admin/feedback', label: 'Feedback' },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href as Route}
                    className="transition-opacity hover:opacity-100"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
          <main className="mx-auto max-w-6xl px-6 py-8" style={{ color: 'var(--ba-ink)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
