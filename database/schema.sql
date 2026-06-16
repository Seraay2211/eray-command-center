-- Eray Command Center - Notes module
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  slug text not null check (char_length(trim(slug)) between 1 and 80),
  color text not null default '#8b5cf6',
  created_at timestamptz not null default now(),
  constraint categories_user_slug_key unique (user_id, slug)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null default '',
  status text not null default 'active' check (status in ('active')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  color text not null default '#71717a',
  created_at timestamptz not null default now(),
  constraint tags_user_name_key unique (user_id, name)
);

create table if not exists public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  action_type text not null check (char_length(trim(action_type)) between 1 and 60),
  input_text text not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.note_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  bucket text not null default 'note-images',
  path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  width int,
  height int,
  created_at timestamptz not null default now(),
  constraint note_images_path_key unique (bucket, path)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'waiting', 'done')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  due_date timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks
  add column if not exists archived_at timestamptz;

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

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '',
  template_type text not null default 'note'
    check (template_type in ('note', 'report', 'task', 'ai_prompt', 'telegram', 'operation', 'finance', 'software', 'daily_plan')),
  content text not null default '',
  variables jsonb not null default '[]'::jsonb,
  category_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  app_theme text not null default 'command_dark'
    check (app_theme in ('command_dark', 'midnight_violet', 'obsidian_gold', 'slate_blue', 'executive_light')),
  language text not null default 'tr' check (language in ('tr', 'en')),
  density text not null default 'balanced' check (density in ('comfortable', 'balanced', 'compact')),
  sidebar_mode text not null default 'expanded' check (sidebar_mode in ('expanded', 'collapsed')),
  font_family text not null default 'system'
    check (font_family in ('system', 'inter', 'geist', 'manrope', 'jakarta', 'nunito', 'roboto')),
  reduce_motion boolean not null default false,
  appearance_preferences jsonb,
  dashboard_preferences jsonb,
  default_landing_page text not null default 'dashboard'
    check (default_landing_page in ('dashboard', 'today', 'notes', 'finance', 'tasks')),
  notifications_enabled boolean not null default true,
  finance_alerts_enabled boolean not null default true,
  task_alerts_enabled boolean not null default true,
  calendar_alerts_enabled boolean not null default true,
  highlight_critical_alerts boolean not null default true,
  default_currency text not null default 'TRY' check (default_currency in ('TRY')),
  highlight_overdue_debts boolean not null default true,
  critical_debt_threshold numeric(14,2) not null default 100000
    check (critical_debt_threshold >= 0),
  show_ai_summaries boolean not null default true,
  show_finance_ai_warning boolean not null default true,
  short_ai_response_mode boolean not null default false,
  onboarding_completed boolean not null default false,
  dashboard_layout text not null default 'default' check (dashboard_layout in ('default', 'focus', 'compact')),
  default_note_category_id uuid references public.categories(id) on delete set null,
  default_task_status text not null default 'todo'
    check (default_task_status in ('todo', 'in_progress', 'waiting', 'done')),
  default_task_priority text not null default 'medium'
    check (default_task_priority in ('low', 'medium', 'high', 'critical')),
  ai_provider text not null default 'gemini' check (ai_provider in ('gemini', 'demo')),
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

create index if not exists categories_user_id_idx
  on public.categories(user_id);

create index if not exists notes_user_created_at_idx
  on public.notes(user_id, created_at desc);

create index if not exists notes_user_category_idx
  on public.notes(user_id, category_id);

create index if not exists notes_user_pinned_idx
  on public.notes(user_id, is_pinned desc);

create index if not exists tags_user_id_idx
  on public.tags(user_id);

create index if not exists note_tags_tag_id_idx
  on public.note_tags(tag_id);

create index if not exists ai_actions_user_created_at_idx
  on public.ai_actions(user_id, created_at desc);

create index if not exists note_images_note_created_at_idx
  on public.note_images(note_id, created_at);

create index if not exists note_images_user_id_idx
  on public.note_images(user_id);

create index if not exists tasks_user_created_at_idx
  on public.tasks(user_id, created_at desc);

create index if not exists tasks_user_status_idx
  on public.tasks(user_id, status);

create index if not exists tasks_user_due_date_idx
  on public.tasks(user_id, due_date);

create index if not exists tasks_user_category_idx
  on public.tasks(user_id, category_id);

