# Internal API Reference

> Route handlers in `apps/web/app/api/`.  
> These are internal Next.js Route Handlers — not the Phase 6 public API.

All responses follow the shape:

```json
{ "data": T | null, "meta": { ... }, "error": string | null }
```

---

## GET /api/brands

Returns all brands with optional text search.

**Query params:**
| Param | Type | Default | Description |
|----------|--------|---------|-------------------------------|
| q | string | — | Full-text search query |
| page | int | 1 | |
| pageSize | int | 20 | Max 100 |

**Response:**

```json
{
  "data": [{ "id": "...", "name": "Titleist", "slug": "titleist", ... }],
  "meta": { "total": 20, "page": 1, "pageSize": 20 },
  "error": null
}
```

---

## GET /api/families

Returns ball families with optional filters.

**Query params:**
| Param | Type | Default | Description |
|----------|--------|---------|--------------------------------|
| q | string | — | Full-text search |
| brand_id | uuid | — | Filter by brand |
| status | enum | pub+disc| published/discontinued/etc. |
| page | int | 1 | |
| pageSize | int | 20 | |

Includes nested `brand` object.

---

## GET /api/balls

Returns ball versions with filters. Primary listing endpoint.

**Query params:**
| Param | Type | Notes |
|-----------------|--------|----------------------------------|
| q | string | Full-text search |
| family_id | uuid | Filter by family |
| brand_id | uuid | Filter via family join |
| segment | string | Segment slug |
| release_year | int | |
| cover | string | ILIKE filter on cover_material |
| compression_min | int | Minimum compression rating |
| compression_max | int | Maximum compression rating |
| status | enum | Default: published+discontinued |
| page | int | Default: 1 |
| pageSize | int | Default: 20, max 100 |

Response includes nested `family`, `brand`, `specs` (partial), and `version_segments`.

---

## GET /api/balls/[id]

Full ball version detail. `id` can be a UUID or slug.

Returns all related entities: family + brand, technical_specs, visual_signatures,
identification_features, images, version_segments + segments, price_observations + source.

**Status 404** if not found or not published/discontinued.

---

## GET /api/search

Cross-entity text search against ball version names.

**Query params:**
| Param | Type | Required | Notes |
|----------|--------|----------|-----------------|
| q | string | Yes | Min 1 char |
| page | int | — | Default: 1 |
| pageSize | int | — | Default: 10, max 50 |

Response includes `meta.query` with the original search string.

---

## Error Codes

| Status | Meaning                  |
| ------ | ------------------------ |
| 400    | Invalid query parameters |
| 404    | Resource not found       |
| 500    | Database or server error |
