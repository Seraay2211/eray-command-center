"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { getInstallmentDisplayStatus } from "@/lib/finance/installments";
import { formatSensitiveTRY } from "@/lib/privacy";
import { parseMoneyInput } from "@/lib/utils/currency";
import type { Debt, DebtInstallment, DebtPriority } from "@/types";

interface SmartFinancePlanProps {
  debts: Debt[];
  installments: DebtInstallment[];
  onInspect: (debtId: string) => void;
  onOpenAi: () => void;
}

interface FinancePlanItem {
  amount: number;
  debtId: string;
  dueDate: string | null;
  id: string;
  priority: DebtPriority;
  rank: number;
  status: "Gecikti" | "Bugün" | "Yakında" | "Kritik";
  title: string;
}

const priorityWeight: Record<DebtPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00+03:00`);
  return getIstanbulDateKey(new Date(date.getTime() + days * 86_400_000));
}

function formatDate(value: string | null): string {
  if (!value) return "Tarih belirlenmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+03:00`));
}

function getDateState(
  dueDate: string | null,
  today: string,
  weekEnd: string,
): Pick<FinancePlanItem, "rank" | "status"> | null {
  if (!dueDate) return null;
  if (dueDate < today) return { rank: 1, status: "Gecikti" };
  if (dueDate === today) return { rank: 2, status: "Bugün" };
  if (dueDate <= weekEnd) return { rank: 3, status: "Yakında" };
  return null;
}

function getStatusClass(status: FinancePlanItem["status"]): string {
  if (status === "Gecikti") {
    return "border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] text-[var(--danger)]";
  }
  if (status === "Bugün" || status === "Kritik") {
    return "border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] text-[var(--warning)]";
  }
  return "app-border app-surface app-muted";
}