create index if not exists tasks_user_archived_at_idx
  on public.tasks(user_id, archived_at);

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

create index if not exists templates_user_updated_at_idx
  on public.templates(user_id, updated_at desc);

create index if not exists templates_type_idx
  on public.templates(template_type);

create index if not exists templates_system_idx
  on public.templates(is_system);

create index if not exists user_settings_user_id_idx
  on public.user_settings(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row
execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

create or replace function public.validate_note_category_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories
    where id = new.category_id
      and user_id = new.user_id
  ) then
    raise exception 'Category must belong to the note owner';
  end if;

  return new;
end;
$$;

drop trigger if exists notes_validate_category_owner on public.notes;
create trigger notes_validate_category_owner
before insert or update of category_id, user_id on public.notes
for each row
execute function public.validate_note_category_owner();

create or replace function public.validate_note_tag_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.notes n
    join public.tags t on t.id = new.tag_id
    where n.id = new.note_id
      and n.user_id = t.user_id
  ) then
    raise exception 'Note and tag must belong to the same user';
  end if;

  return new;
end;
$$;

drop trigger if exists note_tags_validate_owner on public.note_tags;
create trigger note_tags_validate_owner
before insert or update on public.note_tags
for each row
execute function public.validate_note_tag_owner();

create or replace function public.validate_note_image_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.notes
    where notes.id = new.note_id
      and notes.user_id = new.user_id
  ) then
    raise exception 'Note image must belong to the note owner';
  end if;

  return new;
end;
$$;

drop trigger if exists note_images_validate_owner on public.note_images;
create trigger note_images_validate_owner
before insert or update of note_id, user_id on public.note_images
for each row
execute function public.validate_note_image_owner();

create or replace function public.validate_task_category_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories
    where id = new.category_id
      and user_id = new.user_id
  ) then
    raise exception 'Category must belong to the task owner';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_validate_category_owner on public.tasks;
create trigger tasks_validate_category_owner
before insert or update of category_id, user_id on public.tasks
for each row
execute function public.validate_task_category_owner();

create or replace function public.validate_template_category_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories
    where id = new.category_id
      and user_id = auth.uid()
  ) then
    raise exception 'Category must belong to the template owner';
  end if;

  return new;
end;
$$;

drop trigger if exists templates_validate_category_owner on public.templates;
create trigger templates_validate_category_owner
before insert or update of category_id on public.templates
for each row
execute function public.validate_template_category_owner();

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

alter table public.categories enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.ai_actions enable row level security;
alter table public.note_images enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;
alter table public.report_sources enable row level security;
alter table public.templates enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
on public.categories for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
on public.categories for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
on public.notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own"
on public.tags for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own"
on public.tags for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own"
on public.tags for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own"
on public.tags for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "note_tags_select_own" on public.note_tags;
create policy "note_tags_select_own"
on public.note_tags for select
to authenticated
using (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
);

drop policy if exists "note_tags_insert_own" on public.note_tags;
create policy "note_tags_insert_own"
on public.note_tags for insert
to authenticated
with check (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags
    where tags.id = note_tags.tag_id
      and tags.user_id = auth.uid()
  )
);

drop policy if exists "note_tags_update_own" on public.note_tags;
create policy "note_tags_update_own"
on public.note_tags for update
to authenticated
using (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags
    where tags.id = note_tags.tag_id
      and tags.user_id = auth.uid()
  )
);

drop policy if exists "note_tags_delete_own" on public.note_tags;
create policy "note_tags_delete_own"
on public.note_tags for delete
to authenticated
using (
  exists (
    select 1
    from public.notes
    where notes.id = note_tags.note_id
      and notes.user_id = auth.uid()
  )
);

drop policy if exists "ai_actions_select_own" on public.ai_actions;
create policy "ai_actions_select_own"
on public.ai_actions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "ai_actions_insert_own" on public.ai_actions;
create policy "ai_actions_insert_own"
on public.ai_actions for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    note_id is null
    or exists (
      select 1
      from public.notes
      where notes.id = ai_actions.note_id
        and notes.user_id = auth.uid()
    )
  )
);

drop policy if exists "note_images_select_own" on public.note_images;
create policy "note_images_select_own"
on public.note_images for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.notes
    where notes.id = note_images.note_id
      and notes.user_id = auth.uid()
  )
);

