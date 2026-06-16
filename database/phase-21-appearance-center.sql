-- Faz 21: Görünüm Merkezi ve Dashboard kişiselleştirme.
-- Bu güncelleme veri silmez; yalnızca güvenli tercih alanları ekler.

alter table public.user_settings
  add column if not exists appearance_preferences jsonb,
  add column if not exists dashboard_preferences jsonb;

alter table public.user_settings
  alter column density set default 'balanced',
  alter column font_family set default 'system';

alter table public.user_settings
  drop constraint if exists user_settings_density_check;

alter table public.user_settings
  add constraint user_settings_density_check
    check (density in ('comfortable', 'balanced', 'compact'));

alter table public.user_settings
  drop constraint if exists user_settings_font_family_check;

alter table public.user_settings
  add constraint user_settings_font_family_check
    check (
      font_family in (
        'system',
        'inter',
        'geist',
        'manrope',
        'jakarta',
        'nunito',
        'roboto'
      )
    );

alter table public.user_settings
  drop constraint if exists user_settings_app_theme_check;

alter table public.user_settings
  add constraint user_settings_app_theme_check
    check (
      app_theme in (
        'command_dark',
        'midnight_violet',
        'obsidian_gold',
        'slate_blue',
        'executive_light',
        'emerald_terminal',
        'cyber_neon',
        'crimson_ops',
        'nordic_ice',
        'graphite_red',
        'forest_command',
        'ocean_depth',
        'royal_indigo',
        'desert_sand',
        'coffee_house',
        'titanium',
        'matrix_green',
        'rose_noir',
        'arctic_light',
        'paper_pro',
        'royal-amethyst',
        'carbon-mint',
        'deep-space',
        'coffee-bronze',
        'arctic-glass',
        'night-sakura',
        'military-olive',
        'ice-lavender',
        'graphite-cyan',
        'sandstone-light',
        'ruby-noir',
        'azure-command',
        'pearl-minimal',
        'solar-amber',
        'titanium-blue',
        'velvet-plum',
        'glacier-mint',
        'neon-orchid',
        'walnut-cream',
        'storm-indigo',
        'matrix-lime',
        'cloud-silver',
        'crimson-executive',
        'oceanic-teal',
        'desert-night'
      )
    );
