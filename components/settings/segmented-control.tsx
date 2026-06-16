"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  value: T;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  disabled,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "app-surface app-border grid min-w-0 grid-cols-2 gap-1 rounded-xl border p-1 sm:grid-cols-3",
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            aria-pressed={isActive}
            className={cn(
              "min-h-9 min-w-0 rounded-lg px-2 py-2 text-[11px] font-medium leading-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-45",
              isActive
                ? "app-primary-bg shadow-sm"
                : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
