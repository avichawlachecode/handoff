-- Handoff — initial schema (PRD §7).
--
-- Row-level security model:
--   * Authenticated users can read/write only their own rows.
--   * Deals flagged is_demo (and their add_backs / results / assumptions) are
--     readable by EVERYONE, including anonymous guests — the demo deal must work
--     without a login (PRD §5 "Continue as guest / Try the demo deal").
--   * Anyone (guest or authed) can join the waitlist (leads) and emit analytics
--     events. Reading leads/events is not granted to normal users; the admin
--     view (Task 10) reads them via the service role or a hard-coded-email policy.
--
-- Demo deals are seeded via the service role, which bypasses RLS.

create extension if not exists pgcrypto;

-- ===========================================================================
-- Tables
-- ===========================================================================

-- profiles: one row per authenticated user (id == auth.users.id).
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  stage          text check (stage in ('exploring', 'searching', 'under_loi')),
  industries     text[] not null default '{}',
  max_drive_time integer,
  target_sde_min numeric,
  target_sde_max numeric,
  max_price      numeric,
  liquid_cash    numeric,
  pg_comfort     text check (pg_comfort in ('yes', 'nervous', 'discuss_spouse')),
  created_at     timestamptz not null default now()
);

-- deals: user_id is nullable so a global demo deal can belong to no one.
create table if not exists public.deals (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references auth.users (id) on delete cascade,
  business_name            text not null,
  industry                 text,
  location                 text,
  asking_price             numeric,
  revenue_ttm              numeric,
  years_in_business        integer,
  reason_for_sale          text check (reason_for_sale in (
                             'retiring', 'health', 'relocating',
                             'other venture', 'declining', 'undisclosed')),
  reported_net_income      numeric,
  owner_comp               numeric,
  interest_expense         numeric,
  depreciation_amort       numeric,
  -- NOTE: beyond §7's literal column list. A one-off non-recurring adjustment
  -- (e.g. new-construction job margin) excluded from run-rate earnings. It is
  -- NOT an add-back; it is subtracted after the disallowed add-backs (PRD §9,
  -- and the Task 2 calc model). Without it the demo deal normalizes to 572,000
  -- instead of 455,000. Defaults to 0 so ordinary user deals are unaffected.
  non_recurring_adjustment numeric not null default 0,
  top_customer_pct         numeric,
  top5_customer_pct        numeric,
  claimed_contracts        integer,
  verified_contracts       integer,
  largest_yoy_change_pct   numeric,
  is_demo                  boolean not null default false,
  created_at               timestamptz not null default now()
);

create index if not exists deals_user_id_idx on public.deals (user_id);
create index if not exists deals_is_demo_idx on public.deals (is_demo) where is_demo;

-- add_backs: repeating rows per deal (PRD §6.3 Card C / §6.5 ledger).
create table if not exists public.add_backs (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  description text not null,
  amount      numeric not null default 0,
  category    text check (category in (
                'Personal expense', 'One-time event', 'Non-operating',
                'Owner perk', 'Growth investment', 'Other')),
  verdict     text check (verdict in ('Allowed', 'Disallowed')),
  rationale   text
);

create index if not exists add_backs_deal_id_idx on public.add_backs (deal_id);

-- deal_results: one computed result set per deal.
create table if not exists public.deal_results (
  id                 uuid primary key default gen_random_uuid(),
  deal_id            uuid not null unique references public.deals (id) on delete cascade,
  claimed_sde        numeric,
  normalized_sde     numeric,
  screener_verdict   text check (screener_verdict in ('GREEN', 'AMBER', 'RED')),
  red_flags          jsonb not null default '[]'::jsonb,
  dscr_max_price     numeric,
  multiple_max_price numeric,
  pencil_price       numeric,
  gut_check_verdict  text check (gut_check_verdict in (
                       'KILL', 'PROCEED WITH CONDITIONS', 'GREENLIGHT')),
  computed_at        timestamptz not null default now()
);

-- assumptions: one set of pencil-check inputs per deal (PRD §6.6 defaults).
create table if not exists public.assumptions (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null unique references public.deals (id) on delete cascade,
  interest_rate numeric  not null default 0.11,
  term_years    integer  not null default 10,
  buyer_salary  numeric  not null default 120000,
  annual_capex  numeric  not null default 45000,
  required_dscr numeric  not null default 1.25,
  max_multiple  numeric  not null default 3.0
);

-- leads: waitlist / email capture (PRD §6.1).
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text,
  created_at timestamptz not null default now()
);

-- events: lightweight analytics (PRD §12 Task 10). user_id null for guests.
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  session_id text,
  user_id    uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_event_name_idx on public.events (event_name);

