"use client";

import { Check } from "lucide-react";
import { memo } from "react";
import {
  getThemePreviewColors,
  getThemeTags,
  type ThemeDefinition,
  type ThemeTag,
} from "@/lib/settings/themes";
import { cn } from "@/lib/utils";
import type { AppTheme } from "@/types";

interface ThemeCardProps {
  isActive: boolean;
  onSelect: (themeId: AppTheme) => void;
  theme: ThemeDefinition;
}

export const ThemeCard = memo(function ThemeCard({
  isActive,
  onSelect,
  theme,
}: ThemeCardProps) {
  const previewColors = getThemePreviewColors(theme);
  const tags = getThemeTags(theme);
  const tagLabels: Record<ThemeTag, string> = {
    dark: "Koyu",
    light: "Açık",
    colorful: "Renkli",
    premium: "Premium",
    simple: "Sade",
    focus: "Odak",
    finance: "Finans",
  };

  return (
    <button
      aria-pressed={isActive}
      className={cn(
        "app-theme-card relative flex h-full min-h-48 min-w-0 flex-col overflow-hidden rounded-2xl border p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-xl",
        isActive && "app-theme-card-active",
      )}
      onClick={() => onSelect(theme.id)}
      type="button"
    >
      {isActive ? (
        <span className="app-primary-bg absolute right-2.5 top-2.5 z-10 flex h-5 items-center gap-1 rounded-full px-1.5 text-[8px] font-semibold">
          <Check className="size-3" />
          Seçili
        </span>
      ) : null}

      <div
        className="relative h-20 overflow-hidden rounded-xl border p-2"
        style={{ background: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="flex h-full gap-2">
          <span className="w-5 rounded-md" style={{ background: theme.colors.surface2 }} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="h-2 w-2/3 rounded-full" style={{ background: theme.colors.primary }} />
            <span className="flex flex-1 gap-1.5">
              <span className="flex-1 rounded-md border" style={{ background: theme.colors.surface, borderColor: theme.colors.border }} />
              <span className="w-1/3 rounded-md" style={{ background: theme.colors.surface2 }} />
            </span>
          </span>
        </div>
      </div>

      <div className="mt-2.5 min-w-0 flex-1 pr-5">
        <p className="app-text truncate text-sm font-semibold">{theme.name}</p>
        <p className="app-muted mt-1 line-clamp-2 text-[10px] leading-4">
          {theme.description}
        </p>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              className="app-surface-2 app-border rounded-full border px-1.5 py-0.5 text-[9px] font-medium app-muted"
              key={tag}
            >
              {tagLabels[tag]}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-1">
          {previewColors.map((color) => (
            <span
              className="size-3 rounded-full border border-black/10"
              key={color}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </button>
  );
});
