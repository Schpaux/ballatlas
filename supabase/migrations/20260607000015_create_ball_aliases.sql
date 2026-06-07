-- Migration 015: Ball aliases table
-- Stores common names, abbreviations, and user-facing strings that map to a
-- canonical ball version. Enables fuzzy lookup and search normalization.

create type alias_type_enum as enum (
  'common_name',    -- "Pro V1" (official short name)
  'abbreviation',   -- "ProV1", "PV1"
  'misspelling',    -- "Pro V 1", "Prov1"
  'regional_name',  -- market-specific names
  'generation_tag'  -- "2023 Pro V1", "Pro V1 gen 4"
);

create table ball_aliases (
  id          uuid primary key default gen_random_uuid(),
  version_id  uuid not null references ball_versions(id) on delete cascade,
  alias       text not null,
  alias_type  alias_type_enum not null default 'common_name',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Unique alias text per version (same alias can map to different versions)
create unique index ball_aliases_version_alias_key on ball_aliases(version_id, lower(alias));

-- Fast lookup by alias text
create index ball_aliases_alias_lower_idx on ball_aliases(lower(alias));

-- Trigger to keep updated_at current
create trigger set_ball_aliases_updated_at
  before update on ball_aliases
  for each row execute function update_updated_at();

-- RLS
alter table ball_aliases enable row level security;

create policy "Public read access for ball_aliases"
  on ball_aliases for select
  using (true);

create policy "Service role full access for ball_aliases"
  on ball_aliases for all
  using (auth.role() = 'service_role');
