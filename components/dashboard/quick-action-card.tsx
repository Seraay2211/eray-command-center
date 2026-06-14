import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/types";

interface QuickActionCardProps {
  action: QuickAction;
}

const accentStyles: Record<QuickAction["accent"], string> = {
  violet: "bg-violet-500/10 text-violet-300 border-violet-400/15",
  blue: "bg-blue-500/10 text-blue-300 border-blue-400/15",
  amber: "bg-amber-500/10 text-amber-300 border-amber-400/15",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/15",
};

export function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon;

  return (
    <Link
      className="block h-full w-full text-left"
      data-dashboard-section={action.href.startsWith("/ai") ? "ai" : undefined}
      href={action.href}
    >
      <Card className="group h-full p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-[#141418]">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
              accentStyles[action.accent],
            )}
          >
            <Icon className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-zinc-700 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-400" />
        </div>
        <h3 className="mt-5 text-sm font-semibold text-zinc-200">
          {action.title}
        </h3>
        <p className="mt-1.5 text-xs leading-5 text-zinc-600">
          {action.description}
        </p>
        {action.statusLabel ? (
          <span className="mt-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-zinc-500">
            {action.statusLabel}
          </span>
        ) : null}
      </Card>
    </Link>
  );
}
