-- Eray Command Center - Phase 18 Settings Center 2.0
-- Run once in Supabase Dashboard > SQL Editor.

alter table public.user_settings
  alter column density set default 'compact';

alter table public.user_settings
  add column if not exists font_family text not null default 'geist',
  add column if not exists reduce_motion boolean not null default false,
  add column if not exists default_landing_page text not null default 'dashboard',
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists finance_alerts_enabled boolean not null default true,
  add column if not exists task_alerts_enabled boolean not null default true,
  add column if not exists calendar_alerts_enabled boolean not null default true,
  add column if not exists highlight_critical_alerts boolean not null default true,
  add column if not exists default_currency text not null default 'TRY',
  add column if not exists highlight_overdue_debts boolean not null default true,
  add column if not exists critical_debt_threshold numeric(14,2) not null default 100000,
  add column if not exists show_ai_summaries boolean not null default true,
  add column if not exists show_finance_ai_warning boolean not null default true,
  add column if not exists short_ai_response_mode boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false;

alter table public.user_settings
  alter column font_family set default 'geist';

alter table public.user_settings
  drop constraint if exists user_settings_font_family_check,
  add constraint user_settings_font_family_check
    check (font_family in ('inter', 'geist', 'system')),
  drop constraint if exists user_settings_default_landing_page_check,
  add constraint user_settings_default_landing_page_check
    check (default_landing_page in ('dashboard', 'today', 'notes', 'finance', 'tasks')),
  drop constraint if exists user_settings_default_currency_check,
  add constraint user_settings_default_currency_check
    check (default_currency in ('TRY')),
  drop constraint if exists user_settings_critical_debt_threshold_check,
  add constraint user_settings_critical_debt_threshold_check
    check (critical_debt_threshold >= 0);