drop policy if exists "note_images_insert_own" on public.note_images;
create policy "note_images_insert_own"
on public.note_images for insert
to authenticated
with check (
  auth.uid() = user_id
  and bucket = 'note-images'
  and split_part(path, '/', 1) = auth.uid()::text
  and exists (
    select 1
    from public.notes
    where notes.id = note_images.note_id
      and notes.user_id = auth.uid()
  )
);

drop policy if exists "note_images_delete_own" on public.note_images;
create policy "note_images_delete_own"
on public.note_images for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.notes
    where notes.id = note_images.note_id
      and notes.user_id = auth.uid()
  )
);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks for delete
to authenticated
using (auth.uid() = user_id);

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

drop policy if exists "templates_select_visible" on public.templates;
create policy "templates_select_visible"
on public.templates for select
to authenticated
using (
  auth.uid() = user_id
  or is_system = true
);

drop policy if exists "templates_insert_allowed" on public.templates;
create policy "templates_insert_allowed"
on public.templates for insert
to authenticated
with check (
  (auth.uid() = user_id and is_system = false)
  or (user_id is null and is_system = true)
);

drop policy if exists "templates_update_own_or_system_favorite" on public.templates;
create policy "templates_update_own_or_system_favorite"
on public.templates for update
to authenticated
using (
  auth.uid() = user_id
  or is_system = true
)
with check (
  (auth.uid() = user_id and is_system = false)
  or (user_id is null and is_system = true)
);

drop policy if exists "templates_delete_own_only" on public.templates;
create policy "templates_delete_own_only"
on public.templates for delete
to authenticated
using (
  auth.uid() = user_id
  and is_system = false
);

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
on public.categories, public.notes, public.tags, public.note_tags
to authenticated;

grant select, insert, update, delete
on public.tasks
to authenticated;

grant select, insert, update, delete
on public.reports
to authenticated;

grant select, insert, delete
on public.report_sources
to authenticated;

grant select, insert, update, delete
on public.templates
to authenticated;

grant select, insert, update, delete
on public.user_settings
to authenticated;

grant select, insert
on public.ai_actions
to authenticated;

grant select, insert, delete
on public.note_images
to authenticated;

-- Supabase Storage: private note image bucket.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'note-images',
  'note-images',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "note_images_storage_select_own" on storage.objects;
create policy "note_images_storage_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "note_images_storage_insert_own" on storage.objects;
create policy "note_images_storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "note_images_storage_delete_own" on storage.objects;
create policy "note_images_storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Phase 9: calendar, planner and expanded themes.
alter table public.user_settings
  add column if not exists show_dashboard_calendar boolean not null default true;

-- Phase 18: Settings Center 2.0 preferences.
alter table public.user_settings
  add column if not exists font_family text not null default 'geist',
  add column if not exists reduce_motion boolean not null default false,
  add column if not exists default_landing_page text not null default 'dashboard',
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists finance_alerts_enabled boolean not null default true,
  add column if not exists task_alerts_enabled boolean not null default true,
  add column if not exists calendar_alerts_enabled boolean not null default true,
  add column if not exists highlight_critical_alerts boolean not null default true,
  add column if not exists default_currency text not null default 'TRY',
  add column if not exists highlight_overdue_debts boolean not null default true,
  add column if not exists critical_debt_threshold numeric(14,2) not null default 100000,
  add column if not exists show_ai_summaries boolean not null default true,
  add column if not exists show_finance_ai_warning boolean not null default true,
  add column if not exists short_ai_response_mode boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false;

-- Phase 21: Appearance Center and dashboard personalization.
alter table public.user_settings
  add column if not exists appearance_preferences jsonb,
  add column if not exists dashboard_preferences jsonb;

alter table public.user_settings
  alter column density set default 'balanced',
  alter column font_family set default 'system',
  drop constraint if exists user_settings_density_check,
  add constraint user_settings_density_check
    check (density in ('comfortable', 'balanced', 'compact')),
  drop constraint if exists user_settings_font_family_check,
  add constraint user_settings_font_family_check
    check (font_family in ('system', 'inter', 'geist', 'manrope', 'jakarta', 'nunito', 'roboto'));

