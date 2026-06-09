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
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ba-ink)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
          BallAtlas data platform overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl p-4 transition-all hover:opacity-80"
            style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line-strong)' }}
          >
            <div className="font-mono text-3xl font-bold" style={{ color: 'var(--ba-ink)' }}>
              {stat.value}
            </div>
            <div className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
              {stat.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            href: '/admin/brands/new',
            title: '+ New Brand',
            desc: 'Register a golf ball manufacturer',
          },
          {
            href: '/admin/families',
            title: 'Manage Families',
            desc: 'View and edit ball model lines',
          },
          {
            href: '/admin/versions/new',
            title: '+ New Version',
            desc: 'Add a specific ball release year',
          },
          {
            href: '/admin/images?status=pending',
            title: 'Image Review Queue',
            desc: 'Approve or reject pending images',
          },
          {
            href: '/admin/prices',
            title: 'Price Observations',
            desc: 'Manage market pricing data',
          },
          {
            href: '/admin/data-quality',
            title: 'Data Quality',
            desc: 'Gap analysis and enrichment targets',
          },
        ].map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href as Route}
            className="rounded-xl p-4 transition-all hover:opacity-80"
            style={{ background: 'var(--ba-surface)', border: '1px solid var(--ba-line)' }}
          >
            <div className="font-medium" style={{ color: 'var(--ba-ink)' }}>
              {title}
            </div>
            <div className="mt-1 text-sm" style={{ color: 'var(--ba-ghost)' }}>
              {desc}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
