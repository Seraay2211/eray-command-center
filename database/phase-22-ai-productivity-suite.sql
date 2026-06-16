-- FAZ 22 — AI Productivity Suite / Notes 2.0
-- Güvenli ve yıkıcı olmayan not alanları.

alter table public.notes
  add column if not exists is_favorite boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists notes_user_favorite_idx
  on public.notes(user_id, is_favorite desc);

create index if not exists notes_user_archived_at_idx
  on public.notes(user_id, archived_at);