alter table public.user_settings
  drop constraint if exists user_settings_default_landing_page_check,
  add constraint user_settings_default_landing_page_check
    check (default_landing_page in ('dashboard', 'today', 'notes', 'finance', 'tasks')),
  drop constraint if exists user_settings_default_currency_check,
  add constraint user_settings_default_currency_check
    check (default_currency in ('TRY')),
  drop constraint if exists user_settings_critical_debt_threshold_check,
  add constraint user_settings_critical_debt_threshold_check
    check (critical_debt_threshold >= 0);

alter table public.user_settings
  drop constraint if exists user_settings_app_theme_check;

alter table public.user_settings
  add constraint user_settings_app_theme_check
  check (
    app_theme in (
      'command_dark',
      'midnight_violet',
      'obsidian_gold',
      'slate_blue',
      'executive_light',
      'emerald_terminal',
      'cyber_neon',
      'crimson_ops',
      'nordic_ice',
      'graphite_red',
      'forest_command',
      'ocean_depth',
      'royal_indigo',
      'desert_sand',
      'coffee_house',
      'titanium',
      'matrix_green',
      'rose_noir',
      'arctic_light',
      'paper_pro',
      'royal-amethyst',
      'carbon-mint',
      'deep-space',
      'coffee-bronze',
      'arctic-glass',
      'night-sakura',
      'military-olive',
      'ice-lavender',
      'graphite-cyan',
      'sandstone-light',
      'ruby-noir',
      'azure-command',
      'pearl-minimal',
      'solar-amber',
      'titanium-blue',
      'velvet-plum',
      'glacier-mint',
      'neon-orchid',
      'walnut-cream',
      'storm-indigo',
      'matrix-lime',
      'cloud-silver',
      'crimson-executive',
      'oceanic-teal',
      'desert-night'
    )
  );

