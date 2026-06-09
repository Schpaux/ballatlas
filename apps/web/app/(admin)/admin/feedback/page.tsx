import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS } from '@ballatlas/validators'

import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 50

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const { type: typeFilter, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('feedback_submissions')
    .select(
      `id, type, message, email, source_url, created_at,
       version:ball_versions(id, name, slug)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  const validTypeFilter = FEEDBACK_TYPES.find((t) => t === typeFilter)
  if (validTypeFilter) {
    query = query.eq('type', validTypeFilter)
  }

  const { data: submissions, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const TYPE_CLASSES: Record<string, string> = {
    incorrect_info: 'text-red-600',
    suggest_correction: 'text-yellow-700',
    request_ball: 'text-sky-700',
    missing_specs: 'text-stone-500',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Feedback</h1>
          <p className="mt-1 text-sm text-stone-500">
            {count ?? 0} submission{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <a
          href="/admin/feedback"
          className={`rounded-lg border px-3 py-1.5 transition-colors ${
            !typeFilter
              ? 'border-stone-300 text-stone-700'
              : 'border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600'
          }`}
        >
          All
        </a>
        {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
          <a
            key={value}
            href={`/admin/feedback?type=${value}`}
            className={`rounded-lg border px-3 py-1.5 transition-colors ${
              typeFilter === value
                ? 'border-stone-300 text-stone-700'
                : 'border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Submissions list */}
      {!submissions || submissions.length === 0 ? (
        <p className="py-12 text-center text-sm text-stone-400">No submissions.</p>
      ) : (
        <div className="divide-y divide-stone-200 rounded-lg border border-stone-200">
          {submissions.map((sub) => {
            const version = Array.isArray(sub.version) ? sub.version[0] : sub.version
            return (
              <div key={sub.id} className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`text-xs font-medium ${TYPE_CLASSES[sub.type] ?? 'text-stone-500'}`}
                  >
                    {FEEDBACK_TYPE_LABELS[sub.type as keyof typeof FEEDBACK_TYPE_LABELS] ??
                      sub.type}
                  </span>
                  {version && typeof version === 'object' && 'slug' in version && (
                    <a
                      href={`/balls/${version.slug}`}
                      className="text-xs text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
                    >
                      {version.name}
                    </a>
                  )}
                  <span className="ml-auto font-mono text-xs text-stone-300">
                    {new Date(sub.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{sub.message}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-400">
                  {sub.email && <span>Email: {sub.email}</span>}
                  {sub.source_url && (
                    <a
                      href={sub.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:text-stone-500 hover:underline"
                    >
                      Source →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <a
              href={`/admin/feedback?${typeFilter ? `type=${typeFilter}&` : ''}page=${page - 1}`}
              className="rounded-lg border border-stone-200 px-4 py-2 text-stone-500 hover:border-stone-300"
            >
              ← Previous
            </a>
          )}
          <span className="text-stone-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/feedback?${typeFilter ? `type=${typeFilter}&` : ''}page=${page + 1}`}
              className="rounded-lg border border-stone-200 px-4 py-2 text-stone-500 hover:border-stone-300"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
