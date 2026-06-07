import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Admin — BallAtlas',
  robots: { index: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <nav className="border-b border-neutral-800 bg-neutral-900 px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-mono text-sm font-semibold text-neutral-300">BallAtlas Admin</span>
          <div className="flex gap-4 text-sm text-neutral-400">
            <Link href="/admin" className="transition-colors hover:text-neutral-100">
              Dashboard
            </Link>
            <Link href="/admin/brands" className="transition-colors hover:text-neutral-100">
              Brands
            </Link>
            <Link href="/admin/families" className="transition-colors hover:text-neutral-100">
              Families
            </Link>
            <Link href="/admin/versions" className="transition-colors hover:text-neutral-100">
              Versions
            </Link>
            <Link href="/admin/aliases" className="transition-colors hover:text-neutral-100">
              Aliases
            </Link>
            <Link href="/admin/images" className="transition-colors hover:text-neutral-100">
              Images
            </Link>
            <Link href="/admin/prices" className="transition-colors hover:text-neutral-100">
              Prices
            </Link>
            <Link href="/admin/valuation" className="transition-colors hover:text-neutral-100">
              Valuation
            </Link>
            <Link href="/admin/data-quality" className="transition-colors hover:text-neutral-100">
              Data Quality
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
