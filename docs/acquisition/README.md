# Acquisition Readiness Layer

The acquisition readiness layer defines the interfaces that future automation will
implement to acquire data from external sources.

**Phase 4 builds interfaces only. No scrapers. No crawlers. No collectors.**

Location: `packages/golf-data/src/acquisition/`

---

## Purpose

BallAtlas data is currently entered manually. When Phase 6+ introduces automation,
all consumers of price, image, and spec data will not need to change — they consume
the provider interfaces, not specific implementations.

This is the seam between "manual today" and "automated tomorrow."

## Interfaces

### `PriceProvider`

Fetches current prices for a specific ball version from one source.

```ts
interface PriceProvider {
  source: SourceMetadata
  fetchPrices(versionSlug: string): Promise<AcquisitionResult<PricePoint[]>>
}
```

Future implementations: eBay API, LostGolfBalls scraper, Finn.no API.

### `ImageProvider`

Locates candidate images for a version. Returns candidates only — upload
and review remain manual editorial steps.

```ts
interface ImageProvider {
  source: SourceMetadata
  findImages(versionSlug: string): Promise<AcquisitionResult<ImageCandidate[]>>
}
```

Future implementations: manufacturer press kit crawlers, Wikimedia Commons search.

### `VersionProvider`

Fetches technical specification data for a version.

```ts
interface VersionProvider {
  source: SourceMetadata
  fetchSpecs(versionSlug: string): Promise<AcquisitionResult<VersionSpecData>>
}
```

Future implementations: manufacturer website parsers, MyGolfSpy lab data.

### `SourceProvider`

Manages source health and metadata — checks reachability, lists active sources.

```ts
interface SourceProvider {
  checkSource(sourceId: string): Promise<AcquisitionResult<SourceStatus>>
  listSources(): Promise<SourceMetadata[]>
}
```

## `AcquisitionResult<T>`

All provider methods return a discriminated union:

```ts
type AcquisitionResult<T> =
  | { ok: true; data: T; source_id: string; fetched_at: string }
  | { ok: false; error: string; source_id: string }
```

Consumers check `result.ok` before using `result.data`. This ensures that
acquisition errors are always explicit — they cannot be silently ignored.

## When to Implement Providers

1. A specific data source is authorized (ToS checked, legal reviewed)
2. The source has a stable API or well-understood HTML structure
3. Manual acquisition of that data is a documented bottleneck
4. A maintainer is committed to keeping the implementation current

Do NOT implement providers for sources that prohibit scraping in their ToS.
Check `docs/acquisition/sources.md` (future) before building any implementation.

## Legal Reminders

- Verify ToS before any automated collection
- Store provenance on every acquired record (`source_id`)
- Image licenses must be documented before the image can be approved
- eBay sold listing data is public but API access requires terms agreement
