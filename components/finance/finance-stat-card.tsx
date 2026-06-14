import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FinanceStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "default" | "danger" | "warning";
}

export function FinanceStatCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "default",
}: FinanceStatCardProps) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-500/10 text-rose-400"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-violet-500/10 app-primary";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-muted text-[10px] font-semibold uppercase tracking-[0.16em]">
            {label}
          </p>
          <p className="app-text mt-2 text-xl font-semibold tracking-tight">
            {value}
          </p>
          <p className="app-muted mt-1 text-[11px]">{description}</p>
        </div>
        <span className={`flex size-9 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="size-[17px]" />
        </span>
      </div>
    </Card>
  );
}
