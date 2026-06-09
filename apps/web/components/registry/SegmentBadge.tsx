type SegmentStyle = {
  color: string
  bg: string
  border: string
}

const SEGMENT_STYLES: Record<string, SegmentStyle> = {
  'tour-premium': {
    color: 'var(--ba-gold)',
    bg: 'var(--ba-gold-soft)',
    border: 'rgba(138,100,32,0.22)',
  },
  performance: {
    color: 'var(--ba-seg-blue)',
    bg: 'var(--ba-seg-blue-soft)',
    border: 'rgba(43,89,127,0.22)',
  },
  'soft-feel': {
    color: 'var(--ba-seg-violet)',
    bg: 'var(--ba-seg-violet-soft)',
    border: 'rgba(97,80,154,0.22)',
  },
  value: {
    color: 'var(--ba-green)',
    bg: 'var(--ba-green-soft)',
    border: 'rgba(31,106,71,0.22)',
  },
  distance: {
    color: 'var(--ba-seg-orange)',
    bg: 'var(--ba-seg-orange-soft)',
    border: 'rgba(168,91,42,0.22)',
  },
  'lake-ball': {
    color: 'var(--ba-subtle)',
    bg: 'var(--ba-sand)',
    border: 'rgba(24,36,29,0.14)',
  },
}

const DEFAULT_STYLE: SegmentStyle = {
  color: 'var(--ba-subtle)',
  bg: 'var(--ba-sand)',
  border: 'rgba(24,36,29,0.14)',
}

export function SegmentBadge({ slug, name }: { slug: string; name: string }) {
  const style = SEGMENT_STYLES[slug] ?? DEFAULT_STYLE

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      {name}
    </span>
  )
}
