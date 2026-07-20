-- Faz 34H: Gelişmiş borç girişi ve vade hatırlatma alanları.
-- Mevcut borç, ödeme ve taksit kayıtlarını değiştirmez veya silmez.

alter table public.debts
  add column if not exists start_date date,
  add column if not exists debt_type text not null default 'other',
  add column if not exists category text,
  add column if not exists reminder_days_before int not null default 3;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'debts_reminder_days_before_check'
      and conrelid = 'public.debts'::regclass
  ) then
    alter table public.debts
      add constraint debts_reminder_days_before_check
      check (reminder_days_before in (0, 1, 3, 7));
  end if;
end
$$;

create index if not exists debts_user_start_date_idx
  on public.debts(user_id, start_date desc);