-- ===========================================================================
-- Visibility helpers (security definer so they read `deals` without recursing
-- through its own RLS; search_path pinned for safety).
-- ===========================================================================

create or replace function public.deal_is_visible(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.deals d
    where d.id = p_deal_id
      and (d.is_demo or d.user_id = auth.uid())
  );
$$;

create or replace function public.deal_is_owned(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.deals d
    where d.id = p_deal_id and d.user_id = auth.uid()
  );
$$;

-- ===========================================================================
-- Row-level security
-- ===========================================================================

alter table public.profiles     enable row level security;
alter table public.deals        enable row level security;
alter table public.add_backs    enable row level security;
alter table public.deal_results enable row level security;
alter table public.assumptions  enable row level security;
alter table public.leads        enable row level security;
alter table public.events       enable row level security;

grant usage on schema public to anon, authenticated;

-- Base privileges (RLS is the actual row filter).
grant select, insert, update, delete on public.profiles     to authenticated;
grant select, insert, update, delete on public.deals         to authenticated;
grant select, insert, update, delete on public.add_backs     to authenticated;
grant select, insert, update, delete on public.deal_results  to authenticated;
grant select, insert, update, delete on public.assumptions   to authenticated;
grant select, insert                 on public.events        to authenticated;
grant insert                         on public.leads         to authenticated;

-- Guests can read demo data and can sign up / emit events.
grant select on public.deals        to anon;
grant select on public.add_backs    to anon;
grant select on public.deal_results to anon;
grant select on public.assumptions  to anon;
grant insert on public.leads        to anon;
grant insert on public.events       to anon;

grant execute on function public.deal_is_visible(uuid) to anon, authenticated;
grant execute on function public.deal_is_owned(uuid)   to anon, authenticated;

-- --- profiles: own row only -------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = auth.uid());

-- --- deals: read own or demo; write own (and never masquerade as a demo) -----
create policy "deals_select_own_or_demo" on public.deals
  for select to anon, authenticated
  using (is_demo or user_id = auth.uid());
create policy "deals_insert_own" on public.deals
  for insert to authenticated
  with check (user_id = auth.uid() and is_demo = false);
create policy "deals_update_own" on public.deals
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_demo = false);
create policy "deals_delete_own" on public.deals
  for delete to authenticated
  using (user_id = auth.uid());

-- --- add_backs: follow the parent deal's visibility --------------------------
create policy "add_backs_select_via_deal" on public.add_backs
  for select to anon, authenticated using (public.deal_is_visible(deal_id));
create policy "add_backs_insert_via_owned_deal" on public.add_backs
  for insert to authenticated with check (public.deal_is_owned(deal_id));
create policy "add_backs_update_via_owned_deal" on public.add_backs
  for update to authenticated
  using (public.deal_is_owned(deal_id)) with check (public.deal_is_owned(deal_id));
create policy "add_backs_delete_via_owned_deal" on public.add_backs
  for delete to authenticated using (public.deal_is_owned(deal_id));

-- --- deal_results: follow the parent deal's visibility -----------------------
create policy "deal_results_select_via_deal" on public.deal_results
  for select to anon, authenticated using (public.deal_is_visible(deal_id));
create policy "deal_results_insert_via_owned_deal" on public.deal_results
  for insert to authenticated with check (public.deal_is_owned(deal_id));
create policy "deal_results_update_via_owned_deal" on public.deal_results
  for update to authenticated
  using (public.deal_is_owned(deal_id)) with check (public.deal_is_owned(deal_id));
create policy "deal_results_delete_via_owned_deal" on public.deal_results
  for delete to authenticated using (public.deal_is_owned(deal_id));

-- --- assumptions: follow the parent deal's visibility ------------------------
create policy "assumptions_select_via_deal" on public.assumptions
  for select to anon, authenticated using (public.deal_is_visible(deal_id));
create policy "assumptions_insert_via_owned_deal" on public.assumptions
  for insert to authenticated with check (public.deal_is_owned(deal_id));
create policy "assumptions_update_via_owned_deal" on public.assumptions
  for update to authenticated
  using (public.deal_is_owned(deal_id)) with check (public.deal_is_owned(deal_id));
create policy "assumptions_delete_via_owned_deal" on public.assumptions
  for delete to authenticated using (public.deal_is_owned(deal_id));

-- --- leads: anyone can sign up; nobody reads via the anon/authenticated key --
create policy "leads_insert_anyone" on public.leads
  for insert to anon, authenticated with check (true);

-- --- events: anyone can write (guest rows carry a null user_id); read own ----
create policy "events_insert_anyone" on public.events
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "events_select_own" on public.events
  for select to authenticated using (user_id = auth.uid());
