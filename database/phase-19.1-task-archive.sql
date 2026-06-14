-- Eray Command Center - Phase 19.1 task archive patch
-- Safe to run more than once in Supabase Dashboard > SQL Editor.

alter table public.tasks
  add column if not exists archived_at timestamptz;

create index if not exists tasks_user_archived_at_idx
  on public.tasks(user_id, archived_at);
