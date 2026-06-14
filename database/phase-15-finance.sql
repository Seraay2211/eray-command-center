-- Faz 15: Finans / Borç Kontrol Merkezi
-- Bu dosya tekrar çalıştırılabilir ve mevcut verileri silmez.

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

create index if not exists debts_user_due_date_idx
  on public.debts(user_id, due_date asc);

create index if not exists debts_user_status_idx
  on public.debts(user_id, status);

create index if not exists debts_user_priority_idx
  on public.debts(user_id, priority);

create index if not exists debt_payments_debt_date_idx
  on public.debt_payments(debt_id, payment_date desc);

create index if not exists debt_payments_user_date_idx
  on public.debt_payments(user_id, payment_date desc);

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

create or replace function public.validate_debt_payment_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.debts
    where debts.id = new.debt_id
      and debts.user_id = new.user_id
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

  select greatest(coalesce(sum(amount), 0), 0)
    into payment_total
  from public.debt_payments
  where debt_id = target_debt_id
    and user_id = target_user_id;

  update public.debts
  set
    paid_amount = payment_total,
    status = case
      when status = 'cancelled' then status
      when payment_total >= total_amount and total_amount > 0 then 'paid'
      when status = 'paid' and payment_total < total_amount then 'active'
      else status
    end
  where id = target_debt_id
    and user_id = target_user_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists debts_set_updated_at on public.debts;
create trigger debts_set_updated_at
before update on public.debts
for each row
execute function public.set_updated_at();

drop trigger if exists debt_payments_validate_owner on public.debt_payments;
create trigger debt_payments_validate_owner
before insert or update of user_id, debt_id
on public.debt_payments
for each row
execute function public.validate_debt_payment_owner();

drop trigger if exists debt_payments_sync_totals on public.debt_payments;
create trigger debt_payments_sync_totals
after insert or update or delete on public.debt_payments
for each row
execute function public.sync_debt_payment_totals();

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own"
on public.debts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own"
on public.debts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own"
on public.debts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own"
on public.debts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "debt_payments_select_own" on public.debt_payments;
create policy "debt_payments_select_own"
on public.debt_payments for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "debt_payments_insert_own" on public.debt_payments;
create policy "debt_payments_insert_own"
on public.debt_payments for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.debts
    where debts.id = debt_payments.debt_id
      and debts.user_id = auth.uid()
  )
);

drop policy if exists "debt_payments_update_own" on public.debt_payments;
create policy "debt_payments_update_own"
on public.debt_payments for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.debts
    where debts.id = debt_payments.debt_id
      and debts.user_id = auth.uid()
  )
);

drop policy if exists "debt_payments_delete_own" on public.debt_payments;
create policy "debt_payments_delete_own"
on public.debt_payments for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.debts to authenticated;
grant select, insert, update, delete on public.debt_payments to authenticated;
