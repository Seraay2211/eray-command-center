"use client";

import { Switch } from "@/components/ui/switch";

interface ToggleRowProps {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  checked,
  description,
  disabled,
  label,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="app-surface-2 app-border flex w-full min-w-0 max-w-full items-start justify-between gap-3 overflow-hidden rounded-xl border px-3 py-3 sm:items-center sm:gap-5 sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="app-text text-sm font-medium [overflow-wrap:anywhere]">
          {label}
        </p>
        <p className="app-muted mt-1 break-words text-[11px] leading-5 [overflow-wrap:anywhere]">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        label={label}
        onChange={onChange}
      />
    </div>
  );
}
