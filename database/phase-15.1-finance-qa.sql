-- Faz 15.1: Ödeme ekleme/silme toplam senkronizasyonu
-- Mevcut verileri silmez. Faz 15 kurulumu daha önce yapıldıysa çalıştırılabilir.

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

drop trigger if exists debt_payments_sync_totals on public.debt_payments;
create trigger debt_payments_sync_totals
after insert or update or delete on public.debt_payments
for each row
execute function public.sync_debt_payment_totals();

-- Mevcut kayıtları da ödeme tablosundaki gerçek toplamla eşitle.
update public.debts
set
  paid_amount = greatest(
    coalesce(
      (
        select sum(debt_payments.amount)
        from public.debt_payments
        where debt_payments.debt_id = debts.id
          and debt_payments.user_id = debts.user_id
      ),
      0
    ),
    0
  ),
  status = case
    when debts.status = 'cancelled' then debts.status
    when coalesce(
      (
        select sum(debt_payments.amount)
        from public.debt_payments
        where debt_payments.debt_id = debts.id
          and debt_payments.user_id = debts.user_id
      ),
      0
    ) >= debts.total_amount
      and debts.total_amount > 0
      then 'paid'
    when debts.status = 'paid' then 'active'
    else debts.status
  end;
