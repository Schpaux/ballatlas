import { redirect } from 'next/navigation'

import { BallVersionSchema } from '@ballatlas/validators'

import { createClient } from '@/lib/supabase/server'

async function createVersion(formData: FormData) {
  'use server'

  const raw = {
    family_id: formData.get('family_id'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    release_year: formData.get('release_year') ? Number(formData.get('release_year')) : null,
    msrp_usd: formData.get('msrp_usd') ? Number(formData.get('msrp_usd')) : null,
    msrp_nok: formData.get('msrp_nok') ? Number(formData.get('msrp_nok')) : null,
    status: formData.get('status') ?? 'draft',
  }

  const parsed = BallVersionSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const supabase = await createClient()
  const { error } = await supabase.from('ball_versions').insert(parsed.data)
  if (error) throw new Error(error.message)

  redirect('/admin/versions')
}

export default async function NewVersionPage() {
  const supabase = await createClient()
  const { data: families } = await supabase
    .from('ball_families')
    .select('id, name, brand:brands(name)')
    .order('name')

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Version</h1>
        <p className="mt-1 text-sm text-stone-500">
          Add a specific ball release year to the registry
        </p>
      </div>

      <form action={createVersion} className="space-y-4">
        <div>
          <label htmlFor="family_id" className="mb-1 block text-sm font-medium text-stone-600">
            Family *
          </label>
          <select id="family_id" name="family_id" required className="ba-input">
            <option value="">Select family…</option>
            {families?.map((f) => (
              <option key={f.id} value={f.id}>
                {(f.brand as { name: string } | null)?.name} — {f.name}
              </option>
            ))}
          </select>
        </div>

        <Field label="Name *" name="name" placeholder="Pro V1 2025" required />
        <Field
          label="Slug *"
          name="slug"
          placeholder="titleist-pro-v1-2025"
          required
          hint="Globally unique. Convention: {brand}-{family}-{year}"
        />
        <Field label="Release Year" name="release_year" type="number" placeholder="2025" />
        <Field label="MSRP (USD)" name="msrp_usd" type="number" placeholder="54.99" />
        <Field label="MSRP (NOK)" name="msrp_nok" type="number" placeholder="599" />

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-stone-600">
            Status
          </label>
          <select id="status" name="status" className="ba-input">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="discontinued">Discontinued</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Create Version
          </button>
          <a
            href="/admin/versions"
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
  placeholder,
  required,
  hint,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
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
        placeholder={placeholder}
        className="ba-input"
      />
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  )
}
