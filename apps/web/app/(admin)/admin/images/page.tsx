import { revalidatePath } from 'next/cache'

import { ImageUploadSchema, ImageReviewSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

const IMAGE_TYPES = ['hero', 'side', 'logo', 'alignment', 'number', 'dimple', 'packaging'] as const
const LICENSE_OPTIONS = [
  { value: 'ballatlas-original', label: 'BallAtlas Original' },
  { value: 'manufacturer-provided', label: 'Manufacturer Provided' },
  { value: 'cc-by-4.0', label: 'CC BY 4.0' },
  { value: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0' },
  { value: 'cc0', label: 'CC0 / Public Domain' },
  { value: 'fair-use-reference', label: 'Fair Use Reference' },
]

const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const REVIEW_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-700',
  approved: 'text-green-700',
  rejected: 'text-red-600',
}

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status: statusParam = 'pending', page: pageParam } = await searchParams
  const status = (['pending', 'approved', 'rejected'] as const).includes(
    statusParam as 'pending' | 'approved' | 'rejected'
  )
    ? (statusParam as 'pending' | 'approved' | 'rejected')
    : ('pending' as const)
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = 40
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const [
    { data: images, count, error },
    { data: versions },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase
      .from('images')
      .select(
        `id, image_type, storage_path, source_url, license, review_status,
         image_quality_score, attribution, alt_text, created_at, reviewed_at,
         version:ball_versions(id, name, slug, family:ball_families(brand:brands(name)))`,
        { count: 'exact' }
      )
      .eq('review_status', status)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('ball_versions').select('id, name, slug').order('name').limit(500),
    supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'pending'),
    supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'approved'),
    supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('review_status', 'rejected'),
    supabase.from('images').select('*', { count: 'exact', head: true }),
  ])

  async function addImageRecord(formData: FormData) {
    'use server'
    const raw = {
      version_id: formData.get('version_id'),
      image_type: formData.get('image_type'),
      license: formData.get('license'),
      attribution: formData.get('attribution') || null,
      alt_text: formData.get('alt_text') || null,
      source_url: formData.get('source_url') || null,
      image_quality_score: formData.get('image_quality_score')
        ? Number(formData.get('image_quality_score'))
        : null,
    }
    const parsed = ImageUploadSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))

    const file = formData.get('file') as File | null
    const admin = await createAdminClient()

    let storage_path: string | null = null
    let width: number | null = null
    let height: number | null = null

    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB')
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
      if (!allowed.includes(file.type)) throw new Error('File must be JPEG, PNG, WebP, or AVIF')

      const ext = file.name.split('.').pop() ?? 'jpg'
      const { data: versionRow } = await admin
        .from('ball_versions')
        .select('slug')
        .eq('id', parsed.data.version_id)
        .single()
      const versionSlug = versionRow?.slug ?? parsed.data.version_id
      const path = `${versionSlug}/${parsed.data.image_type}-${Date.now()}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await admin.storage
        .from('ball-images')
        .upload(path, arrayBuffer, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      storage_path = path
    }

    const { error } = await admin.from('images').insert({
      ...parsed.data,
      storage_path,
      width,
      height,
      review_status: 'pending',
    })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/images')
  }

  async function reviewImage(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const raw = {
      review_status: formData.get('review_status'),
      image_quality_score: formData.get('image_quality_score')
        ? Number(formData.get('image_quality_score'))
        : undefined,
      reviewed_by: 'admin',
    }
    const parsed = ImageReviewSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin
      .from('images')
      .update({
        review_status: parsed.data.review_status,
        image_quality_score: parsed.data.image_quality_score ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: parsed.data.reviewed_by ?? 'admin',
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/images')
  }

  async function deleteImage(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const storagePath = formData.get('storage_path') as string | null
    const admin = await createAdminClient()
    if (storagePath) {
      await admin.storage.from('ball-images').remove([storagePath])
    }
    const { error } = await admin.from('images').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/images')
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Images</h1>
        <p className="mt-1 text-sm text-stone-500">
          {totalCount ?? 0} total — upload, categorize, and review ball images
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          {
            label: 'Pending Review',
            count: pendingCount ?? 0,
            status: 'pending',
            color: 'text-yellow-700',
          },
          {
            label: 'Approved',
            count: approvedCount ?? 0,
            status: 'approved',
            color: 'text-green-700',
          },
          {
            label: 'Rejected',
            count: rejectedCount ?? 0,
            status: 'rejected',
            color: 'text-red-600',
          },
        ].map((s) => (
          <a
            key={s.status}
            href={`/admin/images?status=${s.status}`}
            className={`rounded-lg border p-4 transition-colors ${
              status === s.status
                ? 'border-stone-300 bg-stone-100'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="mt-1 text-xs text-stone-500">{s.label}</div>
          </a>
        ))}
      </div>

      {/* Add image form */}
      <details className="mb-6 rounded-lg border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-600">+ Add Image</summary>
        <form action={addImageRecord} encType="multipart/form-data" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-stone-500">Version *</label>
              <select name="version_id" required className="ba-input">
                <option value="">Select version…</option>
                {versions?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Image Type *</label>
              <select name="image_type" required className="ba-input">
                {IMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Upload File</label>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="w-full text-sm text-stone-500 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:text-stone-700 hover:file:bg-stone-200"
              />
              <p className="mt-0.5 text-xs text-stone-400">JPEG, PNG, WebP, AVIF — max 10MB</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-500">Or Source URL</label>
              <input name="source_url" type="url" placeholder="https://…" className="ba-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-stone-500">License *</label>
              <select name="license" required className="ba-input">
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
                name="image_quality_score"
                type="number"
                min="1"
                max="10"
                placeholder="7"
                className="ba-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-stone-500">Attribution</label>
              <input name="attribution" placeholder="e.g. © Titleist 2025" className="ba-input" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-stone-500">Alt Text</label>
            <input
              name="alt_text"
              placeholder="e.g. Titleist Pro V1 2025 hero view"
              className="ba-input"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Add Image
          </button>
        </form>
      </details>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <a
            key={s}
            href={`/admin/images?status=${s}`}
            className={`px-4 py-2 text-sm transition-colors ${
              status === s
                ? 'border-b-2 border-stone-800 text-stone-800'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {REVIEW_STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error.message}</p>}

      {!images?.length ? (
        <p className="py-8 text-center text-sm text-stone-400">No {status} images.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-left font-normal text-stone-500">Version</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Type</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">License</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Quality</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Status</th>
                <th className="px-4 py-3 text-left font-normal text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => {
                const version = img.version as {
                  name: string
                  slug: string
                  family: { brand: { name: string } } | null
                } | null
                const imageUrl = img.storage_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ball-images/${img.storage_path}`
                  : img.source_url

                return (
                  <tr
                    key={img.id}
                    className="border-b border-stone-200 last:border-0 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {version?.family?.brand?.name} {version?.name}
                      </div>
                      {imageUrl && (
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-stone-400 hover:text-stone-500"
                        >
                          View →
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{img.image_type}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">{img.license ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">
                      {img.image_quality_score ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs ${REVIEW_STATUS_COLORS[img.review_status] ?? 'text-stone-500'}`}
                      >
                        {REVIEW_STATUS_LABELS[img.review_status] ?? img.review_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {img.review_status === 'pending' && (
                          <>
                            <form action={reviewImage}>
                              <input type="hidden" name="id" value={img.id} />
                              <input type="hidden" name="review_status" value="approved" />
                              <button
                                type="submit"
                                className="text-xs text-green-500 hover:text-green-700"
                              >
                                Approve
                              </button>
                            </form>
                            <form action={reviewImage}>
                              <input type="hidden" name="id" value={img.id} />
                              <input type="hidden" name="review_status" value="rejected" />
                              <button
                                type="submit"
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Reject
                              </button>
                            </form>
                          </>
                        )}
                        {img.review_status === 'rejected' && (
                          <form action={reviewImage}>
                            <input type="hidden" name="id" value={img.id} />
                            <input type="hidden" name="review_status" value="approved" />
                            <button
                              type="submit"
                              className="text-xs text-stone-400 hover:text-stone-600"
                            >
                              Re-approve
                            </button>
                          </form>
                        )}
                        <form action={deleteImage}>
                          <input type="hidden" name="id" value={img.id} />
                          <input type="hidden" name="storage_path" value={img.storage_path ?? ''} />
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

      {totalPages > 1 && (
        <div className="mt-4 flex gap-3 text-sm">
          {page > 1 && (
            <a
              href={`/admin/images?status=${status}&page=${page - 1}`}
              className="text-stone-500 hover:text-stone-800"
            >
              ← Previous
            </a>
          )}
          <span className="text-stone-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/images?status=${status}&page=${page + 1}`}
              className="text-stone-500 hover:text-stone-800"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
