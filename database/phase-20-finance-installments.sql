-- Faz 20: Güvenli taksit planı ve ödeme bağlantısı
-- Mevcut borç ve ödeme kayıtlarını silmez.

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

create index if not exists debt_installments_user_id_idx
  on public.debt_installments(user_id);
create index if not exists debt_installments_debt_id_idx
  on public.debt_installments(debt_id);
create index if not exists debt_installments_due_date_idx
  on public.debt_installments(due_date);
create index if not exists debt_installments_status_idx
  on public.debt_installments(status);
create index if not exists debt_payments_installment_id_idx
  on public.debt_payments(installment_id);

create or replace function public.validate_debt_installment_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.debts
    where debts.id = new.debt_id
      and debts.user_id = new.user_id
  ) then
    raise exception 'Installment debt must belong to the installment owner';
  end if;
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
    select 1 from public.debts
    where debts.id = new.debt_id
      and debts.user_id = new.user_id
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

create or replace function public.recalculate_debt_installment(
  target_installment_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  payment_total numeric(14,2);
  payment_completed_at timestamptz;
begin
  if target_installment_id is null then
    return;
  end if;

  select
    greatest(coalesce(sum(amount), 0), 0),
    max(payment_date)::timestamptz
    into payment_total, payment_completed_at
  from public.debt_payments
  where installment_id = target_installment_id;

  update public.debt_installments
  set
    paid_amount = payment_total,
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
returns trigger
language plpgsql
security invoker
set search_path = public
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
create trigger debt_installments_set_updated_at
before update on public.debt_installments
for each row execute function public.set_updated_at();

drop trigger if exists debt_payments_validate_owner on public.debt_payments;
create trigger debt_payments_validate_owner
before insert or update of user_id, debt_id, installment_id
on public.debt_payments
for each row execute function public.validate_debt_payment_owner();

drop trigger if exists debt_payments_sync_installments on public.debt_payments;
create trigger debt_payments_sync_installments
after insert or update or delete on public.debt_payments
for each row execute function public.sync_debt_installment_payment_totals();

alter table public.debt_installments enable row level security;

drop policy if exists "debt_installments_select_own" on public.debt_installments;
create policy "debt_installments_select_own"
on public.debt_installments for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "debt_installments_insert_own" on public.debt_installments;
create policy "debt_installments_insert_own"
on public.debt_installments for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.debts
    where debts.id = debt_installments.debt_id
      and debts.user_id = auth.uid()
  )
);

drop policy if exists "debt_installments_update_own" on public.debt_installments;
create policy "debt_installments_update_own"
on public.debt_installments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "debt_installments_delete_own" on public.debt_installments;
create policy "debt_installments_delete_own"
on public.debt_installments for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.debt_installments to authenticated;
