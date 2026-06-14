"use client";

import { Check } from "lucide-react";
import type { ThemeDefinition } from "@/lib/settings/themes";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  isActive: boolean;
  onSelect: () => void;
  theme: ThemeDefinition;
}

export function ThemeCard({
  isActive,
  onSelect,
  theme,
}: ThemeCardProps) {
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
        "app-theme-card relative rounded-xl border p-4 text-left transition",
        isActive && "app-theme-card-active",
      )}
      onClick={onSelect}
      type="button"
    >
      {isActive ? (
        <span className="app-primary-bg absolute right-3 top-3 flex size-6 items-center justify-center rounded-full">
          <Check className="size-3.5" />
        </span>
      ) : null}
      <div
        className="h-16 rounded-xl border p-2"
        style={{
          background: theme.colors.background,
          borderColor: theme.colors.border,
        }}
        >
          <div
            className="h-full rounded-lg"
            style={{ background: theme.colors.surface }}
          />
        </div>
      <p className="app-text mt-3 text-sm font-semibold">{theme.name}</p>
      <p className="app-muted mt-1 text-[11px] leading-5">
        {theme.mode === "light" ? "Açık tema" : "Koyu tema"} ·{" "}
        {theme.category === "premium"
          ? "Premium"
          : theme.category === "colorful"
            ? "Renkli"
            : theme.category === "light"
              ? "Açık"
              : "Sade"}
      </p>
      <div className="mt-3 flex gap-1.5">
        {previewColors.map((color) => (
          <span
            className="size-4 rounded-full border border-black/10"
            key={color}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}
