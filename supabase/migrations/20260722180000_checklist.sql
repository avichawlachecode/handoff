-- LOI Protection Pack and Closing Checklist state (PRD §4 stretch #10 / #11).
-- One generic table keyed by (deal, list, item); the LOI and Close tabs upsert
-- `checked`. RLS mirrors add_backs / verification via the Task 3 helpers.

create table if not exists public.checklist_items (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals (id) on delete cascade,
  list       text not null check (list in ('loi', 'closing')),
  item_key   text not null,
  checked    boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (deal_id, list, item_key)
);

create index if not exists checklist_items_deal_id_idx on public.checklist_items (deal_id);

alter table public.checklist_items enable row level security;

grant select, insert, update, delete on public.checklist_items to authenticated;
grant select on public.checklist_items to anon;

create policy "checklist_select_via_deal" on public.checklist_items
  for select to anon, authenticated using (public.deal_is_visible(deal_id));
create policy "checklist_insert_via_owned_deal" on public.checklist_items
  for insert to authenticated with check (public.deal_is_owned(deal_id));
create policy "checklist_update_via_owned_deal" on public.checklist_items
  for update to authenticated
  using (public.deal_is_owned(deal_id)) with check (public.deal_is_owned(deal_id));
create policy "checklist_delete_via_owned_deal" on public.checklist_items
  for delete to authenticated using (public.deal_is_owned(deal_id));
