# BallAtlas Future Equipment Strategy

**Phase:** 6 — Platform Generalization & Asset Strategy  
**Date:** 2026-06-10  
**Status:** Research only — no implementation authorized

---

## Purpose

Evaluate what supporting each major golf equipment category would require,
so that when (if) BallAtlas expands beyond golf balls, the architectural
investment is informed rather than reactive.

No code is built from this document. See ADR-014 for the migration strategy.

---

## Evaluation Framework

For each category, the analysis covers:

- **Similarities** to golf balls — what reuses cleanly
- **Differences** — what requires new schema or logic
- **Required schema changes** — concrete additions to the data model
- **Valuation implications** — how the pricing model adapts
- **Identification implications** — what visual/spec signals support identification

---

## Golf Balls ✅ (Current)

The reference implementation. All other categories are evaluated relative to this.

---

## Drivers

### Similarities

- Brand → Family → Version hierarchy applies directly (TaylorMade → Qi10 → 2025)
- `brands` table: no changes
- `ball_families` / `ball_versions` core structure: reusable
- Images: hero, logo, packaging image types reusable
- Price observations + sources: fully reusable
- Valuation profile formula: applicable (age/demand/availability adjustments)
- FTS on name: works identically

### Differences

- Technical specs are completely different: loft, shaft flex, head volume (cc), COR,
  face material, adjustability, MOI, spin rate, launch angle
- Adjustable hosels create a model complexity — same head, different loft settings
  are not separate versions but configurations
- Shaft is a separate component (not part of the head version)
- Condition vocabulary: no `lake_ball`; instead `used`, `demo`, `display` are common
- Segments: `low-handicap`, `game-improvement`, `super-game-improvement`, `senior`
- Visual identification: hosel type, crown color/material, face shape, sole features —
  not applicable to ball identification pipeline
- Fitting data: swing speed, attack angle ranges — no ball equivalent

### Required schema changes

```sql
CREATE TABLE driver_specs (
  version_id     uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  loft           numeric,             -- degrees
  shaft_flex     text,               -- S, R, X, A, L
  head_volume_cc integer,            -- typically 440–460
  face_material  text,               -- titanium, carbon, maraging steel
  adjustable     boolean,
  offset         text,               -- none, slight, strong
  notes          text
);

-- New segment rows with domain discriminator (see ADR-014)
INSERT INTO segments (name, slug, domain) VALUES
  ('Low Handicap', 'low-handicap', 'driver'),
  ('Game Improvement', 'game-improvement', 'driver'),
  ('Super Game Improvement', 'super-gi', 'driver');
```

### Valuation implications

- Price range is dramatically higher ($200–$700 vs $20–$60 for balls)
- Age adjustment is more aggressive — drivers are replaced frequently
- Condition matters but `lake_ball` state doesn't apply
- Used market is large and well-established (eBay, GlobalGolf, 2ndSwing)

### Identification implications

- Less relevant to visual ID — buyers read model names directly
- Head shape and hosel style could support image-based ID in Phase 8
- Serial numbers are rarely on heads; identification via branding and face markings

---

## Fairway Woods

### Similarities

- Same hierarchy and infrastructure as drivers
- Similar spec profile (loft, shaft, head volume — though smaller)
- Same condition vocabulary and market channels

### Differences

- More loft options (3-wood through 9-wood, 7-19 degrees typical)
- Often part of a matched set with a driver — relationship modeling not currently supported
- Slightly different visual profile (shallower face, more loft)

### Required schema changes

Shared `driver_specs` table could accommodate fairway woods (add `wood_type` column),
or a separate `wood_specs` table with the same structure. The wood/driver distinction
is primarily semantic.

### Valuation implications

- Lower price range than drivers ($100–$400)
- Closely correlated to driver model popularity

### Identification implications

- Same as drivers — less critical for visual ID

---

## Hybrids

### Similarities

- Same hierarchy and infrastructure
- Similar to fairway woods but more compact

