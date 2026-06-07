import { RegistryLayout } from '@/components/registry/RegistryLayout'

export default function BallDetailLoading() {
  return (
    <RegistryLayout>
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-8 sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex gap-2">
          {[60, 80, 120].map((w) => (
            <div key={w} className="h-3 rounded bg-white/[0.04]" style={{ width: w }} />
          ))}
        </div>

        {/* Hero skeleton */}
        <div className="mb-10">
          <div className="mb-2 h-4 w-24 rounded bg-white/[0.04]" />
          <div className="mb-3 h-10 w-80 rounded bg-white/[0.06]" />
          <div className="flex gap-3">
            <div className="h-5 w-12 rounded-full bg-white/[0.04]" />
            <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="mb-4 h-3 w-32 rounded bg-white/[0.04]" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between border-b border-white/[0.04] pb-3">
                      <div className="h-4 w-28 rounded bg-white/[0.04]" />
                      <div className="h-4 w-20 rounded bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="h-48 rounded-lg border border-white/[0.04] bg-white/[0.02]" />
        </div>
      </div>
    </RegistryLayout>
  )
}
