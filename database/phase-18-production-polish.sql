-- Faz 18: Production polish ve onboarding durumu.
-- Tekrar çalıştırılabilir; mevcut kullanıcı verilerini değiştirmez.

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default false;