### Differences

- Often replace specific irons — "replacement iron number" is useful spec data
- Head shape is neither iron nor wood; unique visual profile

### Required schema changes

```sql
CREATE TABLE hybrid_specs (
  version_id          uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  loft                numeric,
  shaft_flex          text,
  replaces_iron       integer,        -- e.g. 4 = replaces 4-iron
  notes               text
);
```

---

## Irons

### Similarities

- Brand → Family → Version applies (Ping → G430 → 2023)
- Price observations and valuation reusable
- Images reusable

### Differences

- Irons are sold as **sets** (typically 4-iron through PW, sometimes 3i or AW)
- A "version" may be a set rather than an individual club
- Individual iron lofts vary within a set — per-club spec data would multiply rows
- Two approaches: model the set as the version (simpler), or model each iron number
- Forgiveness type is a key dimension: blades (muscleback), cavity back, game improvement
- Shaft material: steel vs graphite is a purchasing decision, not a fixed spec for irons

### Required schema changes

```sql
CREATE TABLE iron_specs (
  version_id     uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  set_composition text,             -- '4-PW', '4-GW', '5-SW'
  head_style      text,             -- blade, cavity_back, hollow_blade
  shaft_material  text,             -- steel, graphite, multi-material
  forgiveness     text,             -- blade, players, game_improvement, super_gi
  offset          text,             -- none, moderate, strong
  notes           text
);
```

### Valuation implications

- Set pricing vs individual club pricing — needs a `pricing_unit` field
  (`per_set`, `per_club`) on versions or price observations
- Much wider price range ($200–$2,500 per set)

### Identification implications

- Iron identification relies on cavity shape, sole width, and branding
- Very relevant for used market identification — iron sets are often sold individually

---

## Wedges

### Similarities

- Individual clubs, sold individually (unlike irons)
- Similar to irons but with more spec variation (bounce, grind, loft)
- Same condition vocabulary

### Differences

- `loft`, `bounce`, and `grind` are three required dimensions
- Loft is the primary identifier (50°, 52°, 54°, 56°, 58°, 60°, 64°)
- Face texture and groove pattern are spec and identification signals
- Shorter product cycles — wedges wear quickly, especially grooves

### Required schema changes

```sql
CREATE TABLE wedge_specs (
  version_id     uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  loft           numeric,          -- degrees
  bounce         numeric,          -- degrees
  grind          text,             -- S, M, F, T, etc.
  face_finish    text,             -- raw, tour chrome, black, brushed
  notes          text
);
```

### Valuation implications

- Moderate range ($100–$250 per wedge)
- Value degrades quickly as grooves wear — condition scoring is important

### Identification implications

- Logo/brand stamping, loft marking, and grind designation are visible ID signals
- High value for visual ID on the used market

---

## Putters

### Similarities

- Individual clubs
- Same hierarchy works
- High collector interest — older Scotty Cameron putters have premium valuation similar to rare golf balls

### Differences

- Head style is a primary classification: blade, mallet, face-balanced, center-shafted
- Neck/hosel type: plumber's neck, slant neck, double-bend, straight
- Face insert material is a feature (aluminum, polymer, milled steel)
- Length and lie are fit variables, not fixed specs
- Balance technology: face-balanced vs toe-hang

### Required schema changes

```sql
CREATE TABLE putter_specs (
  version_id      uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  head_style      text,            -- blade, mallet, face_balanced
  hosel_type      text,            -- plumbers_neck, slant_neck, double_bend, straight
  face_insert     text,            -- milled, aluminum, polymer, no_insert
  loft            numeric,         -- typically 2–4 degrees
  length_inches   numeric,         -- typically 32–36"
  notes           text
);
```

### Valuation implications

- Widest valuation range of any category ($30 – $5,000+)
- Vintage Scotty Cameron, Ping Anser, and limited editions have collector premiums
- Condition is critical — original grips, no headcover marks, original shaft
- Most similar to golf ball valuation complexity

