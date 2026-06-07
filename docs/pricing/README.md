# Pricing Workflow

Price observations are the raw market data that power BallAtlas valuations.
The table is append-only — observations are archived, never deleted.

---

## Principles

- **Every observation needs a source.** No anonymous pricing.
- **Prices are per dozen** (12 balls), matching market convention.
- **Archive, don't delete.** Archived observations are excluded from
  valuation computation but kept for historical analysis.
- **Missing values are acceptable. Fabricated values are not.**

## Market Types

| Type          | Examples                                     |
| ------------- | -------------------------------------------- |
| `retail`      | Titleist.com, Golf Galaxy, manufacturer MSRP |
| `used`        | LostGolfBalls.com, FoundGolfBalls.com        |
| `recycled`    | Lake ball refurbishers, refinished balls     |
| `auction`     | eBay sold listings                           |
| `marketplace` | Facebook Marketplace, Finn.no, golf forums   |

Market type is recorded on the **source** (the `sources.market_type` column), not
on the observation itself. Choose the source that matches where the price was seen.

## Conditions

| Condition   | Label               | Notes                          |
| ----------- | ------------------- | ------------------------------ |
| `new`       | New                 | Sealed box, never played       |
| `mint`      | Mint                | Played 1 round max, no marks   |
| `near_mint` | Near Mint           | Light play marks               |
| `good`      | Good                | Visible play marks, still good |
| `fair`      | Fair                | Heavy marks, scuffs            |
| `recycled`  | Recycled/Refinished | Professionally refinished      |
| `lake_ball` | Lake Ball           | Recovered, ungraded            |

## Market Regions

| Code     | Market              |
| -------- | ------------------- |
| `global` | Default / worldwide |
| `us`     | United States       |
| `no`     | Norway              |
| `uk`     | United Kingdom      |
| `de`     | Germany             |
| `au`     | Australia           |

## Admin Workflow

1. Navigate to `/admin/prices`
2. Use **+ Add Price Observation** to enter a new price
3. Select version, condition, price, currency, market, and source
4. Optionally add notes (e.g. "holiday sale", "3-for-2 deal")
5. To retire an observation: **Archive** (it moves to the Archived tab)

## What Happens Without Price Data

The Valuation Engine returns `confidence = 0` when no active observations exist
for a version. The public ValuationCard shows an explicit "No data yet" state.
This is correct behavior — we never fabricate values.

## Source Registration

Before adding an observation, the source must exist in the `sources` table.
Sources are added via the admin. Required fields:

- Name (unique)
- URL
- Source type (manufacturer / retailer / review / community / auction)
- Market type (retail / used / recycled / auction / marketplace / reference)
- Reliability score (1–10)
