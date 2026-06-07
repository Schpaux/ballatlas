import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BallVersionSchema } from '@ballatlas/validators'

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
        <p className="mt-1 text-sm text-neutral-400">
          Add a specific ball release year to the registry
        </p>
      </div>

      <form action={createVersion} className="space-y-4">
        <div>
          <label htmlFor="family_id" className="mb-1 block text-sm font-medium text-neutral-300">
            Family *
          </label>
          <select
            id="family_id"
            name="family_id"
            required
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
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
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-neutral-300">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="discontinued">Discontinued</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Create Version
          </button>
          <a
            href="/admin/versions"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
