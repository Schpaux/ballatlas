# Image Workflow

Images in BallAtlas follow a strict lifecycle to ensure quality, legal compliance,
and AI training readiness. See ADR-010 for the full acquisition strategy.

---

## Lifecycle

```
Upload → Pending → Review → Approved (public) or Rejected
```

Only `review_status = 'approved'` images are visible publicly and via the API.
Rejected images are retained in the DB for audit but not served.

## Image Types

| Type        | Description                                      |
| ----------- | ------------------------------------------------ |
| `hero`      | Primary product photo — the canonical ball image |
| `side`      | Side angle showing logo and number clearly       |
| `logo`      | Close-up of logo marking                         |
| `alignment` | Alignment aid / arrow detail                     |
| `number`    | Number and font style                            |
| `dimple`    | Dimple pattern detail                            |
| `packaging` | Box, sleeve, or retail packaging                 |

## Quality Score (1–10)

| Score | Meaning                                            |
| ----- | -------------------------------------------------- |
| 9–10  | Professional photography, hi-res, clean background |
| 7–8   | Good product photo, adequate resolution            |
| 5–6   | Acceptable, minor issues                           |
| 1–4   | Poor quality, kept only if no better source exists |

AI training filters: `image_quality_score >= 7` AND `review_status = 'approved'`.

## License Values

| Value                   | Meaning                                     |
| ----------------------- | ------------------------------------------- |
| `ballatlas-original`    | BallAtlas-owned original photography        |
| `manufacturer-provided` | Provided by manufacturer with permission    |
| `cc-by-4.0`             | Creative Commons Attribution 4.0            |
| `cc-by-sa-4.0`          | Creative Commons Attribution-ShareAlike 4.0 |
| `cc0`                   | Public domain / CC0                         |
| `fair-use-reference`    | Editorial fair use for identification       |

Attribution text must be stored on `images.attribution` for any CC-licensed image.

## Admin Workflow

1. Navigate to `/admin/images`
2. Use **+ Add Image** to upload a file or register an external URL
3. Set image type, license, quality score, and attribution
4. New images land in **Pending** tab
5. Review: Approve (public) or Reject (retained but hidden)

## Storage

Uploaded files → Supabase Storage bucket `ball-images` (public read)

Path format: `{version-slug}/{image-type}-{timestamp}.{ext}`

Example: `titleist-pro-v1-2025/hero-1717789200000.jpg`

Original `source_url` is retained even after upload so provenance is never lost.
