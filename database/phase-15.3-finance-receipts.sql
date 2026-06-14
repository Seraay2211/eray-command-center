-- Faz 15.3: Finans dekontları ve OCR alanları.
-- Bu dosya tekrar çalıştırılabilir ve mevcut ödeme kayıtlarını silmez.

alter table public.debt_payments
  add column if not exists receipt_url text,
  add column if not exists receipt_path text,
  add column if not exists receipt_file_name text,
  add column if not exists receipt_mime_type text,
  add column if not exists ocr_status text default 'idle',
  add column if not exists ocr_result jsonb;

update public.debt_payments
set ocr_status = 'idle'
where ocr_status is null;

alter table public.debt_payments
  alter column ocr_status set default 'idle';

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
