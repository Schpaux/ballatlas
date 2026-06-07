import { redirect } from 'next/navigation'

import { BrandSchema } from '@ballatlas/validators'

import { createClient } from '@/lib/supabase/server'

async function createBrand(formData: FormData) {
  'use server'

  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    country: formData.get('country') || null,
    website: formData.get('website') || null,
    logo_url: formData.get('logo_url') || null,
  }

  const parsed = BrandSchema.safeParse(raw)
  if (!parsed.success) {
    // In a production app, use useActionState for field-level errors.
    // For now, throw so the error surfaces visibly.
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert(parsed.data)
  if (error) throw new Error(error.message)

  redirect('/admin/brands')
}

export default function NewBrandPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Brand</h1>
        <p className="mt-1 text-sm text-neutral-400">Register a golf ball manufacturer</p>
      </div>

      <form action={createBrand} className="space-y-4">
        <Field label="Name *" name="name" placeholder="Titleist" required />
        <Field
          label="Slug *"
          name="slug"
          placeholder="titleist"
          required
          hint="Lowercase, hyphens only. Used in URLs."
        />
        <Field label="Country (ISO 2)" name="country" placeholder="US" maxLength={2} />
        <Field label="Website" name="website" type="url" placeholder="https://www.titleist.com" />
        <Field label="Logo URL" name="logo_url" placeholder="https://..." />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Create Brand
          </button>
          <a
            href="/admin/brands"
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
  maxLength,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
  maxLength?: number
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
        maxLength={maxLength}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
