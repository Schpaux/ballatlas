-- Migration: price_observations table
-- Time-series pricing data. Immutable — rows are never updated, only inserted.
-- This allows full price history reconstruction and trend analysis.
-- Prices are per dozen (12 balls), matching market convention.

CREATE TABLE price_observations (
  id          uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  uuid            NOT NULL REFERENCES ball_versions(id) ON DELETE RESTRICT,
  condition   price_condition NOT NULL,
  -- Market region for regional pricing (e.g. 'global', 'us', 'no', 'uk')
  market      text            NOT NULL DEFAULT 'global',
  currency    char(3)         NOT NULL DEFAULT 'USD',
  -- Price per dozen
  price       numeric(10, 2)  NOT NULL CHECK (price >= 0),
  observed_at timestamptz     NOT NULL DEFAULT now(),
  source_id   uuid            REFERENCES sources(id) ON DELETE SET NULL,
  created_at  timestamptz     NOT NULL DEFAULT now()
);

-- No UPDATE trigger — this table is append-only. Updates would corrupt history.

CREATE INDEX price_observations_version_id_idx  ON price_observations (version_id);
CREATE INDEX price_observations_condition_idx   ON price_observations (condition);
CREATE INDEX price_observations_observed_at_idx ON price_observations (observed_at DESC);
CREATE INDEX price_observations_market_idx      ON price_observations (market, currency);

COMMENT ON TABLE  price_observations             IS 'Append-only time-series price data. Never update rows — insert new observations.';
COMMENT ON COLUMN price_observations.price       IS 'Price per dozen (12 balls) in the specified currency.';
COMMENT ON COLUMN price_observations.market      IS 'Market region code. e.g. global, us, no, uk, de.';
COMMENT ON COLUMN price_observations.observed_at IS 'When this price was observed. Defaults to insertion time.';
