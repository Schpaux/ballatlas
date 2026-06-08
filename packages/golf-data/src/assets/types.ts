// Asset abstraction layer — Phase 6
//
// Framework-free interfaces for the BallAtlas asset system.
// Phase 6 defines interfaces only. Implementations live in Phase 7+.
// See ADR-013 for the strategic rationale.

// ─── Enums ────────────────────────────────────────────────────────────────────

export type BrandAssetType =
  | 'logo_svg'
  | 'logo_png'
  | 'brand_mark'
  | 'hero_image'
  | 'packaging'
  | 'identification_reference'

export type AssetReviewStatus = 'uploaded' | 'pending_review' | 'approved' | 'archived'

// ─── AssetMetadata ────────────────────────────────────────────────────────────

/** Canonical metadata shape shared across all asset categories. */
export type AssetMetadata = {
  id: string
  asset_type: BrandAssetType
  storage_path: string
  mime_type: string
  file_size_bytes: number | null
  source_url: string | null
  attribution: string | null
  license: string | null
  alt_text: string | null
  review_status: AssetReviewStatus
  quality_score: number | null
  uploaded_at: string
  reviewed_at: string | null
}

// ─── AssetReference ───────────────────────────────────────────────────────────

/**
 * Lightweight pointer for rendering — only what a display component needs.
 * Prefer this over passing full AssetMetadata to components.
 */
export type AssetReference = {
  id: string
  url: string
  asset_type: BrandAssetType
  mime_type: string
  alt_text: string | null
}

// ─── AssetValidationResult ────────────────────────────────────────────────────

export type AssetValidationResult = { ok: true } | { ok: false; errors: string[] }

// ─── AssetProvider ────────────────────────────────────────────────────────────

/**
 * Interface for future automated asset acquisition.
 * Follows the same pattern as ImageProvider / PriceProvider in the acquisition layer.
 * Phase 6 defines the interface only — no implementations.
 */
export interface AssetProvider {
  /**
   * Locate candidate brand assets from an external source.
   * Returns candidates only — upload and review remain manual.
   */
  findBrandAssets(brandSlug: string): Promise<AssetAcquisitionResult<AssetCandidate[]>>
}

// ─── AssetCandidate ───────────────────────────────────────────────────────────

export type AssetCandidate = {
  brand_slug: string
  asset_type: BrandAssetType
  source_url: string
  mime_type: string
  license: string | null
  attribution: string | null
  alt_text: string | null
  file_size_bytes: number | null
}

// ─── AssetAcquisitionResult ───────────────────────────────────────────────────

export type AssetAcquisitionResult<T> =
  | { ok: true; data: T; source_id: string; fetched_at: string }
  | { ok: false; error: string; source_id: string }
