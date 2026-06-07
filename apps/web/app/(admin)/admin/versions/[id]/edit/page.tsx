import { notFound, redirect } from 'next/navigation'

import { BallStatusSchema, BallVersionSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ id: string }> }

export default async function EditVersionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: version } = await supabase
    .from('ball_versions')
    .select('*, family:ball_families(id, name, slug, brand:brands(name))')
    .eq('id', id)
    .single()
  if (!version) notFound()

  const { data: families } = await supabase
    .from('ball_families')
    .select('id, name, slug, brand:brands(name)')
    .order('name')
    .limit(200)

  async function updateVersion(formData: FormData) {
    'use server'
    const raw = {
      family_id: formData.get('family_id'),
      name: formData.get('name'),
      slug: formData.get('slug'),
      release_year: formData.get('release_year') ? Number(formData.get('release_year')) : null,
      release_date: formData.get('release_date') || null,
      msrp_usd: formData.get('msrp_usd') ? Number(formData.get('msrp_usd')) : null,
      msrp_nok: formData.get('msrp_nok') ? Number(formData.get('msrp_nok')) : null,
      status: formData.get('status'),
    }
    const parsed = BallVersionSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    }
    const admin = await createAdminClient()
    const { error } = await admin.from('ball_versions').update(parsed.data).eq('id', id)
    if (error) throw new Error(error.message)
    redirect('/admin/versions')
  }

  const familyLabel = (version.family as { name: string } | null)?.name ?? '—'

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Edit Version</h1>
        <p className="mt-1 text-sm text-neutral-400">{familyLabel}</p>
        <p className="mt-0.5 font-mono text-xs text-neutral-500">{version.slug}</p>
      </div>

      <form action={updateVersion} className="space-y-4">
        <div>
          <label htmlFor="family_id" className="mb-1 block text-sm font-medium text-neutral-300">
            Family *
          </label>
          <select
            id="family_id"
            name="family_id"
            required
            defaultValue={version.family_id}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
            {families?.map((f) => {
              const brandName = (f.brand as { name: string } | null)?.name
              return (
                <option key={f.id} value={f.id}>
                  {brandName ? `${brandName} — ` : ''}
                  {f.name}
                </option>
              )
            })}
          </select>
        </div>

        <Field label="Name *" name="name" defaultValue={version.name} required />
        <Field
          label="Slug *"
          name="slug"
          defaultValue={version.slug}
          required
          hint="Globally unique. Changing breaks existing URLs."
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Release Year"
            name="release_year"
            type="number"
            defaultValue={version.release_year?.toString() ?? ''}
          />
          <Field
            label="Release Date"
            name="release_date"
            type="date"
            defaultValue={version.release_date ?? ''}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="MSRP USD"
            name="msrp_usd"
            type="number"
            defaultValue={version.msrp_usd?.toString() ?? ''}
          />
          <Field
            label="MSRP NOK"
            name="msrp_nok"
            type="number"
            defaultValue={version.msrp_nok?.toString() ?? ''}
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-neutral-300">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={version.status ?? 'published'}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
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
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Save Changes
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
  defaultValue,
  required,
  hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
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
        defaultValue={defaultValue}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
