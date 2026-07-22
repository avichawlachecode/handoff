-- Pre-LOI Verification Toolkit checklist state (PRD §4 stretch #12 / Task 12).
-- One row per (deal, checklist item); the Verify tab upserts `checked`.
-- RLS mirrors add_backs: readable when the parent deal is visible, writable
-- when the parent deal is owned — reusing the Task 3 security-definer helpers.

create table if not exists public.verification_items (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals (id) on delete cascade,
  item_key   text not null,
  checked    boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (deal_id, item_key)
);

create index if not exists verification_items_deal_id_idx on public.verification_items (deal_id);

alter table public.verification_items enable row level security;

grant select, insert, update, delete on public.verification_items to authenticated;
grant select on public.verification_items to anon;

create policy "verification_select_via_deal" on public.verification_items
  for select to anon, authenticated using (public.deal_is_visible(deal_id));
create policy "verification_insert_via_owned_deal" on public.verification_items
  for insert to authenticated with check (public.deal_is_owned(deal_id));
create policy "verification_update_via_owned_deal" on public.verification_items
  for update to authenticated
  using (public.deal_is_owned(deal_id)) with check (public.deal_is_owned(deal_id));
create policy "verification_delete_via_owned_deal" on public.verification_items
  for delete to authenticated using (public.deal_is_owned(deal_id));
