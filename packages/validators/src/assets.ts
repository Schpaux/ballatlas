import { z } from 'zod'

// ─── SVG Normalization ────────────────────────────────────────────────────────

type BBox = { minX: number; minY: number; maxX: number; maxY: number }

const NUM_RE = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

function mergeBBox(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

// Compute approximate bounding box from an SVG path `d` attribute.
// Uses all specified coordinates including bezier control points — may add a tiny
// amount of extra space vs the true tight bounds, but is always conservative (never clips).
function pathBBox(d: string): BBox | null {
  const segments = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g)
  if (!segments) return null

  const xs: number[] = []
  const ys: number[] = []
  let cx = 0,
    cy = 0

  const push = (x: number, y: number) => {
    xs.push(x)
    ys.push(y)
  }

  for (const seg of segments) {
    const type = seg[0] as string
    const nums = (seg.slice(1).match(NUM_RE) ?? []).map(Number)
    const rel = type === type.toLowerCase() && type.toUpperCase() !== 'Z'

    switch (type.toUpperCase()) {
      case 'M':
        for (let i = 0; i + 1 < nums.length; i += 2) {
          if (rel) {
            cx += nums[i] ?? 0
            cy += nums[i + 1] ?? 0
          } else {
            cx = nums[i] ?? 0
            cy = nums[i + 1] ?? 0
          }
          push(cx, cy)
        }
        break
      case 'L':
      case 'T':
        for (let i = 0; i + 1 < nums.length; i += 2) {
          if (rel) {
            cx += nums[i] ?? 0
            cy += nums[i + 1] ?? 0
          } else {
            cx = nums[i] ?? 0
            cy = nums[i + 1] ?? 0
          }
          push(cx, cy)
        }
        break
      case 'H':
        for (const n of nums) {
          if (rel) cx += n
          else cx = n
          push(cx, cy)
        }
        break
      case 'V':
        for (const n of nums) {
          if (rel) cy += n
          else cy = n
          push(cx, cy)
        }
        break
      case 'C':
        // 6 args per segment: x1,y1, x2,y2, x,y
        for (let i = 0; i + 6 <= nums.length; i += 6) {
          if (rel) {
            push(cx + (nums[i] ?? 0), cy + (nums[i + 1] ?? 0))
            push(cx + (nums[i + 2] ?? 0), cy + (nums[i + 3] ?? 0))
            cx += nums[i + 4] ?? 0
            cy += nums[i + 5] ?? 0
          } else {
            push(nums[i] ?? 0, nums[i + 1] ?? 0)
            push(nums[i + 2] ?? 0, nums[i + 3] ?? 0)
            cx = nums[i + 4] ?? 0
            cy = nums[i + 5] ?? 0
          }
          push(cx, cy)
        }
        break
      case 'S':
      case 'Q':
        // 4 args per segment: x1,y1, x,y
        for (let i = 0; i + 4 <= nums.length; i += 4) {
          if (rel) {
            push(cx + (nums[i] ?? 0), cy + (nums[i + 1] ?? 0))
            cx += nums[i + 2] ?? 0
            cy += nums[i + 3] ?? 0
          } else {
            push(nums[i] ?? 0, nums[i + 1] ?? 0)
            cx = nums[i + 2] ?? 0
            cy = nums[i + 3] ?? 0
          }
          push(cx, cy)
        }
        break
      case 'A':
        // 7 args per segment: rx,ry,x-rot,large-arc,sweep,x,y
        for (let i = 0; i + 7 <= nums.length; i += 7) {
          if (rel) {
            cx += nums[i + 5] ?? 0
            cy += nums[i + 6] ?? 0
          } else {
            cx = nums[i + 5] ?? 0
            cy = nums[i + 6] ?? 0
          }
          push(cx, cy)
        }
        break
    }
  }

  if (xs.length === 0) return null
  return {
    minX: xs.reduce((a, b) => Math.min(a, b), Infinity),
    minY: ys.reduce((a, b) => Math.min(a, b), Infinity),
    maxX: xs.reduce((a, b) => Math.max(a, b), -Infinity),
    maxY: ys.reduce((a, b) => Math.max(a, b), -Infinity),
  }
}

