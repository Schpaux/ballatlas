# ADR-010: Data Acquisition Strategy

**Status:** Accepted
**Date:** 2026-06-07

---

## Context

BallAtlas's competitive advantage is not its UI. It is the quality, completeness, and
trustworthiness of its data. Without a documented acquisition strategy, contributors
make ad-hoc decisions about which data to collect, from where, and how to attribute it.
This creates legal exposure, quality inconsistency, and data that is difficult to trust
or improve over time.

This ADR defines how BallAtlas acquires, validates, stores, and maintains four data
categories: images, market pricing, specifications, and sources.

---

## Decision

### Core principle

**Missing values are acceptable. Fabricated values are not.**

Every data point must be traceable to a source. Every source must have a known
reliability score. Values without a source are marked as unverified and excluded
from high-confidence outputs.

---

### Images

#### Acquisition methods (in priority order)

1. **Original photography** — BallAtlas-owned photos taken by the team. Full rights.
   No attribution required. License: `ballatlas-original`.

2. **Manufacturer-provided** — Images from manufacturer press kits, product pages, or
   direct arrangement. License must be confirmed. Attribution: manufacturer name.

3. **Creative Commons / open license** — Images from openly licensed sources.
   License type, source URL, and attribution text must be stored on the `images` row.

4. **Fair use reference** — Product images used for identification reference under
   editorial fair use. Stored with `license = 'fair-use-reference'` and full source URL.
   Not redistributed via API without review.

#### What is NOT acceptable

- Images scraped without permission or in violation of a site's ToS
- Images with no traceable source or license
- AI-generated images presented as product photos
- Watermarked or marked "do not reproduce" images

#### Image quality standards

- Minimum dimensions: 400 × 400 px
- Preferred: 800 × 800 px or larger
- `image_quality_score` (1–10) records editorial judgment
  - 9–10: Professional photography, high resolution, clean background
  - 7–8: Good product photo, adequate resolution
  - 5–6: Acceptable but not ideal (low resolution, angle issues)
  - 1–4: Poor quality, kept only if no better source exists
- Only `review_status = 'approved'` images appear publicly
- AI model training uses `image_quality_score >= 7` as the minimum threshold

#### Storage

Approved images are stored in Supabase Storage `ball-images` bucket (public read).
Original source URL is retained on the `images.source_url` column even after upload
to Storage. License metadata lives on the `images.license` column.

---

### Market Pricing

#### Supported market types

| Type        | Examples                                    | Notes                             |
| ----------- | ------------------------------------------- | --------------------------------- |
| retail      | Titleist.com, Golf Galaxy, Rock Bottom Golf | New balls, manufacturer price     |
| used        | LostGolfBalls.com, FoundGolfBalls.com       | Graded used balls                 |
| recycled    | Lake ball refurbishers                      | Professionally cleaned/refinished |
| auction     | eBay sold listings                          | Actual transaction prices         |
| marketplace | Facebook Marketplace, Finn.no, golf forums  | Peer-to-peer                      |

#### Price observation rules

- Every observation must reference a `source_id` from the `sources` table
- Every observation must record `observed_at` (when the price was seen)
- `market` field records the geographic region (global, us, no, uk, de, etc.)
- Price observations are **append-only** — never update historical rows, insert new ones
- Archived observations (`is_archived = true`) are excluded from valuation computation
  but retained for historical analysis

#### What makes a price observation valid

- Source is known and traceable (source_id not null)
- Condition is specified (not null)
- Price is non-negative
- Currency is ISO 4217 code (USD, NOK, GBP, EUR, etc.)
- Market region is specified

#### What is NOT acceptable

- Prices fabricated without a real source
- "Estimated" prices presented as observed prices (use valuation engine for estimates)
- Single observations treated as definitive market price (use median/range from multiple)

---

### Technical Specifications

#### Acquisition hierarchy

1. **Manufacturer specifications** — primary source for compression, cover material,
   construction layers, dimple count/pattern. Manufacturer reliability score: 9.
   Source: product page or press kit. Citation required.

2. **Independent lab testing** — MyGolfSpy, Golf Digest lab results. Score 7–8.
   Cross-reference against manufacturer specs; flag discrepancies.

3. **Community / review sites** — lower reliability (5–6). Use only when no
   manufacturer or lab source exists. Always mark as unverified.

#### Spec gaps

Specs without a source are stored as `null`, not zero or estimated values.
Admin data-quality dashboard surfaces versions with missing specs for enrichment.

---

### Sources

#### Source categories (source_type enum)

