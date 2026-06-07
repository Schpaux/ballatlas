// Acquisition readiness interfaces — Phase 4
//
// These interfaces define the contracts for future automated data acquisition.
// Phase 4 provides only the interfaces — no scrapers, crawlers, or collectors are built.
// Phase 6+ will implement these interfaces for specific data sources.
//
// See ADR-010 for the data acquisition strategy.

// ─── Shared ───────────────────────────────────────────────────────────────────

export type AcquisitionResult<T> =
  | { ok: true; data: T; source_id: string; fetched_at: string }
  | { ok: false; error: string; source_id: string }

export type SourceMetadata = {
  id: string
  name: string
  url: string | null
  reliability_score: number
}

// ─── PriceProvider ────────────────────────────────────────────────────────────

export type PricePoint = {
  version_slug: string
  condition: string
  price: number
  currency: string
  market: string
  observed_at: string
  notes?: string | null
}

export interface PriceProvider {
  readonly source: SourceMetadata

  /**
   * Fetch current prices for a specific ball version.
   * Returns an empty array if no pricing is available — never fabricates values.
   */
  fetchPrices(versionSlug: string): Promise<AcquisitionResult<PricePoint[]>>
}

// ─── ImageProvider ────────────────────────────────────────────────────────────

export type ImageCandidate = {
  version_slug: string
  image_type: string
  source_url: string
  license: string
  attribution?: string | null
  alt_text?: string | null
  width?: number | null
  height?: number | null
}

export interface ImageProvider {
  readonly source: SourceMetadata

  /**
   * Locate candidate images for a specific ball version.
   * Returns candidates only — upload and review remain manual.
   */
  findImages(versionSlug: string): Promise<AcquisitionResult<ImageCandidate[]>>
}

// ─── VersionProvider ──────────────────────────────────────────────────────────

export type VersionSpecData = {
  version_slug: string
  compression?: number | null
  cover_material?: string | null
  construction_layers?: number | null
  dimple_count?: number | null
  dimple_pattern?: string | null
  launch_profile?: string | null
  spin_profile?: string | null
  feel_profile?: string | null
  notes?: string | null
}

export interface VersionProvider {
  readonly source: SourceMetadata

  /**
   * Fetch technical specification data for a specific version.
   * Returns null fields for unknown specs rather than guessing.
   */
  fetchSpecs(versionSlug: string): Promise<AcquisitionResult<VersionSpecData>>
}

// ─── SourceProvider ───────────────────────────────────────────────────────────

export type SourceStatus = {
  id: string
  name: string
  is_reachable: boolean
  last_checked_at: string
  notes?: string | null
}

export interface SourceProvider {
  /**
   * Verify that a registered source is still reachable.
   * Used to detect stale or dead sources before attempting acquisition.
   */
  checkSource(sourceId: string): Promise<AcquisitionResult<SourceStatus>>

  /**
   * List all registered sources with their current active status.
   */
  listSources(): Promise<SourceMetadata[]>
}
