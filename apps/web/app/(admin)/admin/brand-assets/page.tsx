import { revalidatePath } from 'next/cache'

import {
  BrandAssetMetaSchema,
  BrandAssetUpdateSchema,
  validateSvgSafety,
} from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

const ASSET_TYPE_OPTIONS = [
  { value: 'logo_svg', label: 'Logo (SVG)' },
  { value: 'logo_png', label: 'Logo (PNG)' },
  { value: 'brand_mark', label: 'Brand Mark' },
  { value: 'hero_image', label: 'Hero Image' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'identification_reference', label: 'ID Reference' },
] as const

const LICENSE_OPTIONS = [
  { value: 'ballatlas-original', label: 'BallAtlas Original' },
  { value: 'manufacturer-provided', label: 'Manufacturer Provided' },
  { value: 'cc-by-4.0', label: 'CC BY 4.0' },
  { value: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0' },
  { value: 'cc0', label: 'CC0 / Public Domain' },
  { value: 'fair-use-reference', label: 'Fair Use Reference' },
]

const STATUS_TABS = [
  { value: 'uploaded', label: 'Uploaded', color: 'text-neutral-400' },
  { value: 'pending_review', label: 'Pending Review', color: 'text-yellow-400' },
  { value: 'approved', label: 'Approved', color: 'text-green-400' },
  { value: 'archived', label: 'Archived', color: 'text-neutral-600' },
] as const

type ReviewStatus = (typeof STATUS_TABS)[number]['value']

export default async function BrandAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string }>
}) {
  const { status: statusParam = 'uploaded', brand: brandParam } = await searchParams

  const status: ReviewStatus = (
    ['uploaded', 'pending_review', 'approved', 'archived'] as const
  ).includes(statusParam as ReviewStatus)
    ? (statusParam as ReviewStatus)
    : 'uploaded'

  const supabase = await createClient()

  const [{ data: assetsRaw, error }, { data: brands }, ...statusCounts] = await Promise.all([
    supabase
      .from('brand_assets')
      .select(
        'id, brand_id, asset_type, storage_path, mime_type, source_url, attribution, license, alt_text, review_status, quality_score, uploaded_at, reviewed_at, brand:brands(id, name, slug)'
      )
      .eq('review_status', status)
      .order('uploaded_at', { ascending: false }),
    supabase.from('brands').select('id, name, slug').order('name'),
    ...STATUS_TABS.map(({ value }) =>
      supabase
        .from('brand_assets')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', value)
    ),
  ])

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab, i) => {
    acc[tab.value] = statusCounts[i]?.count ?? 0
    return acc
  }, {})

  const assets = (assetsRaw ?? []).filter((a) => {
    if (!brandParam) return true
    const brand = a.brand as { slug: string } | null
    return brand?.slug === brandParam
  })

  async function uploadBrandAsset(formData: FormData) {
    'use server'
    const brandId = formData.get('brand_id') as string
    const assetType = formData.get('asset_type') as string
    const license = (formData.get('license') as string) || null
    const attribution = (formData.get('attribution') as string) || null
    const altText = (formData.get('alt_text') as string) || null
    const sourceUrl = (formData.get('source_url') as string) || null
    const qualityRaw = formData.get('quality_score')
    const quality = qualityRaw ? Number(qualityRaw) : null

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) throw new Error('A file is required')

    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    const isPng = file.type === 'image/png'
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg'

    if (!isSvg && !isPng && !isJpeg) {
      throw new Error('File must be SVG, PNG, or JPEG')
    }

    if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB')

    const mime = isSvg ? 'image/svg+xml' : isPng ? 'image/png' : 'image/jpeg'

    if (isSvg) {
      const text = await file.text()
      const result = validateSvgSafety(text, file.size)
      if (!result.ok) {
        throw new Error(`SVG validation failed: ${result.errors.join('; ')}`)
      }
    }

    const admin = await createAdminClient()

    const { data: brand } = await admin.from('brands').select('slug').eq('id', brandId).single()
    const brandSlug = brand?.slug ?? brandId
    const ext = isSvg ? 'svg' : isPng ? 'png' : 'jpg'
    const path = `${brandSlug}/${assetType}-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage
      .from('brand-assets')
      .upload(path, arrayBuffer, { contentType: mime, upsert: false })
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const parsed = BrandAssetMetaSchema.safeParse({
      brand_id: brandId,
      asset_type: assetType,
      storage_path: path,
      mime_type: mime,
      file_size_bytes: file.size,
      source_url: sourceUrl,
      attribution,
      license,
      alt_text: altText,
      review_status: 'uploaded',
      quality_score: quality,
    })
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))

    const { error } = await admin.from('brand_assets').insert(parsed.data)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/brand-assets')
  }

  async function updateAssetStatus(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const newStatus = formData.get('review_status') as string
    const parsed = BrandAssetUpdateSchema.safeParse({ review_status: newStatus })
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin
      .from('brand_assets')
      .update({ review_status: parsed.data.review_status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/brand-assets')
  }

  async function deleteAsset(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const storagePath = formData.get('storage_path') as string
    const admin = await createAdminClient()
    if (storagePath) {
      await admin.storage.from('brand-assets').remove([storagePath])
    }
    const { error } = await admin.from('brand_assets').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/brand-assets')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Brand Assets</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Upload and manage brand logos, marks, and visual assets
        </p>
      </div>

      {/* Status counts */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/brand-assets?status=${tab.value}`}
            className={`rounded-lg border p-3 transition-colors ${
              status === tab.value
                ? 'border-neutral-600 bg-neutral-800'
                : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
            }`}
          >
            <div className={`font-mono text-xl font-bold ${tab.color}`}>
              {counts[tab.value] ?? 0}
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">{tab.label}</div>
          </a>
        ))}
      </div>

      {/* Upload form */}
      <details className="mb-6 rounded-lg border border-neutral-800 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-300">
          + Upload Brand Asset
        </summary>
        <form action={uploadBrandAsset} encType="multipart/form-data" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Brand *</label>
              <select
                name="brand_id"
                required
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              >
                <option value="">Select brand…</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Asset Type *</label>
              <select
                name="asset_type"
                required
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              >
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">File *</label>
            <input
              name="file"
              type="file"
              accept="image/svg+xml,.svg,image/png,image/jpeg"
              required
              className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-xs file:text-neutral-200 hover:file:bg-neutral-700"
            />
            <p className="mt-0.5 text-xs text-neutral-600">
              SVG (preferred for logos), PNG, or JPEG — max 10MB. SVGs are validated for safety.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">License</label>
              <select
                name="license"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              >
                <option value="">—</option>
                {LICENSE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Quality (1–10)</label>
              <input
                name="quality_score"
                type="number"
                min="1"
                max="10"
                placeholder="8"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-neutral-400">Attribution</label>
              <input
                name="attribution"
                placeholder="e.g. © Titleist / Acushnet Company"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Source URL</label>
              <input
                name="source_url"
                type="url"
                placeholder="https://…"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Alt Text</label>
              <input
                name="alt_text"
                placeholder="e.g. Titleist logo"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Upload Asset
          </button>
        </form>
      </details>

      {/* Brand filter */}
      {brands && brands.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-600">Filter:</span>
          <a
            href={`/admin/brand-assets?status=${status}`}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              !brandParam
                ? 'bg-neutral-700 text-neutral-200'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            All brands
          </a>
          {brands.map((b) => (
            <a
              key={b.id}
              href={`/admin/brand-assets?status=${status}&brand=${b.slug}`}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                brandParam === b.slug
                  ? 'bg-neutral-700 text-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {b.name}
            </a>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="mb-4 flex gap-1 border-b border-neutral-800">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/brand-assets?status=${tab.value}${brandParam ? `&brand=${brandParam}` : ''}`}
            className={`px-4 py-2 text-sm transition-colors ${
              status === tab.value
                ? 'border-b-2 border-white text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error.message}</p>}

      {assets.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No {status.replace('_', ' ')} assets{brandParam ? ` for this brand` : ''}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900">
                <th className="px-4 py-3 text-left font-normal text-neutral-400">Brand</th>
                <th className="px-4 py-3 text-left font-normal text-neutral-400">Type</th>
                <th className="px-4 py-3 text-left font-normal text-neutral-400">Format</th>
                <th className="px-4 py-3 text-left font-normal text-neutral-400">License</th>
                <th className="px-4 py-3 text-left font-normal text-neutral-400">Quality</th>
                <th className="px-4 py-3 text-left font-normal text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const brand = asset.brand as { name: string; slug: string } | null
                const assetUrl = supabaseUrl
                  ? `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.storage_path}`
                  : null

                return (
                  <tr
                    key={asset.id}
                    className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{brand?.name ?? '—'}</div>
                      {assetUrl && (
                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-600 hover:text-neutral-400"
                        >
                          View →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                      {asset.asset_type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                          asset.mime_type === 'image/svg+xml'
                            ? 'bg-blue-950 text-blue-400'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {asset.mime_type === 'image/svg+xml'
                          ? 'SVG'
                          : asset.mime_type === 'image/png'
                            ? 'PNG'
                            : 'JPEG'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">{asset.license ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                      {asset.quality_score ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {status !== 'approved' && (
                          <form action={updateAssetStatus}>
                            <input type="hidden" name="id" value={asset.id} />
                            <input type="hidden" name="review_status" value="approved" />
                            <button
                              type="submit"
                              className="text-xs text-green-500 hover:text-green-400"
                            >
                              Approve
                            </button>
                          </form>
                        )}
                        {status === 'uploaded' && (
                          <form action={updateAssetStatus}>
                            <input type="hidden" name="id" value={asset.id} />
                            <input type="hidden" name="review_status" value="pending_review" />
                            <button
                              type="submit"
                              className="text-xs text-yellow-500 hover:text-yellow-400"
                            >
                              Queue
                            </button>
                          </form>
                        )}
                        {status !== 'archived' && (
                          <form action={updateAssetStatus}>
                            <input type="hidden" name="id" value={asset.id} />
                            <input type="hidden" name="review_status" value="archived" />
                            <button
                              type="submit"
                              className="text-xs text-neutral-600 hover:text-neutral-400"
                            >
                              Archive
                            </button>
                          </form>
                        )}
                        <form action={deleteAsset}>
                          <input type="hidden" name="id" value={asset.id} />
                          <input type="hidden" name="storage_path" value={asset.storage_path} />
                          <button
                            type="submit"
                            className="text-xs text-neutral-700 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
