"use client";

import { CircleDollarSign, Plus, Sparkles, WalletCards } from "lucide-react";
import { FinanceExportButton } from "@/components/finance/finance-export-button";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { formatSensitiveTRY } from "@/lib/privacy";
import type { FinanceStats } from "@/types";

interface FinanceCommandHeroProps {
  onError: (message: string) => void;
  onOpenAi: () => void;
  onOpenNew: () => void;
  stats: FinanceStats;
}

export function FinanceCommandHero({
  onError,
  onOpenAi,
  onOpenNew,
  stats,
}: FinanceCommandHeroProps) {
  const { settings } = useSettings();
  const metrics = [
    { label: "Toplam Borç", value: formatSensitiveTRY(stats.totalDebt, settings) },
    { label: "Ödenen", value: formatSensitiveTRY(stats.totalPaid, settings) },
    { label: "Kalan", value: formatSensitiveTRY(stats.remainingDebt, settings) },
    { label: "Bu Ay", value: formatSensitiveTRY(stats.dueThisMonth, settings) },
  ];

  return (
    <section className="app-visual-hero relative overflow-hidden rounded-[2rem] border p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_68%)] blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="app-primary mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <CircleDollarSign className="size-4" />
              Finans Komuta Merkezi
            </div>
            <h1 className="app-text text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Borç ve ödeme planın tek bakışta.
            </h1>
            <p className="app-muted mt-3 max-w-xl text-sm leading-6">
              Yaklaşan vadeleri, taksitleri ve ödeme ilerlemeni sakin bir akışta takip et.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 xl:w-auto">
            <FinanceExportButton onError={onError} />
            <Button onClick={onOpenAi} variant="secondary">
              <Sparkles className="size-4" /> Finans Özeti
            </Button>
            <Button onClick={onOpenNew}>
              <Plus className="size-4" /> Yeni Borç
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              className="app-elevated min-w-0 rounded-2xl border p-4"
              key={metric.label}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="app-muted text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {metric.label}
                </p>
                {index === 2 ? <WalletCards className="app-primary size-4" /> : null}
              </div>
              <p className="app-text mt-2 truncate text-xl font-semibold tracking-tight">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {stats.overdueCount > 0 || stats.criticalCount > 0 ? (
          <p className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] px-4 py-3 text-xs text-[var(--danger)]">
            {stats.overdueCount} geciken ve {stats.criticalCount} kritik kayıt yakın takip bekliyor.
          </p>
        ) : (
          <p className="app-muted mt-4 text-xs">Finans akışında şu anda kritik bir uyarı görünmüyor.</p>
        )}
      </div>
    </section>
  );
}
