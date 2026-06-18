"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  ShieldAlert,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFinanceDate } from "@/lib/finance/installments";
import { formatSensitiveTRY } from "@/lib/privacy";
import type { FinanceDashboardSummary } from "@/types";

interface FinanceRadarProps {
  summary: FinanceDashboardSummary;
}

function formatPaymentDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function FinanceRadar({ summary }: FinanceRadarProps) {
  const { settings } = useSettings();

  return (
    <Card className="h-full p-4 sm:p-5" data-dashboard-section="finance">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="app-primary-bg flex size-9 items-center justify-center rounded-xl">
            <CircleDollarSign className="size-4" />
          </span>
          <div>
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              Finans Mini Radar
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              Borç ve Ödeme Durumu
            </h2>
          </div>
        </div>
        <Link
          className={buttonClassName({ size: "sm", variant: "secondary" })}
          href="/finance"
        >
          Finans&apos;a Git
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {summary.available ? (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="app-surface-2 rounded-xl border p-3">
              <CreditCard className="app-primary size-4" />
              <p className="app-muted mt-2 text-[10px]">Toplam Kalan Borç</p>
              <p className="app-text mt-1 text-lg font-semibold">
                {formatSensitiveTRY(summary.remainingDebt, settings)}
              </p>
            </div>
            <div className="app-surface-2 rounded-xl border p-3">
              <ReceiptText className="app-primary size-4" />
              <p className="app-muted mt-2 text-[10px]">Bu Ay Ödenecek</p>
              <p className="app-text mt-1 text-lg font-semibold">
                {formatSensitiveTRY(summary.dueThisMonth, settings)}
              </p>
            </div>
            <div className="app-surface-2 rounded-xl border p-3">
              <AlertTriangle className="size-4 text-[var(--warning)]" />
              <p className="app-muted mt-2 text-[10px]">Geciken Borç</p>
              <p className="app-text mt-1 text-lg font-semibold">
                {summary.overdueCount}
              </p>
            </div>
            <div className="app-surface-2 rounded-xl border p-3">
              <ShieldAlert className="size-4 text-[var(--danger)]" />
              <p className="app-muted mt-2 text-[10px]">Kritik Borç</p>
              <p className="app-text mt-1 text-lg font-semibold">
                {summary.criticalCount}
              </p>
            </div>
          </div>
          <div className="app-surface-2 mt-3 rounded-xl border p-3">
            <p className="app-muted text-[10px]">Son Ödeme</p>
            {summary.lastPayment ? (
              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="app-text text-sm font-semibold">
                  {formatSensitiveTRY(summary.lastPayment.amount, settings)}
                </p>
                <p className="app-muted text-[10px]">
                  {formatPaymentDate(summary.lastPayment.date)}
                  {summary.lastPayment.method
                    ? ` · ${summary.lastPayment.method}`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="app-muted mt-1 text-xs">
                Henüz ödeme kaydı bulunmuyor.
              </p>
            )}
          </div>
          {summary.installmentsAvailable &&
          summary.upcomingInstallments.length > 0 ? (
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="app-text text-xs font-semibold">
                  Yaklaşan Taksitler
                </p>
                <span className="app-muted text-[10px]">
                  {summary.dueTodayInstallmentCount} bugün ·{" "}
                  {summary.overdueInstallmentCount} geciken
                </span>
              </div>
              <div className="space-y-2">
                {summary.upcomingInstallments.map((installment) => (
                  <div
                    className="app-surface-2 rounded-xl border p-3"
                    key={installment.id}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="app-text truncate text-xs font-semibold">
                          {installment.debtTitle}
                        </p>
                        <p className="app-muted mt-1 text-[10px]">
                          {installment.installmentNo}. taksit ·{" "}
                          {formatFinanceDate(installment.dueDate)}
                        </p>
                      </div>
                      <p className="app-text shrink-0 text-xs font-semibold">
                        {formatSensitiveTRY(
                          Math.max(
                            installment.expectedAmount -
                              installment.paidAmount,
                            0,
                          ),
                          settings,
                        )}
                      </p>
                    </div>
                    <Link
                      className={buttonClassName({
                        className: "mt-2 w-full",
                        size: "sm",
                        variant: "secondary",
                      })}
                      href={`/finance?debt=${encodeURIComponent(
                        installment.debtId,
                      )}&installment=${encodeURIComponent(installment.id)}`}
                    >
                      Taksit Ödendi
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5 text-center">
          <p className="app-text text-sm font-semibold">
            Finans verileri kullanılamıyor
          </p>
          <p className="app-muted mt-1 text-xs leading-5">
            Finans kurulumu tamamlandığında borç ve ödeme radarın burada
            görünecek.
          </p>
        </div>
      )}
    </Card>
  );
}
