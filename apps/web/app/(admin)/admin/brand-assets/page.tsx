import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  BrandAssetMetaSchema,
  BrandAssetUpdateSchema,
  normalizeSvg,
  sanitizeSvg,
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
  { value: 'uploaded', label: 'Uploaded', color: 'text-stone-500' },
  { value: 'pending_review', label: 'Pending Review', color: 'text-yellow-700' },
  { value: 'approved', label: 'Approved', color: 'text-green-700' },
  { value: 'archived', label: 'Archived', color: 'text-stone-400' },
] as const

type ReviewStatus = (typeof STATUS_TABS)[number]['value']

export default async function BrandAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string; uploadError?: string }>
}) {
  const { status: statusParam = 'uploaded', brand: brandParam, uploadError } = await searchParams

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

    const fail = (msg: string) =>
      redirect(`/admin/brand-assets?uploadError=${encodeURIComponent(msg)}`)

    if (!file || file.size === 0) return fail('A file is required')

    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    const isPng = file.type === 'image/png'
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg'

    if (!isSvg && !isPng && !isJpeg) return fail('File must be SVG, PNG, or JPEG')
    if (file.size > 10 * 1024 * 1024) return fail('File must be under 10MB')

    const mime = isSvg ? 'image/svg+xml' : isPng ? 'image/png' : 'image/jpeg'

    let fileContent: ArrayBuffer
    if (isSvg) {
      const raw = await file.text()
      const sanitized = sanitizeSvg(raw)
      const result = validateSvgSafety(sanitized, file.size)
      if (!result.ok) return fail(`SVG validation failed: ${result.errors.join('; ')}`)
      const normalized = normalizeSvg(sanitized)
      fileContent = new TextEncoder().encode(normalized).buffer
    } else {
      fileContent = await file.arrayBuffer()
    }

    const admin = await createAdminClient()

    const { data: brand } = await admin.from('brands').select('slug').eq('id', brandId).single()
    const brandSlug = brand?.slug ?? brandId
    const ext = isSvg ? 'svg' : isPng ? 'png' : 'jpg'
    const path = `${brandSlug}/${assetType}-${Date.now()}.${ext}`

    const { error: storageError } = await admin.storage
      .from('brand-assets')
      .upload(path, fileContent, { contentType: mime, upsert: false })
    if (storageError) return fail(`Upload failed: ${storageError.message}`)

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
    if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(', '))

    const { error: dbError } = await admin.from('brand_assets').insert(parsed.data)
    if (dbError) return fail(dbError.message)
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
        <p className="mt-1 text-sm text-stone-500">
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
                ? 'border-stone-300 bg-stone-100'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className={`font-mono text-xl font-bold ${tab.color}`}>
              {counts[tab.value] ?? 0}
            </div>
            <div className="mt-0.5 text-xs text-stone-400">{tab.label}</div>
          </a>
        ))}
      </div>

      {uploadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(uploadError)}
        </div>
      )}

      {/* Upload form */}
      <details className="mb-6 rounded-lg border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-600">
          + Upload Brand Asset
        </summary>
        <form action={uploadBrandAsset} encType="multipart/form-data" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Brand *</label>
              <select name="brand_id" required className="ba-input">
                <option value="">Select brand…</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Asset Type *</label>
              <select name="asset_type" required className="ba-input">
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">File *</label>
            <input
              name="file"
              type="file"
              accept="image/svg+xml,.svg,image/png,image/jpeg"
              required
              className="w-full text-sm text-stone-500 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:text-stone-700 hover:file:bg-stone-200"
            />
            <p className="mt-0.5 text-xs text-stone-400">
              SVG (preferred for logos), PNG, or JPEG — max 10MB. SVGs are validated for safety.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-stone-500">License</label>
              <select name="license" className="ba-input">
                <option value="">—</option>
                {LICENSE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Quality (1–10)</label>
              <input
                name="quality_score"
                type="number"
                min="1"
                max="10"
                placeholder="8"
                className="ba-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-stone-500">Attribution</label>
              <input
                name="attribution"
                placeholder="e.g. © Titleist / Acushnet Company"
                className="ba-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Source URL</label>
              <input name="source_url" type="url" placeholder="https://…" className="ba-input" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Alt Text</label>
              <input name="alt_text" placeholder="e.g. Titleist logo" className="ba-input" />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Upload Asset
          </button>
        </form>
      </details>

      {/* Brand filter */}
      {brands && brands.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-400">Filter:</span>
          <a
            href={`/admin/brand-assets?status=${status}`}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              !brandParam ? 'bg-stone-200 text-stone-700' : 'text-stone-400 hover:text-stone-600'
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
                  ? 'bg-stone-200 text-stone-700'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {b.name}
            </a>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/brand-assets?status=${tab.value}${brandParam ? `&brand=${brandParam}` : ''}`}
            className={`px-4 py-2 text-sm transition-colors ${
              status === tab.value
                ? 'border-b-2 border-stone-800 text-stone-800'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error.message}</p>}

      {assets.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-400">
          No {status.replace('_', ' ')} assets{brandParam ? ` for this brand` : ''}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-left font-normal text-stone-500">Brand</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Type</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Format</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">License</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Quality</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Actions</th>
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
                    className="border-b border-stone-200 last:border-0 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{brand?.name ?? '—'}</div>
                      {assetUrl && (
                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-stone-400 hover:text-stone-500"
                        >
                          View →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      {asset.asset_type}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                          asset.mime_type === 'image/svg+xml'
                            ? 'bg-blue-950 text-blue-400'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {asset.mime_type === 'image/svg+xml'
                          ? 'SVG'
                          : asset.mime_type === 'image/png'
                            ? 'PNG'
                            : 'JPEG'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">{asset.license ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
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
                              className="text-xs text-green-500 hover:text-green-700"
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
                              className="text-xs text-yellow-500 hover:text-yellow-700"
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
                              className="text-xs text-stone-400 hover:text-stone-500"
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
                            className="text-xs text-stone-300 hover:text-red-600"
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
