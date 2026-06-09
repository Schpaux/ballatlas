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
    return <p className="text-red-600">Failed to load aliases: {error.message}</p>
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
          <p className="mt-1 text-sm" style={{ color: 'var(--ba-subtle)' }}>
            {count ?? 0} aliases
          </p>
        </div>
      </div>

      {/* Add alias form */}
      <details
        className="mb-6 rounded-xl p-4"
        style={{ border: '1px solid var(--ba-line-strong)' }}
      >
        <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--ba-ink)' }}>
          + Add Alias
        </summary>
        <form action={createAlias} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
              Version *
            </label>
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
            <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
              Alias *
            </label>
            <input name="alias" required placeholder="e.g. Pro V1" className="ba-input" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--ba-subtle)' }}>
              Type
            </label>
            <select name="alias_type" defaultValue="common_name" className="ba-input">
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
              className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--ba-ink)', color: 'var(--ba-paper)' }}
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
          className="ba-input max-w-xs"
        />
      </form>

      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--ba-line-strong)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{ borderBottom: '1px solid var(--ba-line)', background: 'var(--ba-surface)' }}
            >
              {['Alias', 'Type', 'Version', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-normal"
                  style={{ color: 'var(--ba-subtle)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aliases?.map((a) => {
              const version = a.version as { name: string; slug: string } | null
              return (
                <tr key={a.id} className="admin-table-row">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ba-ink)' }}>
                    {a.alias}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ba-subtle)' }}>
                    {a.alias_type}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ba-subtle)' }}>
                    {version?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteAlias}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="text-xs transition-colors hover:text-red-600"
                        style={{ color: 'var(--ba-ghost)' }}
                      >
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
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--ba-subtle)' }}
            >
              ← Previous
            </a>
          )}
          <span style={{ color: 'var(--ba-ghost)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/aliases?page=${page + 1}${q ? `&q=${q}` : ''}`}
              className="transition-opacity hover:opacity-70"
              style={{ color: 'var(--ba-subtle)' }}
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
