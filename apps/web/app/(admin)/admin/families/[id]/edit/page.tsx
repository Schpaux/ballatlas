import { notFound, redirect } from 'next/navigation'

import { BallFamilySchema, BallStatusSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ id: string }> }

export default async function EditFamilyPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: family } = await supabase
    .from('ball_families')
    .select('*, brand:brands(id, name, slug)')
    .eq('id', id)
    .single()
  if (!family) notFound()

  const { data: brands } = await supabase.from('brands').select('id, name, slug').order('name')

  async function updateFamily(formData: FormData) {
    'use server'
    const raw = {
      brand_id: formData.get('brand_id'),
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      first_release_year: formData.get('first_release_year')
        ? Number(formData.get('first_release_year'))
        : null,
      last_release_year: formData.get('last_release_year')
        ? Number(formData.get('last_release_year'))
        : null,
      status: formData.get('status'),
    }
    const parsed = BallFamilySchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    }
    const admin = await createAdminClient()
    const { error } = await admin.from('ball_families').update(parsed.data).eq('id', id)
    if (error) throw new Error(error.message)
    redirect('/admin/families')
  }

  const brandName = (family.brand as { name: string } | null)?.name ?? '—'

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Family</h1>
        <p className="mt-1 text-sm text-stone-500">
          {brandName} → {family.name}
        </p>
      </div>

      <form action={updateFamily} className="space-y-4">
        <div>
          <label htmlFor="brand_id" className="mb-1 block text-sm font-medium text-stone-600">
            Brand *
          </label>
          <select
            id="brand_id"
            name="brand_id"
            required
            defaultValue={family.brand_id}
            className="ba-input"
          >
            {brands?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Name *" name="name" defaultValue={family.name} required />
        <Field
          label="Slug *"
          name="slug"
          defaultValue={family.slug}
          required
          hint="Must be unique within the brand."
        />
        <Field
          label="Description"
          name="description"
          defaultValue={family.description ?? ''}
          multiline
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First Release Year"
            name="first_release_year"
            type="number"
            defaultValue={family.first_release_year?.toString() ?? ''}
          />
          <Field
            label="Last Release Year"
            name="last_release_year"
            type="number"
            defaultValue={family.last_release_year?.toString() ?? ''}
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-stone-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={family.status ?? 'published'}
            className="ba-input"
          >
            {BallStatusSchema.options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Save Changes
          </button>
          <a
            href="/admin/families"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            Cancel
          </a>
        </div>
      </form>
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
  multiline,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  hint?: string
  multiline?: boolean
}) {
  const cls = 'ba-input'
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-600">
        {label}
      </label>
      {multiline ? (
        <textarea id={name} name={name} rows={3} defaultValue={defaultValue} className={cls} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  )
}
