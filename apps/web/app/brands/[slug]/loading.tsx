export default function BrandLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
        <div className="h-8 w-64 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  )
}
