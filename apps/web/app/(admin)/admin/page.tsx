import type { Route } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: brandCount },
    { count: familyCount },
    { count: versionCount },
    { count: publishedCount },
  ] = await Promise.all([
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('ball_families').select('*', { count: 'exact', head: true }),
    supabase.from('ball_versions').select('*', { count: 'exact', head: true }),
    supabase
      .from('ball_versions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
  ])

  const stats: { label: string; value: number; href: Route }[] = [
    { label: 'Brands', value: brandCount ?? 0, href: '/admin/brands' },
    { label: 'Families', value: familyCount ?? 0, href: '/admin/families' },
    { label: 'Versions (total)', value: versionCount ?? 0, href: '/admin/versions' },
    { label: 'Published', value: publishedCount ?? 0, href: '/admin/versions' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-400">BallAtlas data platform overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
          >
            <div className="font-mono text-3xl font-bold">{stat.value}</div>
            <div className="mt-1 text-sm text-neutral-400">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/brands/new"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
        >
          <div className="font-medium">+ New Brand</div>
          <div className="mt-1 text-sm text-neutral-500">Register a golf ball manufacturer</div>
        </Link>
        <Link
          href="/admin/families"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
        >
          <div className="font-medium">Manage Families</div>
          <div className="mt-1 text-sm text-neutral-500">View and edit ball model lines</div>
        </Link>
        <Link
          href="/admin/versions/new"
          className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
        >
          <div className="font-medium">+ New Version</div>
          <div className="mt-1 text-sm text-neutral-500">Add a specific ball release year</div>
        </Link>
      </div>
    </div>
  )
}
