import type { Route } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

type GapVersion = {
  id: string
  name: string
  slug: string
  family: { name: string; brand: { name: string } } | null
}

export default async function DataQualityPage() {
  const supabase = await createClient()

  // Run all gap queries in parallel
  const [
    { count: totalVersions },
    { count: publishedVersions },
    { count: totalBrands },
    { count: totalImages },
    { count: approvedImages },
    { count: pendingImages },
    { count: totalObservations },
    { count: activeObservations },
    { data: versionsWithoutImages },
    { data: versionsWithoutPrices },
    { data: versionsWithoutSpecs },
    { data: versionsWithoutAliases },
    { data: brandsWithoutImages },
  ] = await Promise.all([
    supabase.from('ball_versions').select('*', { count: 'exact', head: true }),
    supabase
      .from('ball_versions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'approved'),
    supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'pending'),
    supabase.from('price_observations').select('*', { count: 'exact', head: true }),
    supabase
      .from('price_observations')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false),

    // Versions without any approved image
    supabase
      .from('ball_versions')
      .select(`id, name, slug, family:ball_families(name, brand:brands(name))`)
      .eq('status', 'published')
      .not('id', 'in', `(select version_id from images where review_status = 'approved')`)
      .order('name')
      .limit(50),

    // Versions without any active price observation
    supabase
      .from('ball_versions')
      .select(`id, name, slug, family:ball_families(name, brand:brands(name))`)
      .eq('status', 'published')
      .not('id', 'in', `(select version_id from price_observations where is_archived = false)`)
      .order('name')
      .limit(50),

    // Versions without technical specs
    supabase
      .from('ball_versions')
      .select(`id, name, slug, family:ball_families(name, brand:brands(name))`)
      .eq('status', 'published')
      .not('id', 'in', `(select version_id from technical_specs)`)
      .order('name')
      .limit(50),

    // Versions without aliases
    supabase
      .from('ball_versions')
      .select(`id, name, slug, family:ball_families(name, brand:brands(name))`)
      .eq('status', 'published')
      .not('id', 'in', `(select version_id from ball_aliases)`)
      .order('name')
      .limit(50),

    // Brands without any approved image (via ball_versions → images)
    supabase
      .from('brands')
      .select(`id, name, slug`)
      .not(
        'id',
        'in',
        `(select bf.brand_id from images i
           join ball_versions bv on bv.id = i.version_id
           join ball_families bf on bf.id = bv.family_id
           where i.review_status = 'approved')`
      )
      .order('name')
      .limit(30),
  ])

  const imageGapCount =
    (totalVersions ?? 0) -
    ((versionsWithoutImages?.length ?? 0) > 0 ? versionsWithoutImages!.length : 0)
  void imageGapCount

  const stats: Array<{ label: string; value: number; href: Route }> = [
    { label: 'Total Versions', value: totalVersions ?? 0, href: '/admin/versions' },
    { label: 'Published', value: publishedVersions ?? 0, href: '/admin/versions' },
    { label: 'Total Brands', value: totalBrands ?? 0, href: '/admin/brands' },
    { label: 'Total Images', value: totalImages ?? 0, href: '/admin/images' },
    { label: 'Approved Images', value: approvedImages ?? 0, href: '/admin/images?status=approved' },
    { label: 'Pending Review', value: pendingImages ?? 0, href: '/admin/images?status=pending' },
    { label: 'Price Observations', value: totalObservations ?? 0, href: '/admin/prices' },
    { label: 'Active Observations', value: activeObservations ?? 0, href: '/admin/prices' },
  ]

  const gaps: Array<{
    label: string
    versions: GapVersion[]
    href: Route
    severity: 'high' | 'medium' | 'low'
  }> = [
    {
      label: 'Versions Without Approved Images',
      versions: (versionsWithoutImages ?? []) as GapVersion[],
      href: '/admin/images',
      severity: 'high' as const,
    },
    {
      label: 'Versions Without Price Observations',
      versions: (versionsWithoutPrices ?? []) as GapVersion[],
      href: '/admin/prices',
      severity: 'high' as const,
    },
    {
      label: 'Versions Without Technical Specs',
      versions: (versionsWithoutSpecs ?? []) as GapVersion[],
      href: '/admin/versions',
      severity: 'medium' as const,
    },
    {
      label: 'Versions Without Aliases',
      versions: (versionsWithoutAliases ?? []) as GapVersion[],
      href: '/admin/aliases',
      severity: 'low' as const,
    },
  ]

  const severityBadge = {
    high: 'bg-red-500/10 text-red-400 border border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    low: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Data Quality</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gap analysis and enrichment targets. Missing values are acceptable; fabricated values are
          not.
        </p>
      </div>

      {/* Overview stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
          >
            <div className="font-mono text-2xl font-bold">{s.value.toLocaleString()}</div>
            <div className="mt-1 text-xs text-neutral-400">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Coverage scores */}
      <div className="mb-8 rounded-lg border border-neutral-800 p-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
          Coverage at a Glance
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: 'Image Coverage',
              count: (publishedVersions ?? 0) - (versionsWithoutImages?.length ?? 0),
              total: publishedVersions ?? 0,
            },
            {
              label: 'Price Coverage',
              count: (publishedVersions ?? 0) - (versionsWithoutPrices?.length ?? 0),
              total: publishedVersions ?? 0,
            },
            {
              label: 'Spec Coverage',
              count: (publishedVersions ?? 0) - (versionsWithoutSpecs?.length ?? 0),
              total: publishedVersions ?? 0,
            },
            {
              label: 'Alias Coverage',
              count: (publishedVersions ?? 0) - (versionsWithoutAliases?.length ?? 0),
              total: publishedVersions ?? 0,
            },
          ].map((c) => {
            const pct = c.total > 0 ? Math.round((c.count / c.total) * 100) : 0
            const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            return (
              <div key={c.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-neutral-400">{c.label}</span>
                  <span className="font-mono text-neutral-300">
                    {c.count}/{c.total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Brands without images */}
      {brandsWithoutImages && brandsWithoutImages.length > 0 && (
        <div className="mb-6 rounded-lg border border-neutral-800 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <span className={`rounded px-2 py-0.5 text-xs ${severityBadge.high}`}>
              {brandsWithoutImages.length} brands
            </span>
            <span>Brands Without Approved Images</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {brandsWithoutImages.map((b) => (
              <Link
                key={b.id}
                href={`/admin/brands/${b.id}/edit`}
                className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Gap tables */}
      <div className="space-y-6">
        {gaps.map((gap) => (
          <div key={gap.label} className="rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <span className={`rounded px-2 py-0.5 text-xs ${severityBadge[gap.severity]}`}>
                  {gap.versions.length}
                  {gap.versions.length === 50 ? '+' : ''} gaps
                </span>
                <span>{gap.label}</span>
              </h2>
              <Link href={gap.href} className="text-xs text-neutral-500 hover:text-neutral-300">
                Fix →
              </Link>
            </div>

            {gap.versions.length === 0 ? (
              <p className="px-5 py-4 text-sm text-green-400">✓ All published versions covered</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {gap.versions.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
                      >
                        <td className="px-5 py-2.5">
                          <Link
                            href={`/admin/versions/${v.id}/edit`}
                            className="font-medium hover:text-neutral-300"
                          >
                            {v.family?.brand?.name} {v.name}
                          </Link>
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-neutral-600">{v.slug}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-neutral-700">
        Gap tables show up to 50 records. Numbers shown above each table reflect the full count for
        published versions.
      </p>
    </div>
  )
}
