"use client";

import { CalendarClock, CreditCard, Pencil, Trash2 } from "lucide-react";
import {
  DebtPriorityBadge,
  DebtStatusBadge,
  getDebtDueTimingLabel,
} from "@/components/finance/debt-badges";
import { InstallmentStatusBadge } from "@/components/finance/installment-status-badge";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatFinanceDate,
  getInstallmentDisplayStatus,
  getNextOpenInstallment,
} from "@/lib/finance/installments";
import { formatSensitiveTRY } from "@/lib/privacy";
import type { Debt, DebtInstallment } from "@/types";

interface DebtCardProps {
  debt: Debt;
  isSelected: boolean;
  installments: DebtInstallment[];
  onDelete: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onPayment: (debt: Debt) => void;
  onInstallmentPayment: (debt: Debt, installment: DebtInstallment) => void;
  onSelect: (debt: Debt) => void;
}

export function DebtCard({
  debt,
  isSelected,
  installments,
  onDelete,
  onEdit,
  onPayment,
  onInstallmentPayment,
  onSelect,
}: DebtCardProps) {
  const { settings } = useSettings();
  const remaining = Math.max(debt.total_amount - debt.paid_amount, 0);
  const progress =
    debt.total_amount > 0
      ? Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
      : 0;
  const nextInstallment = getNextOpenInstallment(installments);
  const paidInstallmentCount = installments.filter(
    (item) => getInstallmentDisplayStatus(item) === "paid",
  ).length;

  return (
    <Card
      aria-pressed={isSelected}
      className={`cursor-pointer p-4 transition ${
        isSelected
          ? "border-[var(--primary)] shadow-[0_0_0_1px_var(--primary),0_18px_45px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
          : "hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]"
      }`}
      onClick={() => onSelect(debt)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(debt);
        }
      }}
      role="button"
      tabIndex={0}
    >
      {isSelected ? (
        <div className="app-primary mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <span className="size-1.5 rounded-full bg-[var(--primary)]" />
          Seçili borç
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="app-text truncate text-sm font-semibold">{debt.title}</p>
          <p className="app-muted mt-1 truncate text-xs">
            {debt.creditor || "Alacaklı / kurum belirtilmedi"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <DebtStatusBadge
            dueDate={debt.due_date}
            reminderDaysBefore={debt.reminder_days_before}
            status={debt.status}
          />
          <DebtPriorityBadge priority={debt.priority} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs min-[440px]:grid-cols-3">
        <div>
          <p className="app-muted text-[10px]">Toplam</p>
          <p className="app-text mt-1 font-medium">
            {formatSensitiveTRY(debt.total_amount, settings)}
          </p>
        </div>
        <div>
          <p className="app-muted text-[10px]">Ödenen</p>
          <p className="mt-1 font-medium text-[var(--finance-positive)]">
            {formatSensitiveTRY(debt.paid_amount, settings)}
          </p>
        </div>
        <div>
          <p className="app-muted text-[10px]">Kalan</p>
          <p className="app-text mt-1 font-semibold">
            {formatSensitiveTRY(remaining, settings)}
          </p>
        </div>
      </div>

      <div className="app-surface-2 mt-4 h-1.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="app-surface-2 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-3 text-[11px]">
        <CalendarClock className="size-3.5" />
        <span className="app-muted">
          {debt.due_date
            ? `Son ödeme: ${formatFinanceDate(debt.due_date)}`
            : "Son ödeme tarihi yok"}
        </span>
        <strong className="app-text font-semibold">
          {getDebtDueTimingLabel(debt.status, debt.due_date)}
        </strong>
      </div>

      {debt.is_installment ? (
        <div className="app-surface-2 mt-3 rounded-xl border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="app-text text-xs font-semibold">
              Taksit: {paidInstallmentCount} /{" "}
              {debt.installment_count ?? installments.length}
            </p>
            {nextInstallment ? (
              <InstallmentStatusBadge installment={nextInstallment} />
            ) : null}
          </div>
          <div className="app-muted mt-2 grid gap-1 text-[10px] min-[440px]:grid-cols-2">
            <span>
              Dönemlik ödeme:{" "}
              <strong className="app-text font-medium">
                {formatSensitiveTRY(
                  debt.installment_amount ??
                    nextInstallment?.expected_amount ??
                    0,
                  settings,
                )}
              </strong>
            </span>
            <span>
              Sonraki ödeme:{" "}
              <strong className="app-text font-medium">
                {nextInstallment
                  ? formatFinanceDate(nextInstallment.due_date)
                  : "Plan tamamlandı"}
              </strong>
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" onClick={(event) => event.stopPropagation()}>
        {nextInstallment ? (
          <Button
            className="col-span-2 w-full sm:w-auto"
            onClick={() => onInstallmentPayment(debt, nextInstallment)}
            size="sm"
          >
            <CreditCard className="size-3.5" />
            Taksit Ödendi
          </Button>
        ) : null}
        <Button className="w-full sm:w-auto" onClick={() => onPayment(debt)} size="sm">
          <CreditCard className="size-3.5" />
          Ödeme Ekle
        </Button>
        <Button className="w-full sm:w-auto" onClick={() => onEdit(debt)} size="sm" variant="secondary">
          <Pencil className="size-3.5" />
          Düzenle
        </Button>
        <Button className="col-span-2 w-full sm:w-auto" onClick={() => onDelete(debt)} size="sm" variant="ghost">
          <Trash2 className="size-3.5" />
          Sil
        </Button>
      </div>
    </Card>
  );
}
