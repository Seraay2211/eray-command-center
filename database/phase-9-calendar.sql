-- Eray Command Center - Phase 9
-- Calendar, planner and theme expansion

alter table public.user_settings
  add column if not exists show_dashboard_calendar boolean not null default true;

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
      'paper_pro'
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