function shapeBBox(tag: string, attrs: string): BBox | null {
  const num = (name: string, def = 0) => {
    const m = attrs.match(new RegExp(`\\b${name}="([^"]+)"`))
    return m ? parseFloat(m[1] ?? '0') : def
  }
  switch (tag) {
    case 'rect': {
      const x = num('x'),
        y = num('y'),
        w = num('width'),
        h = num('height')
      return w > 0 && h > 0 ? { minX: x, minY: y, maxX: x + w, maxY: y + h } : null
    }
    case 'circle': {
      const cx = num('cx'),
        cy = num('cy'),
        r = num('r')
      return r > 0 ? { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r } : null
    }
    case 'ellipse': {
      const cx = num('cx'),
        cy = num('cy'),
        rx = num('rx'),
        ry = num('ry')
      return rx > 0 && ry > 0
        ? { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry }
        : null
    }
    case 'line':
      return {
        minX: Math.min(num('x1'), num('x2')),
        minY: Math.min(num('y1'), num('y2')),
        maxX: Math.max(num('x1'), num('x2')),
        maxY: Math.max(num('y1'), num('y2')),
      }
    case 'polygon':
    case 'polyline': {
      const m = attrs.match(/points="([^"]+)"/)
      if (!m) return null
      const pts = (m[1] ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      const pxs: number[] = [],
        pys: number[] = []
      for (let i = 0; i + 1 < pts.length; i += 2) {
        pxs.push(pts[i] ?? 0)
        pys.push(pts[i + 1] ?? 0)
      }
      if (pxs.length === 0) return null
      return {
        minX: pxs.reduce((a, b) => Math.min(a, b), Infinity),
        minY: pys.reduce((a, b) => Math.min(a, b), Infinity),
        maxX: pxs.reduce((a, b) => Math.max(a, b), -Infinity),
        maxY: pys.reduce((a, b) => Math.max(a, b), -Infinity),
      }
    }
    default:
      return null
  }
}

const WHITE_FILLS = new Set(['#fff', '#ffffff', 'white', 'rgb(255,255,255)', 'rgb(255, 255, 255)'])

function isBackgroundFill(attrs: string): boolean {
  const fillOpacity = attrs.match(/\bfill-opacity="([^"]+)"/)?.[1]
  if (fillOpacity === '0') return true
  const fill = attrs
    .match(/\bfill="([^"]+)"/)?.[1]
    ?.toLowerCase()
    .trim()
  return fill !== undefined && WHITE_FILLS.has(fill)
}

function coversCanvas(bbox: BBox, canvas: BBox): boolean {
  const cw = canvas.maxX - canvas.minX,
    ch = canvas.maxY - canvas.minY
  if (cw === 0 || ch === 0) return false
  return (bbox.maxX - bbox.minX) / cw >= 0.9 && (bbox.maxY - bbox.minY) / ch >= 0.9
}

// Normalizes an SVG string for use as a brand logo:
// 1. Removes white/transparent background elements that cover the full canvas.
// 2. Computes a tight viewBox from remaining content coordinates.
// 3. Strips fixed width/height so `h-N w-auto` CSS gives the correct aspect ratio.
export function normalizeSvg(content: string): string {
  // ── Parse canvas dimensions from viewBox or width/height ───────────────────
  let canvas: BBox | null = null
  const vbMatch = content.match(/viewBox="([^"]+)"/i)
  if (vbMatch) {
    const parts = (vbMatch[1] ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4) {
      const [vx, vy, vw, vh] = parts
      if (vw && vw > 0 && vh && vh > 0)
        canvas = { minX: vx ?? 0, minY: vy ?? 0, maxX: (vx ?? 0) + vw, maxY: (vy ?? 0) + vh }
    }
  }
  if (!canvas) {
    const wm = content.match(/\bwidth="([\d.]+)"/)
    const hm = content.match(/\bheight="([\d.]+)"/)
    if (wm && hm) {
      const w = parseFloat(wm[1] ?? '0'),
        h = parseFloat(hm[1] ?? '0')
      if (w > 0 && h > 0) canvas = { minX: 0, minY: 0, maxX: w, maxY: h }
    }
  }

  // ── Strip background elements ───────────────────────────────────────────────
  let svg = content.replace(
    /<(path|rect|polygon|ellipse|circle)(\s[^/>]*)?\/>/gi,
    (match, tag: string, attrs: string = '') => {
      if (!isBackgroundFill(attrs)) return match
      if (!canvas) return match
      let bbox: BBox | null = null
      if (tag.toLowerCase() === 'path') {
        const dm = attrs.match(/\bd="([^"]+)"/)
        if (dm) bbox = pathBBox(dm[1] ?? '')
      } else {
        bbox = shapeBBox(tag.toLowerCase(), attrs)
      }
      return bbox && coversCanvas(bbox, canvas) ? '' : match
    }
  )

  // ── Compute tight content bounding box ─────────────────────────────────────
  let contentBBox: BBox | null = null
  const update = (bbox: BBox | null) => {
    if (!bbox) return
    contentBBox = contentBBox ? mergeBBox(contentBBox, bbox) : bbox
  }

  for (const [, d] of svg.matchAll(/\bd="([^"]+)"/g)) {
    update(pathBBox(d ?? ''))
  }
  for (const [, tag, attrs = ''] of svg.matchAll(
    /<(rect|circle|ellipse|line|polygon|polyline)(\s[^/>]*)?\/>/gi
  )) {
    update(shapeBBox((tag ?? '').toLowerCase(), attrs))
  }

  if (!contentBBox) return svg
  const { minX, minY, maxX, maxY } = contentBBox
  const w = maxX - minX,
    h = maxY - minY
  if (w <= 0 || h <= 0) return svg

  // 5% padding so strokes at the boundary aren't clipped
  const pad = Math.min(w, h) * 0.05
  const tight = `${(minX - pad).toFixed(3)} ${(minY - pad).toFixed(3)} ${(w + pad * 2).toFixed(3)} ${(h + pad * 2).toFixed(3)}`

  // ── Apply tight viewBox, strip fixed width/height ──────────────────────────
  svg = /viewBox=/i.test(svg)
    ? svg.replace(/viewBox="[^"]+"/i, `viewBox="${tight}"`)
    : svg.replace(/(<svg\b)/i, `$1 viewBox="${tight}"`)

  // Fixed width/height override viewBox aspect ratio — remove them
  svg = svg.replace(/(<svg\b[^>]*)\s+width="[^"]*"/i, '$1')
  svg = svg.replace(/(<svg\b[^>]*)\s+height="[^"]*"/i, '$1')

  return svg
}