### Identification implications

- Very relevant — putter collectors need to identify vintage models
- Neck type, sole shape, and face markings are primary visual ID signals
- Strong use case for image-based identification (future Phase 8)

---

## Golf Bags

### Similarities

- Brand → Family → Version hierarchy applies
- Images, pricing, sources fully reusable
- Valuation formula reusable

### Differences

- Specs are accessory-level: pocket count, strap type, material, weight, stand legs
- No technical performance specs — no launch angle or compression equivalent
- Condition is basic: excellent, good, fair — no `lake_ball` equivalent
- No identification complexity — bags are clearly labeled

### Required schema changes

```sql
CREATE TABLE bag_specs (
  version_id       uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  bag_type         text,            -- cart, stand, staff, Sunday, travel
  pocket_count     integer,
  strap_type       text,            -- single, dual, cart_only
  material         text,            -- nylon, polyester, leather, synthetic
  weight_kg        numeric,
  stand_legs       boolean,
  waterproof       boolean,
  notes            text
);
```

### Valuation implications

- Straightforward: retail price decays with age and condition
- No significant collector value (exception: vintage caddie bags)
- Simple age/condition multiplier model is sufficient

### Identification implications

- Not applicable — bags are labeled and easily identified visually

---

## Rangefinders

### Similarities

- Brand → Family → Version applies
- Technology improves year-over-year within a family (same as ball versions)
- Pricing and sources reusable

### Differences

- Electronic product with firmware/software versioning — a new dimension
- Key specs: range (yards), accuracy (±yards), magnification, slope functionality
- Two primary types: laser and GPS — fundamentally different specs
- Battery life, display type, and certification status (slope legal for competition) matter

### Required schema changes

```sql
CREATE TABLE rangefinder_specs (
  version_id          uuid UNIQUE REFERENCES ball_versions(id) ON DELETE CASCADE,
  type                text,            -- laser, gps
  max_range_yards     integer,
  accuracy_yards      numeric,
  magnification       numeric,
  has_slope           boolean,
  slope_toggle        boolean,         -- can slope be disabled for tournament play
  battery_type        text,
  waterproof_rating   text,            -- IPX rating
  notes               text
);
```

### Valuation implications

- Technology depreciates quickly — newer models significantly discount older
- Age adjustment factor needs to be steeper than golf balls
- Condition less critical than functionality (electronics)

### Identification implications

- Not particularly relevant — serial numbers and labels are sufficient

---

## Effort Summary

| Category      | Schema effort             | Valuation effort | ID effort | Priority                                  |
| ------------- | ------------------------- | ---------------- | --------- | ----------------------------------------- |
| Drivers       | Medium                    | Low              | Low       | High (large market)                       |
| Fairway Woods | Low (shares with drivers) | Low              | Low       | Medium                                    |
| Hybrids       | Low                       | Low              | Low       | Medium                                    |
| Irons         | Medium (set complexity)   | Medium           | Medium    | High (large market)                       |
| Wedges        | Low                       | Low              | Medium    | High (collector market)                   |
| Putters       | Low                       | Medium           | High      | High (collector market, similar to balls) |
| Golf Bags     | Low                       | Low              | None      | Low                                       |
| Rangefinders  | Low                       | Low              | None      | Low                                       |

---

## Recommendation

If BallAtlas were to expand to one additional category, **putters** offer the most
natural extension:

1. Individual clubs (not sets) — same data model as balls
2. Strong collector market with similar valuation complexity to balls
3. Visual identification value — similar to balls' ID phase
4. Premium segment with engaged, data-curious buyers
5. Tech specs are simple — easier to implement than drivers or irons

**Drivers and irons** would serve the largest market but introduce the most
architectural complexity (shaft/set modeling).

---

_See also: ADR-014 (Product Domain Generalization), docs/platform/generalization-review.md_
