// Completeness scoring — how much of a ball's data is filled in.
//
// Weights reflect what matters most for users: specs (40%), valuation (30%),
// visual identification (20%), images (10%).

export type CompletenessInput = {
  specs: {
    compression: number | null
    construction_layers: number | null
    cover_material: string | null
    core_material: string | null
    dimple_count: number | null
    launch_profile: string | null
    spin_profile: string | null
    feel_profile: string | null
  } | null
  visual: {
    primary_color: string | null
    finish: string | null
    logo_style: string | null
    logo_text: string | null
  } | null
  priceObservationCount: number
  hasApprovedImage: boolean
}

export type CompletenessCategory = {
  name: string
  filled: number
  total: number
  pct: number
}

export type CompletenessResult = {
  /** Overall score 0–100 */
  score: number
  categories: CompletenessCategory[]
  missingFields: string[]
}

// Field label lookup for readable "missing fields" output
const SPEC_FIELDS: { key: keyof NonNullable<CompletenessInput['specs']>; label: string }[] = [
  { key: 'compression', label: 'Compression' },
  { key: 'construction_layers', label: 'Construction layers' },
  { key: 'cover_material', label: 'Cover material' },
  { key: 'core_material', label: 'Core material' },
  { key: 'dimple_count', label: 'Dimple count' },
  { key: 'launch_profile', label: 'Launch profile' },
  { key: 'spin_profile', label: 'Spin profile' },
  { key: 'feel_profile', label: 'Feel profile' },
]

const VISUAL_FIELDS: { key: keyof NonNullable<CompletenessInput['visual']>; label: string }[] = [
  { key: 'primary_color', label: 'Ball color' },
  { key: 'finish', label: 'Finish type' },
  { key: 'logo_style', label: 'Logo style' },
  { key: 'logo_text', label: 'Logo text' },
]

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const missingFields: string[] = []

  // ── Technical specs (40%) ──────────────────────────────────────────────────
  let specsFilled = 0
  const specsTotal = SPEC_FIELDS.length

  if (input.specs) {
    for (const { key, label } of SPEC_FIELDS) {
      const val = input.specs[key]
      if (val != null && val !== '') {
        specsFilled++
      } else {
        missingFields.push(label)
      }
    }
  } else {
    missingFields.push(...SPEC_FIELDS.map((f) => f.label))
  }

  const specsPct = specsTotal > 0 ? specsFilled / specsTotal : 0

  // ── Valuation (30%) ────────────────────────────────────────────────────────
  const valuationFilled = input.priceObservationCount > 0 ? 1 : 0
  const valuationTotal = 1
  if (valuationFilled === 0) missingFields.push('Market price data')
  const valuationPct = valuationFilled

  // ── Visual ID (20%) ────────────────────────────────────────────────────────
  let visualFilled = 0
  const visualTotal = VISUAL_FIELDS.length

  if (input.visual) {
    for (const { key, label } of VISUAL_FIELDS) {
      const val = input.visual[key]
      if (val != null && val !== '') {
        visualFilled++
      } else {
        missingFields.push(label)
      }
    }
  } else {
    missingFields.push(...VISUAL_FIELDS.map((f) => f.label))
  }

  const visualPct = visualTotal > 0 ? visualFilled / visualTotal : 0

  // ── Images (10%) ────────────────────────────────────────────────────────────
  const imagesFilled = input.hasApprovedImage ? 1 : 0
  if (!input.hasApprovedImage) missingFields.push('Product image')
  const imagesPct = imagesFilled

  // ── Weighted score ────────────────────────────────────────────────────────
  const score = Math.round(
    (specsPct * 0.4 + valuationPct * 0.3 + visualPct * 0.2 + imagesPct * 0.1) * 100
  )

  return {
    score,
    categories: [
      {
        name: 'Technical Specs',
        filled: specsFilled,
        total: specsTotal,
        pct: Math.round(specsPct * 100),
      },
      {
        name: 'Valuation',
        filled: valuationFilled,
        total: valuationTotal,
        pct: Math.round(valuationPct * 100),
      },
      {
        name: 'Visual ID',
        filled: visualFilled,
        total: visualTotal,
        pct: Math.round(visualPct * 100),
      },
      { name: 'Images', filled: imagesFilled, total: 1, pct: Math.round(imagesPct * 100) },
    ],
    missingFields,
  }
}
