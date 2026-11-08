-- LeadFlow-AI — Initial Supabase schema
-- Run this once in the SQL Editor of a NEW Supabase project.
-- This schema matches the current app.js data model.
-- Do not run it on an existing production database unless you have reviewed the changes.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  source text not null default 'Other',
  value numeric(12,2) not null default 0,
  followup text,
  followup_done boolean not null default false,
  followup_result text not null default '',
  notes text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

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
