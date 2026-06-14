-- Faz 16.1 + 16.2: Bildirim merkezi ve finans uyarıları.
-- Tekrar çalıştırılabilir; mevcut kullanıcı verilerini silmez.

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
  where
    source_id is not null
    and metadata ? 'generated_for_date';

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications"
  on public.notifications;
create policy "Users can view own notifications"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications"
  on public.notifications;
create policy "Users can insert own notifications"
on public.notifications for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications"
  on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications"
  on public.notifications;
create policy "Users can delete own notifications"
on public.notifications for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete
on public.notifications
to authenticated;
