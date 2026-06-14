-- Eray Command Center - Phase 7 Reports module
-- Run this file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null default '',
  report_type text not null default 'custom'
    check (report_type in ('daily', 'weekly', 'operation', 'manager', 'finance', 'custom')),
  status text not null default 'draft'
    check (status in ('draft', 'final', 'archived')),
  source_date date,
  period_start date,
  period_end date,
  summary text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  source_type text not null check (source_type in ('note', 'task', 'manual')),
  source_id uuid not null,
  created_at timestamptz not null default now(),
  constraint report_sources_unique_source
    unique (report_id, source_type, source_id)
);

create index if not exists reports_user_updated_at_idx
  on public.reports(user_id, updated_at desc);

create index if not exists reports_user_type_idx
  on public.reports(user_id, report_type);

create index if not exists reports_user_status_idx
  on public.reports(user_id, status);

create index if not exists report_sources_report_idx
  on public.report_sources(report_id);

create index if not exists report_sources_user_idx
  on public.report_sources(user_id);

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    execute $function$
      create function public.set_updated_at()
      returns trigger
      language plpgsql
      security invoker
      set search_path = public
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$
    $function$;
  end if;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

create or replace function public.validate_report_source_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reports
    where reports.id = new.report_id
      and reports.user_id = new.user_id
  ) then
    raise exception 'Report source must belong to the report owner';
  end if;

  if new.source_type = 'note' and not exists (
    select 1
    from public.notes
    where notes.id = new.source_id
      and notes.user_id = new.user_id
  ) then
    raise exception 'Note source must belong to the report owner';
  end if;

  if new.source_type = 'task' and not exists (
    select 1
    from public.tasks
    where tasks.id = new.source_id
      and tasks.user_id = new.user_id
  ) then
    raise exception 'Task source must belong to the report owner';
  end if;

  return new;
end;
$$;

drop trigger if exists report_sources_validate_owner on public.report_sources;
create trigger report_sources_validate_owner
before insert or update of report_id, user_id, source_type, source_id
on public.report_sources
for each row
execute function public.validate_report_source_owner();

alter table public.reports enable row level security;
alter table public.report_sources enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own"
on public.reports for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own"
on public.reports for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "report_sources_select_own" on public.report_sources;
create policy "report_sources_select_own"
on public.report_sources for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "report_sources_insert_own" on public.report_sources;
create policy "report_sources_insert_own"
on public.report_sources for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "report_sources_delete_own" on public.report_sources;
create policy "report_sources_delete_own"
on public.report_sources for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.reports to authenticated;
grant select, insert, delete on public.report_sources to authenticated;