create table if not exists public.planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  note_id uuid references public.notes(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  event_type text not null default 'plan'
    check (event_type in ('plan', 'focus', 'reminder', 'meeting', 'task', 'note', 'personal')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_events_time_order_check
    check (end_at is null or end_at >= start_at)
);

create index if not exists planner_events_user_start_idx
  on public.planner_events(user_id, start_at asc);

create index if not exists planner_events_user_status_idx
  on public.planner_events(user_id, status);

create index if not exists planner_events_user_type_idx
  on public.planner_events(user_id, event_type);

create index if not exists planner_events_task_idx
  on public.planner_events(task_id);

create index if not exists planner_events_note_idx
  on public.planner_events(note_id);

create or replace function public.validate_planner_event_links_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.task_id is not null and not exists (
    select 1
    from public.tasks
    where tasks.id = new.task_id
      and tasks.user_id = new.user_id
  ) then
    raise exception 'Planner task must belong to the event owner';
  end if;

  if new.note_id is not null and not exists (
    select 1
    from public.notes
    where notes.id = new.note_id
      and notes.user_id = new.user_id
  ) then
    raise exception 'Planner note must belong to the event owner';
  end if;

  return new;
end;
$$;

drop trigger if exists planner_events_set_updated_at on public.planner_events;
create trigger planner_events_set_updated_at
before update on public.planner_events
for each row
execute function public.set_updated_at();

drop trigger if exists planner_events_validate_links_owner on public.planner_events;
create trigger planner_events_validate_links_owner
before insert or update of user_id, task_id, note_id
on public.planner_events
for each row
execute function public.validate_planner_event_links_owner();

alter table public.planner_events enable row level security;

drop policy if exists "planner_events_select_own" on public.planner_events;
create policy "planner_events_select_own"
on public.planner_events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "planner_events_insert_own" on public.planner_events;
create policy "planner_events_insert_own"
on public.planner_events for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "planner_events_update_own" on public.planner_events;
create policy "planner_events_update_own"
on public.planner_events for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "planner_events_delete_own" on public.planner_events;
create policy "planner_events_delete_own"
on public.planner_events for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete
on public.planner_events
to authenticated;

-- Faz 15: Finans / Borç Kontrol Merkezi
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  creditor text not null default '',
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  currency text not null default 'TRY',
  status text not null default 'active'
    check (status in ('active', 'overdue', 'structured', 'paid', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  installment_count int check (installment_count is null or installment_count > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  method text not null default '',
  note text not null default '',
  receipt_url text,
  receipt_path text,
  receipt_file_name text,
  receipt_mime_type text,
  ocr_status text default 'idle'
    check (ocr_status in ('idle', 'processing', 'success', 'failed')),
  ocr_result jsonb,
  created_at timestamptz not null default now()
);

alter table public.debt_payments
  add column if not exists receipt_url text,
  add column if not exists receipt_path text,
  add column if not exists receipt_file_name text,
  add column if not exists receipt_mime_type text,
  add column if not exists ocr_status text default 'idle',
  add column if not exists ocr_result jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'debt_payments_ocr_status_check'
      and conrelid = 'public.debt_payments'::regclass
  ) then
    alter table public.debt_payments
      add constraint debt_payments_ocr_status_check
      check (ocr_status in ('idle', 'processing', 'success', 'failed'));
  end if;
end
$$;

create index if not exists debts_user_due_date_idx on public.debts(user_id, due_date asc);
create index if not exists debts_user_status_idx on public.debts(user_id, status);
create index if not exists debts_user_priority_idx on public.debts(user_id, priority);
create index if not exists debt_payments_debt_date_idx on public.debt_payments(debt_id, payment_date desc);
create index if not exists debt_payments_user_date_idx on public.debt_payments(user_id, payment_date desc);

create or replace function public.validate_debt_payment_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.debts
    where debts.id = new.debt_id and debts.user_id = new.user_id
  ) then
    raise exception 'Payment debt must belong to the payment owner';
  end if;
  return new;
end;
$$;

create or replace function public.sync_debt_payment_totals()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_debt_id uuid;
  target_user_id uuid;
  payment_total numeric(14,2);
begin
  if tg_op = 'DELETE' then
    target_debt_id := old.debt_id;
    target_user_id := old.user_id;
  else
    target_debt_id := new.debt_id;
    target_user_id := new.user_id;
  end if;
  select greatest(coalesce(sum(amount), 0), 0) into payment_total
  from public.debt_payments
  where debt_id = target_debt_id and user_id = target_user_id;
  update public.debts
  set
    paid_amount = payment_total,
    status = case
      when status = 'cancelled' then status
      when payment_total >= total_amount and total_amount > 0 then 'paid'
      when status = 'paid' and payment_total < total_amount then 'active'
      else status
    end
  where id = target_debt_id and user_id = target_user_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists debts_set_updated_at on public.debts;
create trigger debts_set_updated_at before update on public.debts
for each row execute function public.set_updated_at();

drop trigger if exists debt_payments_validate_owner on public.debt_payments;
create trigger debt_payments_validate_owner
before insert or update of user_id, debt_id on public.debt_payments
for each row execute function public.validate_debt_payment_owner();

drop trigger if exists debt_payments_sync_totals on public.debt_payments;
create trigger debt_payments_sync_totals
after insert or update or delete on public.debt_payments
for each row execute function public.sync_debt_payment_totals();

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own" on public.debts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own" on public.debts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own" on public.debts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own" on public.debts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "debt_payments_select_own" on public.debt_payments;
create policy "debt_payments_select_own" on public.debt_payments for select to authenticated using (auth.uid() = user_id);
drop policy if exists "debt_payments_insert_own" on public.debt_payments;
create policy "debt_payments_insert_own" on public.debt_payments for insert to authenticated
with check (
  auth.uid() = user_id and exists (
    select 1 from public.debts
    where debts.id = debt_payments.debt_id and debts.user_id = auth.uid()
  )
);
drop policy if exists "debt_payments_update_own" on public.debt_payments;
create policy "debt_payments_update_own" on public.debt_payments for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id and exists (
    select 1 from public.debts
    where debts.id = debt_payments.debt_id and debts.user_id = auth.uid()
  )
);
drop policy if exists "debt_payments_delete_own" on public.debt_payments;
create policy "debt_payments_delete_own" on public.debt_payments for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.debts to authenticated;
grant select, insert, update, delete on public.debt_payments to authenticated;

-- Faz 20: Taksit planı
alter table public.debts
  add column if not exists is_installment boolean not null default false,
  add column if not exists installment_amount numeric(14,2),
  add column if not exists installment_start_date date,
  add column if not exists installment_day int,
  add column if not exists installment_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'debts_installment_amount_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_installment_amount_check
      check (installment_amount is null or installment_amount > 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'debts_installment_day_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_installment_day_check
      check (installment_day is null or installment_day between 1 and 31);
  end if;
end
$$;

create table if not exists public.debt_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  installment_no int not null check (installment_no > 0),
  due_date date not null,
  expected_amount numeric(14,2) not null default 0 check (expected_amount > 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'partial', 'paid', 'overdue')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (debt_id, installment_no)
);

