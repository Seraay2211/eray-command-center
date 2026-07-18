"use client";

import {
  AlignJustify,
  Check,
  Eye,
  Layers3,
  PanelLeft,
  Sparkles,
  Type,
} from "lucide-react";
import type { CSSProperties } from "react";
import { SegmentedControl } from "@/components/settings/segmented-control";
import { SettingsSection } from "@/components/settings/settings-section";
import { ThemeLibrary } from "@/components/settings/theme-library";
import { normalizeAppearancePreferences } from "@/lib/settings/appearance-preferences";
import {
  APP_FONT_OPTIONS,
  getAppFontStack,
  normalizeAppFontFamily,
} from "@/lib/settings/fonts";
import {
  getThemeById,
  getThemePreviewColors,
} from "@/lib/settings/themes";
import type {
  AppCardStyle,
  AppDensity,
  AppFontFamily,
  AppLineHeight,
  AppTextSize,
  SidebarMode,
  UpdateUserSettingsInput,
  UserSettings,
} from "@/types";

interface AppearanceCenterProps {
  onSave: (
    key: string,
    input: UpdateUserSettingsInput,
    successMessage?: string,
  ) => Promise<void>;
  settings: UserSettings;
}

const textSizeOptions = [
  { label: "Küçük", value: "small" },
  { label: "Normal", value: "normal" },
  { label: "Büyük", value: "large" },
] as const;

const lineHeightOptions = [
  { label: "Sıkı", value: "tight" },
  { label: "Normal", value: "normal" },
  { label: "Ferah", value: "relaxed" },
] as const;

const densityOptions = [
  { label: "Rahat", value: "comfortable" },
  { label: "Dengeli", value: "balanced" },
  { label: "Kompakt", value: "compact" },
] as const;

const cardStyleOptions = [
  { label: "Keskin", value: "sharp" },
  { label: "Modern", value: "modern" },
  { label: "Yuvarlak", value: "rounded" },
  { label: "Yumuşak", value: "soft" },
  { label: "Cam Efekti", value: "glass" },
] as const;

const motionOptions = [
  { label: "Normal", value: "normal" },
  { label: "Azaltılmış", value: "reduced" },
] as const;

const sidebarOptions = [
  { label: "Geniş", value: "expanded" },
  { label: "Dar", value: "collapsed" },
] as const;