export function SmartFinancePlan({
  debts,
  installments,
  onInspect,
  onOpenAi,
}: SmartFinancePlanProps) {
  const { settings } = useSettings();
  const [availableCash, setAvailableCash] = useState("");
  const plan = useMemo(() => {
    const today = getIstanbulDateKey();
    const weekEnd = addDays(today, 7);
    const debtById = new Map(debts.map((debt) => [debt.id, debt]));
    const openInstallments = installments.filter(
      (installment) =>
        getInstallmentDisplayStatus(installment) !== "paid" &&
        installment.expected_amount - installment.paid_amount > 0,
    );
    const installmentDebtIds = new Set(
      openInstallments.map((installment) => installment.debt_id),
    );
    const datedItems: FinancePlanItem[] = [];

    openInstallments.forEach((installment) => {
      const dateState = getDateState(installment.due_date, today, weekEnd);
      if (!dateState) return;
      const debt = debtById.get(installment.debt_id);
      datedItems.push({
        amount: Math.max(
          installment.expected_amount - installment.paid_amount,
          0,
        ),
        debtId: installment.debt_id,
        dueDate: installment.due_date,
        id: `installment-${installment.id}`,
        priority: debt?.priority ?? "medium",
        rank: dateState.rank,
        status: dateState.status,
        title: `${debt?.title ?? "Taksit ödemesi"} · ${installment.installment_no}. taksit`,
      });
    });

    const openDebts = debts.filter(
      (debt) =>
        debt.status !== "paid" &&
        debt.status !== "cancelled" &&
        Math.max(debt.total_amount - debt.paid_amount, 0) > 0,
    );
    openDebts.forEach((debt) => {
      if (installmentDebtIds.has(debt.id)) return;
      const dateState = getDateState(debt.due_date, today, weekEnd);
      if (!dateState && debt.status !== "overdue") return;
      datedItems.push({
        amount: Math.max(debt.total_amount - debt.paid_amount, 0),
        debtId: debt.id,
        dueDate: debt.due_date,
        id: `debt-${debt.id}`,
        priority: debt.priority,
        rank: debt.status === "overdue" ? 1 : (dateState?.rank ?? 5),
        status:
          debt.status === "overdue"
            ? "Gecikti"
            : (dateState?.status ?? "Yakında"),
        title: debt.title,
      });
    });

    datedItems.sort(
      (left, right) =>
        left.rank - right.rank ||
        (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999") ||
        priorityWeight[right.priority] - priorityWeight[left.priority] ||
        right.amount - left.amount,
    );

    const criticalFallback = openDebts
      .filter((debt) => debt.priority === "critical")
      .sort(
        (left, right) =>
          right.total_amount - right.paid_amount -
          (left.total_amount - left.paid_amount),
      )[0];
    const fallbackItem: FinancePlanItem | null = criticalFallback
      ? {
          amount: Math.max(
            criticalFallback.total_amount - criticalFallback.paid_amount,
            0,
          ),
          debtId: criticalFallback.id,
          dueDate: criticalFallback.due_date,
          id: `critical-${criticalFallback.id}`,
          priority: criticalFallback.priority,
          rank: 4,
          status: "Kritik",
          title: criticalFallback.title,
        }
      : null;
    const priorityItem = datedItems[0] ?? fallbackItem;
    const overdueCount = datedItems.filter((item) => item.rank === 1).length;
    const weeklyItems = datedItems.slice(0, 5);
    const weeklyCount = datedItems.length;
    const pressure =
      overdueCount >= 3 || (overdueCount > 0 && weeklyCount >= 5)
        ? "Kritik"
        : overdueCount > 0 || weeklyCount >= 5
          ? "Yüksek"
          : weeklyCount > 0 || criticalFallback
            ? "Orta"
            : "Düşük";
    const suggestion =
      overdueCount > 0
        ? "Önce gecikmiş ödemeleri kapatman daha güvenli olur."
        : weeklyCount === 0
          ? "Bu hafta ödeme baskısı düşük görünüyor."
          : "Yaklaşan ödemeler için kayıtlarını güncel tut.";

    return {
      overdueCount,
      pressure,
      priorityItem,
      suggestion,
      weeklyCount,
      weeklyItems,
    };
  }, [debts, installments]);
  const cashValue = parseMoneyInput(availableCash);
  const priorityAmount = plan.priorityItem?.amount ?? 0;
  const missingAmount = Math.max(priorityAmount - cashValue, 0);
  const canCoverPriority = priorityAmount > 0 && cashValue >= priorityAmount;

  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_70%)] blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
              <CircleDollarSign className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
                Finans Kontrolü
              </p>
              <h2 className="app-text mt-1 text-lg font-semibold">
                Akıllı Finans Planı
              </h2>
              <p className="app-muted mt-1 text-xs leading-5">
                Ödemelerini öncelik ve risk durumuna göre hızlıca değerlendir.
              </p>
            </div>
          </div>
          <Button className="w-full sm:w-auto" onClick={onOpenAi} size="sm" variant="secondary">
            <Sparkles className="size-4" />
            AI ile Finansımı Yorumla
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="app-surface-2 rounded-xl border p-3">
            <p className="app-muted text-[10px]">Borç baskısı</p>
            <p className="app-text mt-1 text-sm font-semibold">{plan.pressure}</p>
          </div>
          <div className="app-surface-2 rounded-xl border p-3">
            <p className="app-muted text-[10px]">Geciken ödeme</p>
            <p className="app-text mt-1 text-sm font-semibold">
              {plan.overdueCount}
            </p>
          </div>
          <div className="app-surface-2 rounded-xl border p-3">
            <p className="app-muted text-[10px]">Bu hafta</p>
            <p className="app-text mt-1 text-sm font-semibold">
              {plan.weeklyCount} ödeme
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
          <div className="app-surface-2 min-w-0 rounded-2xl border p-3.5">
            <div className="flex items-center gap-2">
              <WalletCards className="app-primary size-4" />
              <h3 className="app-text text-sm font-semibold">Öncelikli Ödeme</h3>
            </div>
            {plan.priorityItem ? (
              <div className="app-surface mt-3 min-w-0 rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${getStatusClass(plan.priorityItem.status)}`}>
                    {plan.priorityItem.status}
                  </span>
                  <span className="app-muted text-[10px]">
                    {formatDate(plan.priorityItem.dueDate)}
                  </span>
                </div>
                <p className="app-text mt-2 truncate text-sm font-semibold">
                  {plan.priorityItem.title}
                </p>
                <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <p className="app-text text-sm font-semibold">
                    {formatSensitiveTRY(plan.priorityItem.amount, settings)}
                  </p>
                  <Button
                    className="w-full min-[420px]:w-auto"
                    onClick={() => onInspect(plan.priorityItem!.debtId)}
                    size="sm"
                    variant="secondary"
                  >
                    İncele
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="app-surface mt-3 rounded-xl border border-dashed p-4 text-center">
                <p className="app-text text-xs font-semibold">
                  Acil ödeme görünmüyor
                </p>
                <p className="app-muted mt-1 text-[10px]">
                  Yeni bir vade yaklaştığında burada öne çıkarılacak.
                </p>
              </div>
            )}
            <p className="app-muted mt-3 text-xs leading-5">{plan.suggestion}</p>
          </div>

          <div className="app-surface-2 min-w-0 rounded-2xl border p-3.5">
            <div className="flex items-center gap-2">
              <CalendarClock className="app-primary size-4" />
              <h3 className="app-text text-sm font-semibold">Bu Hafta</h3>
            </div>
            {plan.weeklyItems.length > 0 ? (
              <div className="mt-3 space-y-2">
                {plan.weeklyItems.map((item) => (
                  <button
                    className="app-surface flex w-full min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                    key={item.id}
                    onClick={() => onInspect(item.debtId)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="app-text block truncate text-[11px] font-semibold">
                        {item.title}
                      </span>
                      <span className="app-muted mt-1 block text-[9px]">
                        {formatDate(item.dueDate)} · {item.status}
                      </span>
                    </span>
                    <span className="app-text shrink-0 text-[10px] font-semibold">
                      {formatSensitiveTRY(item.amount, settings)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="app-muted mt-3 rounded-xl border border-dashed p-4 text-center text-xs leading-5">
                Bu hafta için planlanmış ödeme görünmüyor.
              </p>
            )}
          </div>
        </div>

        <div className="app-surface-2 rounded-2xl border p-3.5">
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-end">
            <label className="min-w-0">
              <span className="app-text text-xs font-semibold">Elimdeki Para</span>
              <input
                className="app-input mt-2 w-full"
                inputMode="decimal"
                onChange={(event) => setAvailableCash(event.target.value)}
                placeholder="Örn. 15.000,00"
                type="text"
                value={availableCash}
              />
            </label>
            <div className="app-surface min-w-0 rounded-xl border p-3">
              {cashValue > 0 && plan.priorityItem ? (
                <>
                  <p className="app-text text-xs font-semibold">
                    {canCoverPriority
                      ? `${plan.priorityItem.title} tamamen karşılanabilir.`
                      : `${plan.priorityItem.title} için tutar henüz yeterli değil.`}
                  </p>
                  <p className="app-muted mt-1 text-[10px] leading-5">
                    {canCoverPriority
                      ? "Elindeki tutar en acil ödemeyi karşılamaya yetiyor."
                      : `Eksik kalan tutar: ${formatSensitiveTRY(missingAmount, settings)}. Önce bu ödeme için tutarı tamamlamayı değerlendir.`}
                  </p>
                </>
              ) : (
                <p className="app-muted text-xs leading-5">
                  Bir tutar girerek öncelikli ödemeyi karşılayıp karşılamadığını görebilirsin. Bu bilgi kaydedilmez.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