alter table public.debt_payments
  add column if not exists installment_id uuid
    references public.debt_installments(id) on delete set null;

create index if not exists debt_installments_user_id_idx on public.debt_installments(user_id);
create index if not exists debt_installments_debt_id_idx on public.debt_installments(debt_id);
create index if not exists debt_installments_due_date_idx on public.debt_installments(due_date);
create index if not exists debt_installments_status_idx on public.debt_installments(status);
create index if not exists debt_payments_installment_id_idx on public.debt_payments(installment_id);

create or replace function public.validate_debt_installment_owner()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if not exists (
    select 1 from public.debts
    where debts.id = new.debt_id and debts.user_id = new.user_id
  ) then
    raise exception 'Installment debt must belong to the installment owner';
  end if;
  return new;
end;
$$;

create or replace function public.validate_debt_payment_owner()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if not exists (
    select 1 from public.debts
    where debts.id = new.debt_id and debts.user_id = new.user_id
  ) then
    raise exception 'Payment debt must belong to the payment owner';
  end if;
  if new.installment_id is not null and not exists (
    select 1 from public.debt_installments
    where debt_installments.id = new.installment_id
      and debt_installments.debt_id = new.debt_id
      and debt_installments.user_id = new.user_id
  ) then
    raise exception 'Payment installment must belong to the same debt owner';
  end if;
  return new;
end;
$$;

create or replace function public.recalculate_debt_installment(target_installment_id uuid)
returns void language plpgsql security invoker set search_path = public
as $$
declare
  payment_total numeric(14,2);
  payment_completed_at timestamptz;
begin
  if target_installment_id is null then return; end if;
  select
    greatest(coalesce(sum(amount), 0), 0),
    max(payment_date)::timestamptz
    into payment_total, payment_completed_at
  from public.debt_payments where installment_id = target_installment_id;
  update public.debt_installments
  set paid_amount = payment_total,
      status = case
        when payment_total >= expected_amount then 'paid'
        when payment_total > 0 then 'partial'
        when due_date < (now() at time zone 'Europe/Istanbul')::date
          then 'overdue'
        else 'pending'
      end,
      paid_at = case
        when payment_total >= expected_amount
          then coalesce(payment_completed_at, paid_at, now())
        else null
      end,
      updated_at = now()
  where id = target_installment_id;
end;
$$;

create or replace function public.sync_debt_installment_payment_totals()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_debt_installment(old.installment_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.installment_id is distinct from new.installment_id then
    perform public.recalculate_debt_installment(old.installment_id);
  end if;
  perform public.recalculate_debt_installment(new.installment_id);
  return new;
end;
$$;

drop trigger if exists debt_installments_validate_owner on public.debt_installments;
create trigger debt_installments_validate_owner
before insert or update of user_id, debt_id on public.debt_installments
for each row execute function public.validate_debt_installment_owner();
drop trigger if exists debt_installments_set_updated_at on public.debt_installments;
create trigger debt_installments_set_updated_at before update on public.debt_installments
for each row execute function public.set_updated_at();
drop trigger if exists debt_payments_validate_owner on public.debt_payments;
create trigger debt_payments_validate_owner
before insert or update of user_id, debt_id, installment_id on public.debt_payments
for each row execute function public.validate_debt_payment_owner();
drop trigger if exists debt_payments_sync_installments on public.debt_payments;
create trigger debt_payments_sync_installments
after insert or update or delete on public.debt_payments
for each row execute function public.sync_debt_installment_payment_totals();

alter table public.debt_installments enable row level security;
drop policy if exists "debt_installments_select_own" on public.debt_installments;
create policy "debt_installments_select_own" on public.debt_installments
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "debt_installments_insert_own" on public.debt_installments;
create policy "debt_installments_insert_own" on public.debt_installments
for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.debts
    where debts.id = debt_installments.debt_id and debts.user_id = auth.uid()
  )
);
drop policy if exists "debt_installments_update_own" on public.debt_installments;
create policy "debt_installments_update_own" on public.debt_installments
for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);
drop policy if exists "debt_installments_delete_own" on public.debt_installments;
create policy "debt_installments_delete_own" on public.debt_installments
for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.debt_installments to authenticated;

