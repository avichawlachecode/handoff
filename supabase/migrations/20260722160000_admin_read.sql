-- Admin read access for the /admin dashboard (PRD §12 Task 10).
--
-- The admin signs in with email/password as the hard-coded admin email; RLS
-- then lets that identity read ALL events and leads. Everyone else keeps the
-- Task 3 policies (users see only their own events; nobody reads leads).
--
-- To use: create a Supabase Auth user for this email (Auth → Users → Add user,
-- Auto Confirm), then sign in on /admin. Change the literal below to move admin.

create policy "events_select_admin" on public.events
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'avi.chawlache@gmail.com');

-- leads had no SELECT grant/policy (insert-only). Open the privilege; the policy
-- restricts rows to the admin, so non-admins still read nothing.
grant select on public.leads to authenticated;

create policy "leads_select_admin" on public.leads
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'avi.chawlache@gmail.com');
