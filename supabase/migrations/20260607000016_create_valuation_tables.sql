-- Migration 016: Valuation foundation tables
-- Three-table structure for segment-based valuation logic:
--   valuation_profiles     → defines a valuation context (e.g. "mint-used-market")
--   condition_multipliers  → how physical condition scales base price
--   valuation_rules        → age/demand/availability adjustments per profile

create table valuation_profiles (
  id          uuid primary key default gen_random_uuid(),
  segment     text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index valuation_profiles_segment_key on valuation_profiles(lower(segment));

create trigger set_valuation_profiles_updated_at
  before update on valuation_profiles
  for each row execute function update_updated_at();


create table condition_multipliers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references valuation_profiles(id) on delete cascade,
  condition   text not null,   -- e.g. "mint", "near-mint", "good", "fair", "poor"
  multiplier  numeric(5, 3) not null check (multiplier >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index condition_multipliers_profile_condition_key
  on condition_multipliers(profile_id, lower(condition));

create trigger set_condition_multipliers_updated_at
  before update on condition_multipliers
  for each row execute function update_updated_at();


create table valuation_rules (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references valuation_profiles(id) on delete cascade,
  age_adjustment        numeric(5, 3) not null default 1.0
    check (age_adjustment >= 0),
  demand_adjustment     numeric(5, 3) not null default 1.0
    check (demand_adjustment >= 0),
  availability_adjustment numeric(5, 3) not null default 1.0
    check (availability_adjustment >= 0),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- One active rule set per profile
create unique index valuation_rules_profile_key on valuation_rules(profile_id);

create trigger set_valuation_rules_updated_at
  before update on valuation_rules
  for each row execute function update_updated_at();


-- RLS: public read, service-role write
alter table valuation_profiles enable row level security;
alter table condition_multipliers enable row level security;
alter table valuation_rules enable row level security;

create policy "Public read access for valuation_profiles"
  on valuation_profiles for select using (true);
create policy "Service role full access for valuation_profiles"
  on valuation_profiles for all using (auth.role() = 'service_role');

create policy "Public read access for condition_multipliers"
  on condition_multipliers for select using (true);
create policy "Service role full access for condition_multipliers"
  on condition_multipliers for all using (auth.role() = 'service_role');

create policy "Public read access for valuation_rules"
  on valuation_rules for select using (true);
create policy "Service role full access for valuation_rules"
  on valuation_rules for all using (auth.role() = 'service_role');