-- Faz 16.1 + 16.2: Bildirim merkezi ve finans uyarıları.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  source text,
  source_id uuid,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  action_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_read_idx
  on public.notifications(user_id, is_read);
create index if not exists notifications_source_idx
  on public.notifications(source, source_id);
create unique index if not exists notifications_daily_source_unique_idx
  on public.notifications(
    user_id,
    type,
    source,
    source_id,
    (metadata ->> 'generated_for_date')
  )
  where source_id is not null and metadata ? 'generated_for_date';

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
on public.notifications for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.notifications to authenticated;

-- Supabase Storage: private finance receipt bucket.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'finance-receipts',
  'finance-receipts',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "finance_receipts_storage_select_own" on storage.objects;
create policy "finance_receipts_storage_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "finance_receipts_storage_insert_own" on storage.objects;
create policy "finance_receipts_storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "finance_receipts_storage_update_own" on storage.objects;
create policy "finance_receipts_storage_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "finance_receipts_storage_delete_own" on storage.objects;
create policy "finance_receipts_storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'finance-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Faz 15.3: Borç ve ödeme bazlı finans dosyaları.
create table if not exists public.debt_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid references public.debts(id) on delete cascade,
  payment_id uuid references public.debt_payments(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  attachment_type text not null default 'receipt'
    check (attachment_type in ('receipt', 'document', 'image', 'other')),
  ocr_text text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_attachments_single_parent_check check (
    (debt_id is not null and payment_id is null)
    or (debt_id is null and payment_id is not null)
  )
);

create index if not exists debt_attachments_user_created_idx
  on public.debt_attachments(user_id, created_at desc);
create index if not exists debt_attachments_debt_idx
  on public.debt_attachments(debt_id, created_at desc)
  where debt_id is not null;
create index if not exists debt_attachments_payment_idx
  on public.debt_attachments(payment_id, created_at desc)
  where payment_id is not null;

create or replace function public.validate_debt_attachment_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.debt_id is not null and not exists (
    select 1 from public.debts
    where debts.id = new.debt_id and debts.user_id = new.user_id
  ) then
    raise exception 'Attachment debt must belong to the attachment owner';
  end if;
  if new.payment_id is not null and not exists (
    select 1 from public.debt_payments
    where debt_payments.id = new.payment_id
      and debt_payments.user_id = new.user_id
  ) then
    raise exception 'Attachment payment must belong to the attachment owner';
  end if;
  return new;
end;
$$;

drop trigger if exists debt_attachments_validate_owner on public.debt_attachments;
create trigger debt_attachments_validate_owner
before insert or update of user_id, debt_id, payment_id
on public.debt_attachments
for each row execute function public.validate_debt_attachment_owner();

drop trigger if exists debt_attachments_set_updated_at on public.debt_attachments;
create trigger debt_attachments_set_updated_at
before update on public.debt_attachments
for each row execute function public.set_updated_at();

alter table public.debt_attachments enable row level security;

drop policy if exists "debt_attachments_select_own" on public.debt_attachments;
create policy "debt_attachments_select_own"
on public.debt_attachments for select to authenticated
using (auth.uid() = user_id);
drop policy if exists "debt_attachments_insert_own" on public.debt_attachments;
create policy "debt_attachments_insert_own"
on public.debt_attachments for insert to authenticated
with check (auth.uid() = user_id);
drop policy if exists "debt_attachments_update_own" on public.debt_attachments;
create policy "debt_attachments_update_own"
on public.debt_attachments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
drop policy if exists "debt_attachments_delete_own" on public.debt_attachments;
create policy "debt_attachments_delete_own"
on public.debt_attachments for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.debt_attachments to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'finance-files',
  'finance-files',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "finance_files_storage_select_own" on storage.objects;
create policy "finance_files_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'finance-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "finance_files_storage_insert_own" on storage.objects;
create policy "finance_files_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'finance-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "finance_files_storage_update_own" on storage.objects;
create policy "finance_files_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'finance-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'finance-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "finance_files_storage_delete_own" on storage.objects;
create policy "finance_files_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'finance-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
