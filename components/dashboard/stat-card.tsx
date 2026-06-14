import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { StatItem } from "@/types";

interface StatCardProps {
  item: StatItem;
}

export function StatCard({ item }: StatCardProps) {
  const Icon = item.icon;
  const isWideValue = item.value.length > 4;

  return (
    <Card className="group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] sm:p-5">
      <div className="absolute -right-10 -top-10 size-28 rounded-full bg-[color-mix(in_srgb,var(--primary)_7%,transparent)] blur-2xl transition group-hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="app-muted text-xs font-medium">{item.title}</p>
          <p
            className={`app-text mt-3 font-mono font-semibold tracking-tight ${
              isWideValue ? "text-2xl sm:text-[28px]" : "text-3xl"
            }`}
          >
            {item.value}
          </p>
        </div>
        <span className="app-surface-2 app-primary flex size-10 items-center justify-center rounded-xl border">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p className="app-muted truncate text-[11px]">{item.description}</p>
        {item.trend ? (
          <span className="app-muted flex shrink-0 items-center gap-1 text-[10px] font-medium">
            {item.trend}
            <ArrowUpRight className="app-primary size-3" />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
