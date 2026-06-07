-- Migration: sources table
-- Reference table for data provenance. Every data point should eventually
-- be traceable to a source. reliability_score reflects editorial judgment.

CREATE TABLE sources (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL UNIQUE,
  url               text,
  source_type       source_type NOT NULL,
  reliability_score int         NOT NULL DEFAULT 7 CHECK (reliability_score BETWEEN 1 AND 10),
  license_notes     text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  sources                   IS 'Data provenance registry. Used to trace spec and price data.';
COMMENT ON COLUMN sources.reliability_score IS '1–10 editorial score. 9–10 = manufacturer. 7–8 = reputable review. 5–6 = community.';

-- Seed known data sources from research report
INSERT INTO sources (name, url, source_type, reliability_score, license_notes) VALUES
  ('Titleist.com',     'https://www.titleist.com',      'manufacturer', 9, 'Marketing/spec pages. No API. Reference with citation.'),
  ('Callaway Golf',    'https://www.callawaygolf.com',   'manufacturer', 9, 'Marketing/spec pages. No API.'),
  ('TaylorMade Golf',  'https://www.taylormadegolf.com', 'manufacturer', 9, 'Marketing/spec pages. No API.'),
  ('Srixon',           'https://www.srixon.com',         'manufacturer', 9, 'Marketing/spec pages. No API.'),
  ('Bridgestone Golf', 'https://www.bridgestonegolf.com','manufacturer', 9, 'Marketing/spec pages. No API.'),
  ('MyGolfSpy',        'https://mygolfspy.com',          'review',       8, 'Independent ball lab testing. No API. Reference with citation.'),
  ('BreakfastBalls',   'https://breakfastballs.golf',    'review',       7, 'Independent golf blog with detailed historical spec data.'),
  ('LostGolfBalls',    'https://www.lostgolfballs.com',  'retailer',     8, 'Used ball retailer. Good brukt-pris reference data.');
