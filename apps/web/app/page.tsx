import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Golf Ball Intelligence',
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="border-border bg-muted text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Phase 1 — Foundation in progress
        </div>

        <h1 className="text-foreground text-5xl font-bold tracking-tight sm:text-6xl">
          Ball<span className="text-muted-foreground">Atlas</span>
        </h1>

        <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
          The most comprehensive golf ball registry, identification platform, and intelligence
          database.
        </p>

        <p className="text-muted-foreground/60 mt-4 text-sm">Coming soon.</p>
      </div>
    </main>
  )
}
