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
    incorrect_info: 'text-red-400',
    suggest_correction: 'text-yellow-400',
    request_ball: 'text-sky-400',
    missing_specs: 'text-neutral-400',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Feedback</h1>
          <p className="mt-1 text-sm text-neutral-400">
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
              ? 'border-neutral-600 text-neutral-200'
              : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
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
                ? 'border-neutral-600 text-neutral-200'
                : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Submissions list */}
      {!submissions || submissions.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-600">No submissions.</p>
      ) : (
        <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {submissions.map((sub) => {
            const version = Array.isArray(sub.version) ? sub.version[0] : sub.version
            return (
              <div key={sub.id} className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span
                    className={`text-xs font-medium ${TYPE_CLASSES[sub.type] ?? 'text-neutral-400'}`}
                  >
                    {FEEDBACK_TYPE_LABELS[sub.type as keyof typeof FEEDBACK_TYPE_LABELS] ??
                      sub.type}
                  </span>
                  {version && typeof version === 'object' && 'slug' in version && (
                    <a
                      href={`/balls/${version.slug}`}
                      className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-300 hover:underline"
                    >
                      {version.name}
                    </a>
                  )}
                  <span className="ml-auto font-mono text-xs text-neutral-700">
                    {new Date(sub.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-neutral-300">{sub.message}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-600">
                  {sub.email && <span>Email: {sub.email}</span>}
                  {sub.source_url && (
                    <a
                      href={sub.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:text-neutral-400 hover:underline"
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
              className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:border-neutral-600"
            >
              ← Previous
            </a>
          )}
          <span className="text-neutral-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/feedback?${typeFilter ? `type=${typeFilter}&` : ''}page=${page + 1}`}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-neutral-400 hover:border-neutral-600"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
