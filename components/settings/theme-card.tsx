"use client";

import { Check } from "lucide-react";
import type { ThemeDefinition } from "@/lib/settings/themes";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  isActive: boolean;
  onSelect: () => void;
  theme: ThemeDefinition;
}

export function ThemeCard({ isActive, onSelect, theme }: ThemeCardProps) {
  const previewColors = [
    theme.colors.background,
    theme.colors.surface,
    theme.colors.primary,
    theme.colors.success,
    theme.colors.warning,
  ];

  return (
    <button
      aria-pressed={isActive}
      className={cn(
        "app-theme-card relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        isActive && "app-theme-card-active",
      )}
      onClick={onSelect}
      type="button"
    >
      {isActive ? (
        <span className="app-primary-bg absolute right-2.5 top-2.5 z-10 flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      ) : null}

      <div
        className="flex h-8 overflow-hidden rounded-lg border"
        style={{ borderColor: theme.colors.border }}
      >
        <span
          className="h-full w-[44%]"
          style={{ background: theme.colors.background }}
        />
        <span
          className="h-full w-[36%]"
          style={{ background: theme.colors.surface }}
        />
        <span
          className="h-full flex-1"
          style={{ background: theme.colors.primary }}
        />
      </div>

      <div className="mt-2.5 min-w-0 flex-1 pr-5">
        <p className="app-text truncate text-sm font-semibold">{theme.name}</p>
        <p className="app-muted mt-1 text-[10px] leading-4">
          {theme.mode === "light" ? "Açık tema" : "Koyu tema"} ·{" "}
          {theme.category === "premium"
            ? "Premium"
            : theme.category === "colorful"
              ? "Renkli"
              : theme.category === "light"
                ? "Açık"
                : "Sade"}
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        {previewColors.map((color) => (
          <span
            className="size-3.5 rounded-full border border-black/10"
            key={color}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}