// ─── SVG Safety ───────────────────────────────────────────────────────────────

const UNSAFE_SVG_PATTERNS = [
  /<script[\s>]/i,
  /(?:^|\s)on\w+\s*=/im, // event handlers: onclick=, onload=, etc. (word-boundary prevents matching "standalone=", "version=", etc.)
  /javascript\s*:/i, // javascript: URIs
  /<use[^>]+href\s*=\s*["']https?:\/\//i, // external <use> references
  /<foreignobject[\s>]/i, // HTML injection via <foreignObject>
]

export type SvgValidationResult = { ok: true } | { ok: false; errors: string[] }

const SVG_MAX_BYTES = 512 * 1024 // 512 KB

// Strip on* event handler attributes — design tools (Illustrator, Figma) sometimes emit
// these in exported SVGs. They are never needed in static logos and are safe to remove.
export function sanitizeSvg(content: string): string {
  // Only strip attributes where "on*" is preceded by whitespace (i.e., actual event handler
  // attributes). This avoids clobbering legitimate strings like "standalone=" or "version=".
  return content.replace(/(\s+)on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '$1')
}

export function validateSvgSafety(content: string, sizeBytes?: number): SvgValidationResult {
  const errors: string[] = []

  if (sizeBytes !== undefined && sizeBytes > SVG_MAX_BYTES) {
    errors.push(`SVG exceeds maximum size of 512 KB (got ${Math.round(sizeBytes / 1024)} KB)`)
  }

  if (!content.trim().startsWith('<') || !/<svg[\s>]/i.test(content)) {
    errors.push('File does not appear to be a valid SVG document')
  }

  for (const pattern of UNSAFE_SVG_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`SVG contains disallowed content (matched: ${pattern.source})`)
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

// ─── Brand Asset Schemas ──────────────────────────────────────────────────────

export const BrandAssetTypeEnum = z.enum([
  'logo_svg',
  'logo_png',
  'brand_mark',
  'hero_image',
  'packaging',
  'identification_reference',
])

export const AssetReviewStatusEnum = z.enum(['uploaded', 'pending_review', 'approved', 'archived'])

export const BrandAssetMetaSchema = z.object({
  brand_id: z.string().uuid(),
  asset_type: BrandAssetTypeEnum,
  storage_path: z.string().min(1),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().positive().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  attribution: z.string().max(500).nullable().optional(),
  license: z.string().max(100).nullable().optional(),
  alt_text: z.string().max(300).nullable().optional(),
  review_status: AssetReviewStatusEnum.optional(),
  quality_score: z.number().int().min(1).max(10).nullable().optional(),
})

export type BrandAssetMeta = z.infer<typeof BrandAssetMetaSchema>

export const BrandAssetUpdateSchema = z.object({
  attribution: z.string().max(500).nullable().optional(),
  license: z.string().max(100).nullable().optional(),
  alt_text: z.string().max(300).nullable().optional(),
  review_status: AssetReviewStatusEnum.optional(),
  quality_score: z.number().int().min(1).max(10).nullable().optional(),
})

export type BrandAssetUpdate = z.infer<typeof BrandAssetUpdateSchema>

// ─── Brand Identity Schema ────────────────────────────────────────────────────

const cssColorRegex = /^(#[0-9a-fA-F]{3,8}|[a-z]+)$/

export const BrandIdentitySchema = z.object({
  primary_color: z
    .string()
    .regex(cssColorRegex, 'Must be a CSS hex color or named color')
    .nullable()
    .optional(),
  secondary_color: z
    .string()
    .regex(cssColorRegex, 'Must be a CSS hex color or named color')
    .nullable()
    .optional(),
})

export type BrandIdentity = z.infer<typeof BrandIdentitySchema>
