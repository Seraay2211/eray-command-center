import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/types";

interface QuickActionCardProps {
  action: QuickAction;
}

const accentStyles: Record<QuickAction["accent"], string> = {
  violet:
    "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]",
  blue:
    "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]",
  amber:
    "bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_25%,var(--border))]",
  emerald:
    "bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_25%,var(--border))]",
};

export function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon;

  return (
    <Link
      className="block h-full w-full text-left"
      data-dashboard-section={action.href.startsWith("/ai") ? "ai" : undefined}
      href={action.href}
    >
      <Card className="group h-full p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] hover:bg-[var(--surface-2)]">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
              accentStyles[action.accent],
            )}
          >
            <Icon className="size-4" />
          </span>
          <ArrowUpRight className="app-muted size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
        </div>
        <h3 className="app-text mt-5 text-sm font-semibold">
          {action.title}
        </h3>
        <p className="app-muted mt-1.5 text-xs leading-5">
          {action.description}
        </p>
        {action.statusLabel ? (
          <span className="app-surface-2 app-muted mt-3 inline-flex rounded-full border px-2 py-1 text-[10px] font-medium">
            {action.statusLabel}
          </span>
        ) : null}
      </Card>
    </Link>
  );
}
