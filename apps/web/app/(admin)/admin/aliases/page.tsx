import { revalidatePath } from 'next/cache'

import { CreateBallAliasSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export default async function AliasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  let query = supabase
    .from('ball_aliases')
    .select(`id, alias, alias_type, version:ball_versions(id, name, slug)`, { count: 'exact' })
    .order('alias')
    .range(from, to)

  if (q) {
    query = query.ilike('alias', `%${q}%`)
  }

  const { data: aliases, count, error } = await query

  const { data: versions } = await supabase
    .from('ball_versions')
    .select('id, name, slug')
    .order('name')
    .limit(500)

  if (error) {
    return <p className="text-red-400">Failed to load aliases: {error.message}</p>
  }

  async function createAlias(formData: FormData) {
    'use server'
    const raw = {
      version_id: formData.get('version_id'),
      alias: formData.get('alias'),
      alias_type: formData.get('alias_type'),
    }
    const parsed = CreateBallAliasSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    }
    const admin = await createAdminClient()
    const { error } = await admin.from('ball_aliases').insert(parsed.data)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/aliases')
  }

  async function deleteAlias(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const admin = await createAdminClient()
    const { error } = await admin.from('ball_aliases').delete().eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/aliases')
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aliases</h1>
          <p className="mt-1 text-sm text-neutral-400">{count ?? 0} aliases</p>
        </div>
      </div>

      {/* Add alias form */}
      <details className="mb-6 rounded-lg border border-neutral-800 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-300">
          + Add Alias
        </summary>
        <form action={createAlias} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Version *</label>
            <select
              name="version_id"
              required
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            >
              <option value="">Select version…</option>
              {versions?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Alias *</label>
            <input
              name="alias"
              required
              placeholder="e.g. Pro V1"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Type</label>
            <select
              name="alias_type"
              defaultValue="common_name"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            >
              {[
                'common_name',
                'abbreviation',
                'misspelling',
                'regional_name',
                'generation_tag',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Add Alias
            </button>
          </div>
        </form>
      </details>

      {/* Search */}
      <form method="GET" className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search aliases…"
          className="w-full max-w-xs rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
        />
      </form>

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900">
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Alias</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Type</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400">Version</th>
              <th className="px-4 py-3 text-left font-normal text-neutral-400"></th>
            </tr>
          </thead>
          <tbody>
            {aliases?.map((a) => {
              const version = a.version as { name: string; slug: string } | null
              return (
                <tr
                  key={a.id}
                  className="border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50"
                >
                  <td className="px-4 py-3 font-medium">{a.alias}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">{a.alias_type}</td>
                  <td className="px-4 py-3 text-neutral-400">{version?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteAlias}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs text-neutral-600 hover:text-red-400">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {page > 1 && (
            <a
              href={`/admin/aliases?page=${page - 1}${q ? `&q=${q}` : ''}`}
              className="text-neutral-400 hover:text-neutral-100"
            >
              ← Previous
            </a>
          )}
          <span className="text-neutral-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/aliases?page=${page + 1}${q ? `&q=${q}` : ''}`}
              className="text-neutral-400 hover:text-neutral-100"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
