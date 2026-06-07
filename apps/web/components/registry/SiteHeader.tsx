import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-100 transition-opacity hover:opacity-70"
        >
          Ball<span className="text-neutral-500">Atlas</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/search"
            className="text-neutral-400 transition-colors hover:text-neutral-100"
          >
            Browse
          </Link>
          <Link href="/admin" className="text-neutral-600 transition-colors hover:text-neutral-400">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
