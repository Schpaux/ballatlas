# Discovery Layer

Phase 5 discovery features: brand explorer, family explorer, and browse paths.

---

## Routes

| Route            | Component type         | Purpose                                                         |
| ---------------- | ---------------------- | --------------------------------------------------------------- |
| `/brands`        | Server Component       | All brands with version counts                                  |
| `/brands/[slug]` | Server Component       | Brand detail — families, segment distribution, version timeline |
| `/compare`       | Server + Client hybrid | Side-by-side ball comparison                                    |

---

## Brand Explorer

### Data strategy

`/brands` uses **3 queries + JS aggregation** (brands, families, versions) rather than N+1 per-brand queries. At ~30 brands this is efficient and avoids complex SQL aggregates through the Supabase JS client.

### Segment distribution

The brand detail page computes segment distribution client-side from the nested version data. It shows the top 4 segments by version count as `SegmentBadge` pills in the header — a fast summary of what the brand sells.

### Family grouping

Families are split into two sections on the brand detail page:

- **Current Lines** — `status = 'published'` families with at least one version
- **Discontinued Lines** — `status = 'discontinued' | 'archived'` families with at least one version

Families with no published/discontinued versions (e.g. draft-only) are omitted from the public page.

### Version links in FamilyCard

Each `FamilyCard` shows up to 6 version buttons (by `release_year`). If a family has more, a "See all" link goes to `/search?q={family}&brand={brandSlug}`.

---

## Navigation

The `SiteHeader` now includes Browse → Brands → Compare → Admin in that order. Browse and Brands are the primary discovery paths; Compare is secondary.

---

## SEO

- `/brands` — indexed, `changeFrequency: 'weekly'`
- `/brands/[slug]` — indexed, `changeFrequency: 'monthly'`
- `/compare` — `robots: { index: false }` (dynamic content, no canonical URL)
