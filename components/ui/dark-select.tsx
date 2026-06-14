"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DarkSelectOption {
  label: string;
  value: string;
}

interface DarkSelectProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  onChange: (value: string) => void;
  options: DarkSelectOption[];
  value: string;
}

export function DarkSelect({
  ariaLabel,
  className,
  disabled = false,
  icon: Icon,
  onChange,
  options,
  value,
}: DarkSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative min-w-0 max-w-full", className)} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="app-select flex h-10 w-full min-w-0 max-w-full items-center gap-2 rounded-[10px] border px-2.5 text-left text-xs outline-none transition focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {Icon ? <Icon className="app-muted size-3.5 shrink-0" /> : null}
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? "Seçim yap"}
        </span>
        <ChevronDown
          className={cn(
            "app-muted size-3.5 shrink-0 transition",
            isOpen && "app-primary rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div
          className="app-select-menu absolute inset-x-0 top-full z-[120] mt-1.5 max-h-56 min-w-full max-w-full overflow-x-hidden overflow-y-auto rounded-lg border p-1 shadow-[0_20px_55px_rgba(0,0,0,0.45)]"
          id={listboxId}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  "app-select-option flex w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition",
                  isSelected && "app-select-option-active",
                )}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected ? (
                  <Check className="app-primary size-3.5 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