| Type         | Examples                       | Score range |
| ------------ | ------------------------------ | ----------- |
| manufacturer | Titleist.com, Callaway Golf    | 9–10        |
| retailer     | LostGolfBalls.com, Rock Bottom | 7–9         |
| review       | MyGolfSpy, Golf Digest         | 7–8         |
| community    | Golf forums, Reddit            | 4–6         |
| auction      | eBay sold listings             | 7–8         |

#### Source registration

Before a price observation or spec can be attributed to a source, that source must
exist in the `sources` table with a name, URL, type, and reliability score.

New sources are added via the admin interface at `/admin/sources` (Phase 4).
Sources cannot be deleted if price observations or specs reference them — they are
archived instead.

#### Reliability scoring guide

- 10: Official manufacturer API or confirmed direct relationship
- 9: Manufacturer public product page (verifiable, authoritative)
- 8: Major independent retailer with verified grading process
- 7: Independent reviewer with documented methodology
- 5–6: Community content with mixed quality
- 3–4: Anonymous or aggregator sources
- 1–2: Unverifiable or known inaccurate sources (rarely used; mark as legacy)

---

### Automation

#### Current approach (Phase 4)

All data entry is manual:

- Specs: edited via admin version edit forms
- Prices: added via `/admin/prices` observation entry form
- Images: uploaded via `/admin/images` upload workflow
- Sources: registered via admin source management

#### Future automation (Phase 6+)

The acquisition readiness layer (`packages/golf-data/src/acquisition/`) defines
provider interfaces that future automation will implement:

- `PriceProvider` — fetches price data from a source
- `ImageProvider` — fetches images from a source
- `VersionProvider` — fetches spec data for a version
- `SourceProvider` — manages source metadata

These interfaces decouple consumers from specific data sources. When scraping or
API integrations are built, they implement these interfaces. Existing code that
consumes price/image data does not change.

**Phase 4 builds the interfaces only. No scrapers. No crawlers. No collectors.**

---

### Data Quality

#### Confidence scoring

Every valuation output includes a `confidence` field (0.0–1.0):

- 1.0: Multiple recent observations from high-reliability sources
- 0.7–0.9: Sufficient observations but older or fewer sources
- 0.4–0.6: Limited observations or lower-reliability sources
- 0.1–0.3: Extrapolated from segment defaults, few/no observations
- 0.0: No data — valuation not possible

Confidence is computed by the Valuation Engine. It is never fabricated.

#### Verification process

Data follows this lifecycle:

1. **Entry** — manually entered or imported (status: unverified)
2. **Review** — admin reviews sourcing and quality
3. **Approved** — data included in public outputs and valuation engine
4. **Archived** — superseded by newer data but retained for history

Image review uses explicit `review_status` (`pending / approved / rejected`).
Price observations use `is_archived` for retirement. Specs do not have an explicit
review status (all admin-entered specs are considered reviewed at entry).

---

### Legal Considerations

#### Copyright

- Do not copy manufacturer spec data verbatim in large blocks — paraphrase or cite
- Image rights must be documented on the `images.license` column before approval
- Fair use applies to product identification purposes; does not extend to commercial
  redistribution of manufacturer assets

#### Terms of Service

- Never scrape sites that prohibit crawling in their ToS
- Respect `robots.txt` in any future automated collection
- eBay sold-listing data is public but scraping at scale violates their ToS — use their
  API when the time comes (Phase 6)
- LostGolfBalls.com, Finn.no: check current ToS before building any automated collection

#### Attribution

- Store attribution text on `images.attribution` for any Creative Commons image
- Citation source URL on `sources.url` for all spec and pricing data
- Display source attribution in the public UI for any data point visible to users

---

## Consequences

### Positive

- Every data point is traceable — data quality is auditable, not assumed
- Missing values are explicit — valuation engine produces honest uncertainty
- Legal exposure is minimized by documented image licensing and source attribution
- Confidence scoring enables consumers to make informed decisions about data quality
- Provider interfaces make future automation non-breaking changes

### Negative

- Manual data entry is slow — building the dataset requires sustained editorial effort
- Source registration adds overhead to adding new price observations
- `image_quality_score` and `review_status` require editorial judgment that cannot
  be automated away
- Fair-use image strategy carries residual legal risk — original photography is always
  preferable

---

## References

- ADR-002: Backend Strategy — Supabase (storage buckets)
- ADR-004: Database Schema — Brand/Family/Version hierarchy
- ADR-008: Valuation Foundation (three-table structure, formula)
- `packages/golf-data/src/valuation/` — Valuation Engine v1
- `packages/golf-data/src/acquisition/` — Acquisition readiness interfaces
- `supabase/migrations/` — images, sources, price_observations schema
