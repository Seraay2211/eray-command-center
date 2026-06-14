-- Eray Command Center - Phase 8 Settings module
-- Run this file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  app_theme text not null default 'command_dark'
    check (app_theme in ('command_dark', 'midnight_violet', 'obsidian_gold', 'slate_blue', 'executive_light')),
  language text not null default 'tr'
    check (language in ('tr', 'en')),
  density text not null default 'comfortable'
    check (density in ('comfortable', 'compact')),
  sidebar_mode text not null default 'expanded'
    check (sidebar_mode in ('expanded', 'collapsed')),
  dashboard_layout text not null default 'default'
    check (dashboard_layout in ('default', 'focus', 'compact')),
  default_note_category_id uuid references public.categories(id) on delete set null,
  default_task_status text not null default 'todo'
    check (default_task_status in ('todo', 'in_progress', 'waiting', 'done')),
  default_task_priority text not null default 'medium'
    check (default_task_priority in ('low', 'medium', 'high', 'critical')),
  ai_provider text not null default 'gemini'
    check (ai_provider in ('gemini', 'demo')),
  ai_default_action text not null default 'premium'
    check (ai_default_action in ('summarize', 'shorten', 'premium', 'manager_report')),
  ai_save_history boolean not null default true,
  ai_sensitive_warning boolean not null default true,
  show_dashboard_notes boolean not null default true,
  show_dashboard_tasks boolean not null default true,
  show_dashboard_reports boolean not null default true,
  show_dashboard_ai boolean not null default true,
  confirm_before_delete boolean not null default true,
  compact_cards boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_settings_user_id_idx
  on public.user_settings(user_id);

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

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

create or replace function public.validate_settings_category_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.default_note_category_id is not null and not exists (
    select 1
    from public.categories
    where categories.id = new.default_note_category_id
      and categories.user_id = new.user_id
  ) then
    raise exception 'Default category must belong to the settings owner';
  end if;

  return new;
end;
$$;

drop trigger if exists user_settings_validate_category_owner on public.user_settings;
create trigger user_settings_validate_category_owner
before insert or update of default_note_category_id, user_id
on public.user_settings
for each row
execute function public.validate_settings_category_owner();

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
on public.user_settings for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
on public.user_settings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
on public.user_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
on public.user_settings for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete
on public.user_settings
to authenticated;
