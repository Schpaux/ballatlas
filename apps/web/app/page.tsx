import type { Metadata, Route } from 'next'
import Link from 'next/link'

import { RegistryLayout } from '@/components/registry/RegistryLayout'
import { SearchBar } from '@/components/registry/SearchBar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'BallAtlas — Golf Ball Intelligence',
  description:
    'The most comprehensive golf ball registry, identification platform, and intelligence database.',
}

const POPULAR = [
  { label: 'Pro V1', query: 'Pro V1' },
  { label: 'Chrome Soft', query: 'Chrome Soft' },
  { label: 'TP5', query: 'TP5' },
  { label: 'Z-Star', query: 'Z-Star' },
  { label: 'Tour B X', query: 'Tour B X' },
  { label: 'Vice Pro', query: 'Vice Pro' },
]

async function getStats() {
  try {
    const supabase = await createClient()
    const [{ count: brands }, { count: families }, { count: versions }] = await Promise.all([
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('ball_families').select('*', { count: 'exact', head: true }),
      supabase
        .from('ball_versions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'discontinued']),
    ])
    return { brands: brands ?? 0, families: families ?? 0, versions: versions ?? 0 }
  } catch {
    return { brands: 0, families: 0, versions: 0 }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <RegistryLayout>
      <div className="flex min-h-[calc(100vh-56px)] flex-col">
        {/* Hero */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 sm:px-6">
          <div className="w-full max-w-xl text-center">
            {/* Live indicator */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs text-neutral-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Golf ball intelligence database
            </div>

            {/* Wordmark */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-100 sm:text-6xl">
              Ball<span className="text-neutral-600">Atlas</span>
            </h1>

            <p className="mb-10 text-base leading-relaxed text-neutral-500">
              Identify, research, and value any golf ball ever made.
            </p>

            {/* Search */}
            <SearchBar placeholder="Search Pro V1, Chrome Soft, TP5…" autoFocus className="mb-4" />

            {/* Popular links */}
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR.map(({ label, query }) => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(query)}` as Route}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-xs text-neutral-500 transition-colors hover:border-white/[0.10] hover:text-neutral-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Registry stats */}
        <div className="border-t border-white/[0.04] px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-mono text-2xl font-bold text-neutral-100 sm:text-3xl">
                  {stats.brands}
                </p>
                <p className="mt-1 text-xs text-neutral-600">Brands</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-neutral-100 sm:text-3xl">
                  {stats.families}
                </p>
                <p className="mt-1 text-xs text-neutral-600">Families</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-neutral-100 sm:text-3xl">
                  {stats.versions}
                </p>
                <p className="mt-1 text-xs text-neutral-600">Versions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RegistryLayout>
  )
}
