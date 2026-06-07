// Field-diff engine for the /compare page.
//
// computeFieldDiff() takes N ball profiles and returns a row-per-field structure
// with a highlight tag for each column. This runs server-side in the compare page
// so the table is fully server-rendered with no client JS for the diff logic.

export type CompareBallProfile = {
  id: string
  slug: string
  name: string
  brandName: string | null
  familyName: string | null
  releaseYear: number | null
  segments: { slug: string; name: string }[]
  specs: {
    compression: number | null
    construction_layers: number | null
    cover_material: string | null
    launch_profile: string | null
    spin_profile: string | null
    feel_profile: string | null
    dimple_count: number | null
  } | null
  msrp_usd: number | null
}

export type HighlightTag =
  | 'highest' // highest numeric value across balls
  | 'lowest' // lowest numeric value
  | 'unique' // only this ball has this value
  | 'shared' // all non-null balls share this value
  | 'missing' // null / unknown

export type FieldRow = {
  key: string
  label: string
  values: (string | number | null)[]
  highlights: HighlightTag[]
  format?: 'number' | 'currency' | 'text'
}

export function computeFieldDiff(profiles: CompareBallProfile[]): FieldRow[] {
  const rows: FieldRow[] = []

  // Numeric field helper
  function numericRow(
    key: string,
    label: string,
    getter: (p: CompareBallProfile) => number | null,
    format: FieldRow['format'] = 'number'
  ) {
    const values = profiles.map(getter)
    const nonNull = values.filter((v): v is number => v != null)
    const max = nonNull.length > 0 ? Math.max(...nonNull) : null
    const min = nonNull.length > 0 ? Math.min(...nonNull) : null
    const allSame = nonNull.length === values.length && nonNull.every((v) => v === nonNull[0])

    const highlights: HighlightTag[] = values.map((v) => {
      if (v == null) return 'missing'
      if (allSame) return 'shared'
      if (nonNull.length === 1) return 'shared'
      if (v === max && max !== min) return 'highest'
      if (v === min && max !== min) return 'lowest'
      return 'shared'
    })

    rows.push({ key, label, values, highlights, format })
  }

  // String field helper
  function stringRow(key: string, label: string, getter: (p: CompareBallProfile) => string | null) {
    const values = profiles.map(getter)
    const nonNull = values.filter((v): v is string => v != null && v !== '')
    const unique = new Set(nonNull)
    const allSame = nonNull.length === values.length && unique.size === 1

    const highlights: HighlightTag[] = values.map((v) => {
      if (v == null || v === '') return 'missing'
      if (allSame) return 'shared'
      const count = nonNull.filter((nv) => nv === v).length
      return count === 1 ? 'unique' : 'shared'
    })

    rows.push({ key, label, values, highlights })
  }

  // ── Fields in display priority order ──────────────────────────────────────
  stringRow('brand', 'Brand', (p) => p.brandName)
  stringRow('family', 'Model Line', (p) => p.familyName)
  numericRow('release_year', 'Release Year', (p) => p.releaseYear)
  stringRow('segment', 'Segment', (p) => p.segments[0]?.name ?? null)
  numericRow('compression', 'Compression', (p) => p.specs?.compression ?? null)
  stringRow('construction_layers', 'Construction', (p) =>
    p.specs?.construction_layers != null ? `${p.specs.construction_layers}-piece` : null
  )
  stringRow('cover_material', 'Cover Material', (p) => p.specs?.cover_material ?? null)
  stringRow('launch_profile', 'Launch Profile', (p) => {
    const v = p.specs?.launch_profile
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : null
  })
  stringRow('spin_profile', 'Spin Profile', (p) => {
    const v = p.specs?.spin_profile
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : null
  })
  stringRow('feel_profile', 'Feel Profile', (p) => {
    const v = p.specs?.feel_profile
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : null
  })
  numericRow('dimple_count', 'Dimple Count', (p) => p.specs?.dimple_count ?? null)
  numericRow('msrp_usd', 'MSRP (per dozen)', (p) => p.msrp_usd, 'currency')

  return rows
}

// ─── Difference summary sentences ────────────────────────────────────────────

export function buildDifferenceSummary(a: CompareBallProfile, b: CompareBallProfile): string[] {
  const sentences: string[] = []

  // Compression
  const compA = a.specs?.compression
  const compB = b.specs?.compression
  if (compA != null && compB != null && compA !== compB) {
    const softer = compA < compB ? a.name : b.name
    const firmer = compA < compB ? b.name : a.name
    sentences.push(
      `${softer} has lower compression (${Math.min(compA, compB)}) for a softer feel than ${firmer} (${Math.max(compA, compB)}).`
    )
  }

  // Cover material
  const coverA = a.specs?.cover_material
  const coverB = b.specs?.cover_material
  if (coverA && coverB && coverA.toLowerCase() !== coverB.toLowerCase()) {
    sentences.push(`${a.name} uses a ${coverA} cover while ${b.name} uses ${coverB}.`)
  }

  // Feel profile
  const feelA = a.specs?.feel_profile
  const feelB = b.specs?.feel_profile
  if (feelA && feelB && feelA !== feelB) {
    sentences.push(`${a.name} has a ${feelA} feel profile versus ${feelB} for ${b.name}.`)
  }

  // Segment
  const segA = a.segments[0]?.name
  const segB = b.segments[0]?.name
  if (segA && segB && segA !== segB) {
    sentences.push(`${a.name} is in the ${segA} segment; ${b.name} is in the ${segB} segment.`)
  }

  return sentences.slice(0, 3)
}
