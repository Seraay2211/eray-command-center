-- Eray Command Center - Phase 6 Tasks module
-- Existing projects can run this file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_created_at_idx
  on public.tasks(user_id, created_at desc);

create index if not exists tasks_user_status_idx
  on public.tasks(user_id, status);

create index if not exists tasks_user_due_date_idx
  on public.tasks(user_id, due_date);

create index if not exists tasks_user_category_idx
  on public.tasks(user_id, category_id);

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

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

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

alter table public.tasks enable row level security;

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

grant select, insert, update, delete
on public.tasks
to authenticated;
