import { revalidatePath } from 'next/cache'

import { PRICE_CONDITION_LABELS, PRICE_CONDITION_ORDER } from '@ballatlas/golf-data'
import { PriceObservationSchema } from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

const MARKETS = [
  { value: 'global', label: 'Global' },
  { value: 'us', label: 'United States' },
  { value: 'no', label: 'Norway' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'au', label: 'Australia' },
]

const CURRENCIES = ['USD', 'NOK', 'GBP', 'EUR', 'AUD']

export default async function PricesPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string; condition?: string; page?: string; archived?: string }>
}) {
  const {
    version: versionFilter,
    condition: conditionFilter,
    page: pageParam,
    archived,
  } = await searchParams
  const showArchived = archived === '1'
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const [
    observationsResult,
    { data: versions },
    { data: sources },
    { count: totalActive },
    { count: totalArchived },
  ] = await Promise.all([
    (() => {
      let q = supabase
        .from('price_observations')
        .select(
          `id, condition, market, currency, price, observed_at, is_archived, notes,
           version:ball_versions(id, name, slug),
           source:sources(id, name, reliability_score)`,
          { count: 'exact' }
        )
        .eq('is_archived', showArchived)
        .order('observed_at', { ascending: false })
        .range(from, to)
      if (versionFilter) q = q.eq('version_id', versionFilter)
      if (conditionFilter)
        q = q.eq(
          'condition',
          conditionFilter as
            | 'new'
            | 'mint'
            | 'near_mint'
            | 'good'
            | 'fair'
            | 'recycled'
            | 'lake_ball'
        )
      return q
    })(),
    supabase.from('ball_versions').select('id, name, slug').order('name').limit(500),
    supabase
      .from('sources')
      .select('id, name, reliability_score, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('price_observations')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false),
    supabase
      .from('price_observations')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', true),
  ])

  const { data: observations, count, error } = observationsResult
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  async function addObservation(formData: FormData) {
    'use server'
    const raw = {
      version_id: formData.get('version_id'),
      condition: formData.get('condition'),
      market: formData.get('market') || 'global',
      currency: (formData.get('currency') as string)?.toUpperCase() || 'USD',
      price: Number(formData.get('price')),
      observed_at: formData.get('observed_at') || undefined,
      source_id: formData.get('source_id') || undefined,
      notes: formData.get('notes') || null,
    }
    const parsed = PriceObservationSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin.from('price_observations').insert(parsed.data)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/prices')
  }

  async function archiveObservation(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const admin = await createAdminClient()
    const { error } = await admin
      .from('price_observations')
      .update({ is_archived: true })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/prices')
  }

  async function unarchiveObservation(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const admin = await createAdminClient()
    const { error } = await admin
      .from('price_observations')
      .update({ is_archived: false })
      .eq('id', id)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/prices')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Price Observations</h1>
          <p className="mt-1 text-sm text-stone-500">
            Append-only market pricing data. Archive to retire, never delete.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <a
            href="/admin/prices"
            className={`rounded-lg border px-3 py-1.5 transition-colors ${
              !showArchived
                ? 'border-stone-300 bg-stone-100 text-stone-800'
                : 'border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            Active ({totalActive ?? 0})
          </a>
          <a
            href="/admin/prices?archived=1"
            className={`rounded-lg border px-3 py-1.5 transition-colors ${
              showArchived
                ? 'border-stone-300 bg-stone-100 text-stone-800'
                : 'border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            Archived ({totalArchived ?? 0})
          </a>
        </div>
      </div>

      {/* Add observation form */}
      {!showArchived && (
        <details className="mb-6 rounded-lg border border-stone-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-stone-600">
            + Add Price Observation
          </summary>
          <form action={addObservation} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-stone-500">Version *</label>
                <select name="version_id" required className="ba-input">
                  <option value="">Select version…</option>
                  {versions?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.slug})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">Condition *</label>
                <select name="condition" required className="ba-input">
                  {PRICE_CONDITION_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {PRICE_CONDITION_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-stone-500">Price (per dozen) *</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="49.99"
                  className="ba-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">Currency</label>
                <select name="currency" defaultValue="USD" className="ba-input">
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">Market</label>
                <select name="market" defaultValue="global" className="ba-input">
                  {MARKETS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">Observed At</label>
                <input name="observed_at" type="datetime-local" className="ba-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-stone-500">Source *</label>
                <select name="source_id" required className="ba-input">
                  <option value="">Select source…</option>
                  {sources?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (reliability: {s.reliability_score}/10)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">Notes</label>
                <input
                  name="notes"
                  placeholder="e.g. Holiday sale, 3-for-2 deal…"
                  className="ba-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              Add Observation
            </button>
          </form>
        </details>
      )}

      {/* Filters */}
      <form method="GET" className="mb-4 flex flex-wrap gap-3">
        {showArchived && <input type="hidden" name="archived" value="1" />}
        <select name="version" defaultValue={versionFilter ?? ''} className="ba-input">
          <option value="">All versions</option>
          {versions?.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select name="condition" defaultValue={conditionFilter ?? ''} className="ba-input">
          <option value="">All conditions</option>
          {PRICE_CONDITION_ORDER.map((c) => (
            <option key={c} value={c}>
              {PRICE_CONDITION_LABELS[c]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700"
        >
          Filter
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error.message}</p>}

      <div className="overflow-hidden rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="px-4 py-3 text-left font-normal text-stone-500">Version</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500">Condition</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500">Price</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500">Market</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500">Source</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500">Observed</th>
              <th className="px-4 py-3 text-left font-normal text-stone-500"></th>
            </tr>
          </thead>
          <tbody>
            {observations?.map((obs) => {
              const version = obs.version as { name: string; slug: string } | null
              const source = obs.source as { name: string; reliability_score: number } | null
              return (
                <tr
                  key={obs.id}
                  className={`border-b border-stone-200 last:border-0 hover:bg-stone-50/50 ${
                    obs.is_archived ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{version?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {PRICE_CONDITION_LABELS[obs.condition as keyof typeof PRICE_CONDITION_LABELS] ??
                      obs.condition}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {obs.currency} {Number(obs.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{obs.market}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {source ? (
                      <span title={`reliability: ${source.reliability_score}/10`}>
                        {source.name}
                      </span>
                    ) : (
                      <span className="text-red-500">No source</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">
                    {new Date(obs.observed_at).toLocaleDateString()}
                    {obs.notes && (
                      <span className="ml-1 text-stone-400" title={obs.notes}>
                        (note)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {obs.is_archived ? (
                      <form action={unarchiveObservation}>
                        <input type="hidden" name="id" value={obs.id} />
                        <button
                          type="submit"
                          className="text-xs text-stone-400 hover:text-stone-600"
                        >
                          Unarchive
                        </button>
                      </form>
                    ) : (
                      <form action={archiveObservation}>
                        <input type="hidden" name="id" value={obs.id} />
                        <button
                          type="submit"
                          className="text-xs text-stone-400 hover:text-yellow-700"
                        >
                          Archive
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
            {!observations?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-stone-400">
                  No observations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-3 text-sm">
          {page > 1 && (
            <a
              href={`/admin/prices?page=${page - 1}${showArchived ? '&archived=1' : ''}`}
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
              href={`/admin/prices?page=${page + 1}${showArchived ? '&archived=1' : ''}`}
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
