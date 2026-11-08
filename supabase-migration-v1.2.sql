-- LeadFlow-AI v1.2 compatibility migration
-- Run this only when upgrading an older LeadFlow-AI database.
-- For a brand-new Supabase project, run supabase-schema.sql instead.
-- The current app.js stores follow-up fields in public.leads and does not
-- read from or write to a separate follow-ups table.

alter table public.leads
  add column if not exists value numeric(12,2) not null default 0;

alter table public.leads
  add column if not exists followup text;

alter table public.leads
  add column if not exists followup_done boolean not null default false;

alter table public.leads
  add column if not exists followup_result text not null default '';

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'));

alter table public.leads enable row level security;

drop policy if exists "Users manage their own leads" on public.leads;

create policy "Users manage their own leads"
on public.leads
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists leads_user_created_idx
on public.leads (user_id, created_at desc);
