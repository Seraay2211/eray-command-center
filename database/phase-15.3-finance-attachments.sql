-- Faz 15.3: Borç ve ödeme bazlı finans dosyaları.
-- Bu dosya tekrar çalıştırılabilir; mevcut borç ve ödeme kayıtlarını değiştirmez.

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
