import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  ListChecks,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardPriorityItem } from "@/types";

interface PriorityListProps {
  items: DashboardPriorityItem[];
}

const sourceConfig = {
  task: { icon: CheckSquare2, label: "Görev" },
  finance: { icon: CircleDollarSign, label: "Finans" },
  calendar: { icon: CalendarDays, label: "Takvim" },
} as const;

export function PriorityList({ items }: PriorityListProps) {
  return (
    <Card className="h-full p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="app-primary-bg flex size-9 items-center justify-center rounded-xl">
          <ListChecks className="size-4" />
        </span>
        <div>
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
            Odak Alanı
          </p>
          <h2 className="app-text mt-1 text-base font-semibold">
            Bugünün Öncelikleri
          </h2>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const config = sourceConfig[item.source];
            const Icon = config.icon;
            return (
              <Link
                className="app-surface-2 group flex items-start gap-3 rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                href={item.href}
                key={item.id}
              >
                <span className="app-primary flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))]">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="app-muted text-[9px] font-semibold uppercase tracking-[0.12em]">
                      {config.label}
                    </span>
                    {item.priority === "critical" ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-2 py-0.5 text-[9px] font-semibold text-[var(--danger)]">
                        Kritik
                      </span>
                    ) : null}
                  </div>
                  <p className="app-text mt-1 truncate text-xs font-semibold">
                    {item.title}
                  </p>
                  <p className="app-muted mt-1 line-clamp-2 text-[11px] leading-5">
                    {item.description}
                  </p>
                </div>
                <ArrowUpRight className="app-muted mt-1 size-3.5 shrink-0 transition group-hover:text-[var(--primary)]" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5 text-center">
          <CheckSquare2 className="mx-auto size-5 text-[var(--success)]" />
          <p className="app-text mt-3 text-sm font-semibold">
            Kritik öncelik görünmüyor
          </p>
          <p className="app-muted mt-1 text-xs leading-5">
            Yeni görev veya plan eklediğinde öncelik sırasına göre burada
            görünecek.
          </p>
        </div>
      )}
    </Card>
  );
}
