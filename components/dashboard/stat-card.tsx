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
    <Card className="group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] sm:p-5">
      <div className="absolute -right-10 -top-10 size-28 rounded-full bg-violet-500/[0.06] blur-2xl transition group-hover:bg-violet-500/[0.1]" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{item.title}</p>
          <p
            className={`mt-3 font-mono font-semibold tracking-tight text-zinc-100 ${
              isWideValue ? "text-2xl sm:text-[28px]" : "text-3xl"
            }`}
          >
            {item.value}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-violet-400">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p className="truncate text-[11px] text-zinc-600">{item.description}</p>
        {item.trend ? (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-zinc-400">
            {item.trend}
            <ArrowUpRight className="size-3 text-violet-400" />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
