import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { BrandSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ id: string }> }

export default async function EditBrandPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('*').eq('id', id).single()
  if (!brand) notFound()

  const { count: assetCount } = await supabase
    .from('brand_assets')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', id)

  async function updateBrand(formData: FormData) {
    'use server'
    const raw = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      country: formData.get('country') || null,
      website: formData.get('website') || null,
      logo_url: formData.get('logo_url') || null,
      primary_color: formData.get('primary_color') || null,
      secondary_color: formData.get('secondary_color') || null,
    }
    const parsed = BrandSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    }
    const admin = await createAdminClient()
    const { error } = await admin.from('brands').update(parsed.data).eq('id', id)
    if (error) throw new Error(error.message)
    redirect('/admin/brands')
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Brand</h1>
        <p className="mt-1 font-mono text-xs text-stone-500">{brand.slug}</p>
      </div>

      <form action={updateBrand} className="space-y-4">
        <Field label="Name *" name="name" defaultValue={brand.name} required />
        <Field
          label="Slug *"
          name="slug"
          defaultValue={brand.slug}
          required
          hint="Changing the slug will break existing URLs."
        />
        <Field
          label="Country (ISO 2)"
          name="country"
          defaultValue={brand.country ?? ''}
          maxLength={2}
        />
        <Field label="Website" name="website" type="url" defaultValue={brand.website ?? ''} />
        <Field
          label="Logo URL (legacy)"
          name="logo_url"
          defaultValue={brand.logo_url ?? ''}
          hint="Prefer managed assets via Brand Assets. This URL is used as a fallback."
        />

        <div className="border-t border-stone-200 pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-stone-400">
            Brand Identity
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Primary Color"
              name="primary_color"
              defaultValue={brand.primary_color ?? ''}
              hint="CSS hex or named color, e.g. #e31837"
            />
            <Field
              label="Secondary Color"
              name="secondary_color"
              defaultValue={brand.secondary_color ?? ''}
              hint="CSS hex or named color"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Save Changes
          </button>
          <a
            href="/admin/brands"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            Cancel
          </a>
        </div>
      </form>

      <div className="mt-8 border-t border-stone-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-600">Brand Assets</p>
            <p className="mt-0.5 text-xs text-stone-400">
              {assetCount ?? 0} asset{assetCount !== 1 ? 's' : ''} — logos, marks, and references
            </p>
          </div>
          <Link
            href={`/admin/brand-assets?brand=${brand.slug}`}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            Manage Assets →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  hint,
  maxLength,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  hint?: string
  maxLength?: number
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-600">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className="ba-input"
      />
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  )
}
