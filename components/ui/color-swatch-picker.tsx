"use client";

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

export const COLOR_SWATCHES = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#64748b",
] as const;

interface ColorSwatchPickerProps {
  allowCustom?: boolean;
  label?: string;
  onChange: (value: string) => void;
  value: string;
}

export function ColorSwatchPicker({
  allowCustom = true,
  label,
  onChange,
  value,
}: ColorSwatchPickerProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const normalizedValue = value.toLowerCase();
  const isCustom = !COLOR_SWATCHES.includes(
    normalizedValue as (typeof COLOR_SWATCHES)[number],
  );

  return (
    <fieldset className="min-w-0 max-w-full">
      {label ? (
        <legend className="app-muted mb-2 text-xs font-medium">{label}</legend>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {COLOR_SWATCHES.map((color) => {
          const selected = normalizedValue === color;

          return (
            <button
              aria-label={`${color} rengini seç`}
              aria-pressed={selected}
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                selected
                  ? "border-[var(--text)] shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--primary)]"
                  : "border-[var(--border)]",
              )}
              key={color}
              onClick={() => onChange(color)}
              style={{ backgroundColor: color }}
              type="button"
            >
              {selected ? (
                <Check className="size-4 text-white" strokeWidth={3} />
              ) : null}
            </button>
          );
        })}

        {allowCustom ? (
          <button
            aria-expanded={isCustomOpen}
            className={cn(
              "app-control inline-flex h-8 min-w-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition",
              isCustom && "ring-2 ring-[var(--primary)]",
            )}
            onClick={() => setIsCustomOpen((current) => !current)}
            type="button"
          >
            <Pipette className="size-3.5 shrink-0" />
            <span className="truncate">Özel renk</span>
          </button>
        ) : null}
      </div>

      {allowCustom && isCustomOpen ? (
        <label className="app-muted mt-3 flex max-w-xs items-center gap-3 text-xs">
          <span className="shrink-0">Renk seç</span>
          <input
            className="app-input h-9 min-w-0 flex-1 cursor-pointer rounded-lg border px-1.5"
            onChange={(event) => onChange(event.target.value)}
            type="color"
            value={value}
          />
        </label>
      ) : null}
    </fieldset>
  );
}