export function AppearanceCenter({
  onSave,
  settings,
}: AppearanceCenterProps) {
  const appearance = normalizeAppearancePreferences(
    settings.appearance_preferences,
  );
  const activeTheme = getThemeById(settings.app_theme);
  const previewColors = activeTheme
    ? getThemePreviewColors(activeTheme)
    : [];
  const selectedFont = normalizeAppFontFamily(settings.font_family);

  function saveFont(fontFamily: AppFontFamily) {
    return onSave(
      "font",
      { font_family: fontFamily },
      "Yazı tipi uygulandı.",
    );
  }

  function saveAppearance(
    key: string,
    patch: Partial<typeof appearance>,
    message: string,
  ) {
    return onSave(
      key,
      {
        appearance_preferences: {
          ...appearance,
          ...patch,
        },
      },
      message,
    );
  }

  return (
    <SettingsSection
      description="Visual Pack, yazı tipi ve arayüz ritmini tek yerden kişiselleştir."
      icon={Eye}
      title="Görünüm Merkezi"
    >
      <div className="app-surface-2 app-border relative overflow-hidden rounded-2xl border p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] blur-3xl" />
        <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Check className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                Aktif Görünüm
              </p>
              <h3 className="app-text mt-1 truncate text-base font-semibold">
                {activeTheme?.name ?? settings.app_theme}
              </h3>
              <p className="app-muted mt-1 text-xs">
                {activeTheme?.description ??
                  "Seçili çalışma alanı görünümü kullanılıyor."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {previewColors.map((color) => (
              <span
                className="size-6 rounded-full border border-black/10 shadow-sm"
                key={color}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <ThemeLibrary
        activeThemeId={settings.app_theme}
        onSelect={(themeId) =>
          void onSave(
            `theme-${themeId}`,
            { app_theme: themeId },
            "Tema uygulandı.",
          )
        }
      />

      <div className="app-surface-2 app-border min-w-0 rounded-2xl border p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="app-surface app-primary flex size-9 shrink-0 items-center justify-center rounded-xl border">
            <Type className="size-4" />
          </span>
          <div>
            <h3 className="app-text text-sm font-semibold">
              Yazı ve Okunabilirlik
            </h3>
            <p className="app-muted mt-1 text-xs leading-5">
              Dokuz yazı ailesinden çalışma tarzına en uygun olanı seç. Değişiklik anında uygulanır.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="app-muted mb-2 text-[11px] font-medium">Yazı Tipi</p>
            <SegmentedControl<AppFontFamily>
              ariaLabel="Yazı tipi"
              className="grid-cols-2 sm:grid-cols-3"
              onChange={(fontFamily) => void saveFont(fontFamily)}
              options={APP_FONT_OPTIONS}
              value={selectedFont}
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {APP_FONT_OPTIONS.map((font) => {
                const isActive = selectedFont === font.value;
                const previewStyle = {
                  fontFamily: getAppFontStack(font.value),
                } as CSSProperties;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`app-surface app-border min-w-0 rounded-xl border p-3 text-left transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] ${
                      isActive
                        ? "ring-1 ring-[color-mix(in_srgb,var(--primary)_48%,transparent)]"
                        : ""
                    }`}
                    key={font.value}
                    onClick={() => void saveFont(font.value)}
                    style={previewStyle}
                    type="button"
                  >
                    <span className="app-text block text-[11px] font-semibold">
                      {font.label}
                    </span>
                    <span className="app-muted mt-1 block text-[11px] leading-5">
                      Türkçe karakter testi: Ç Ş Ğ Ü Ö İ ı
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="app-muted mb-2 text-[11px] font-medium">
                Metin Boyutu
              </p>
              <SegmentedControl<AppTextSize>
                ariaLabel="Metin boyutu"
                className="grid-cols-3 sm:grid-cols-3"
                onChange={(textSize) =>
                  void saveAppearance(
                    "text-size",
                    { text_size: textSize },
                    "Metin boyutu uygulandı.",
                  )
                }
                options={textSizeOptions}
                value={appearance.text_size}
              />
            </div>
            <div>
              <p className="app-muted mb-2 text-[11px] font-medium">
                Satır Aralığı
              </p>
              <SegmentedControl<AppLineHeight>
                ariaLabel="Satır aralığı"
                className="grid-cols-3 sm:grid-cols-3"
                onChange={(lineHeight) =>
                  void saveAppearance(
                    "line-height",
                    { line_height: lineHeight },
                    "Satır aralığı uygulandı.",
                  )
                }
                options={lineHeightOptions}
                value={appearance.line_height}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="app-surface-2 app-border min-w-0 rounded-2xl border p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="app-surface app-primary flex size-9 shrink-0 items-center justify-center rounded-xl border">
            <Layers3 className="size-4" />
          </span>
          <div>
            <h3 className="app-text text-sm font-semibold">Arayüz Hissi</h3>
            <p className="app-muted mt-1 text-xs leading-5">
              Kartların boşluğunu, köşelerini ve hareket düzeyini ayarla.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="app-muted mb-2 flex items-center gap-2 text-[11px] font-medium">
              <AlignJustify className="size-3.5" />
              Arayüz Yoğunluğu
            </p>
            <SegmentedControl<AppDensity>
              ariaLabel="Arayüz yoğunluğu"
              className="grid-cols-3 sm:grid-cols-3"
              onChange={(density) =>
                void onSave(
                  "density",
                  { density },
                  "Arayüz yoğunluğu uygulandı.",
                )
              }
              options={densityOptions}
              value={settings.density}
            />
          </div>
          <div>
            <p className="app-muted mb-2 text-[11px] font-medium">
              Kart ve Köşe Stili
            </p>
            <SegmentedControl<AppCardStyle>
              ariaLabel="Kart ve köşe stili"
              className="grid-cols-2 sm:grid-cols-5"
              onChange={(cardStyle) =>
                void saveAppearance(
                  "card-style",
                  { card_style: cardStyle },
                  "Kart stili uygulandı.",
                )
              }
              options={cardStyleOptions}
              value={appearance.card_style}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="app-muted mb-2 flex items-center gap-2 text-[11px] font-medium">
                <Sparkles className="size-3.5" />
                Animasyonlar
              </p>
              <SegmentedControl
                ariaLabel="Animasyon düzeyi"
                className="grid-cols-2 sm:grid-cols-2"
                onChange={(value) =>
                  void onSave(
                    "motion",
                    { reduce_motion: value === "reduced" },
                    "Animasyon tercihi uygulandı.",
                  )
                }
                options={motionOptions}
                value={settings.reduce_motion ? "reduced" : "normal"}
              />
            </div>
            <div>
              <p className="app-muted mb-2 flex items-center gap-2 text-[11px] font-medium">
                <PanelLeft className="size-3.5" />
                Kenar Çubuğu
              </p>
              <SegmentedControl<SidebarMode>
                ariaLabel="Kenar çubuğu görünümü"
                className="grid-cols-2 sm:grid-cols-2"
                onChange={(sidebarMode) =>
                  void onSave(
                    "sidebar",
                    { sidebar_mode: sidebarMode },
                    "Kenar çubuğu görünümü uygulandı.",
                  )
                }
                options={sidebarOptions}
                value={settings.sidebar_mode}
              />
            </div>
          </div>
        </div>
      </div>

    </SettingsSection>
  );
}
