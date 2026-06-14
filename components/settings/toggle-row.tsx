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
    <div className="app-surface-2 app-border flex items-center justify-between gap-5 rounded-xl border px-4 py-3">
      <div>
        <p className="app-text text-sm font-medium">{label}</p>
        <p className="app-muted mt-1 text-[11px] leading-5">{description}</p>
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
