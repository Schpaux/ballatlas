-- Phase 5: Community feedback foundation
-- Lightweight anonymous feedback collection — no auth required.
-- Submissions are insert-only for the public; admin reads via service role.

CREATE TYPE feedback_type AS ENUM (
  'incorrect_info',
  'suggest_correction',
  'request_ball',
  'missing_specs'
);

CREATE TABLE feedback_submissions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid        REFERENCES ball_versions(id) ON DELETE SET NULL,
  type       feedback_type NOT NULL,
  message    text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  email      text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public may insert; nobody may read publicly (admin uses service role)
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback_submissions
  FOR INSERT
  WITH CHECK (true);

-- Index for admin listing by type and recency
CREATE INDEX idx_feedback_submissions_type       ON feedback_submissions (type);
CREATE INDEX idx_feedback_submissions_created_at ON feedback_submissions (created_at DESC);
CREATE INDEX idx_feedback_submissions_version_id ON feedback_submissions (version_id) WHERE version_id IS NOT NULL;
