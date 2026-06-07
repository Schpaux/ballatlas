const SEGMENT_CONFIG: Record<string, { label: string; className: string }> = {
  'tour-premium': {
    label: 'Tour Premium',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  performance: {
    label: 'Performance',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  'soft-feel': {
    label: 'Soft Feel',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  value: {
    label: 'Value',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  distance: {
    label: 'Distance',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  'lake-ball': {
    label: 'Lake Ball',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
}

export function SegmentBadge({ slug, name }: { slug: string; name: string }) {
  const config = SEGMENT_CONFIG[slug] ?? {
    label: name,
    className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
