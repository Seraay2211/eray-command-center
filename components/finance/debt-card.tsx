"use client";

import { CalendarClock, CreditCard, Pencil, Trash2 } from "lucide-react";
import { DebtPriorityBadge, DebtStatusBadge } from "@/components/finance/debt-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTRY } from "@/lib/utils/currency";
import type { Debt } from "@/types";

interface DebtCardProps {
  debt: Debt;
  isSelected: boolean;
  onDelete: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onPayment: (debt: Debt) => void;
  onSelect: (debt: Debt) => void;
}

export function DebtCard({
  debt,
  isSelected,
  onDelete,
  onEdit,
  onPayment,
  onSelect,
}: DebtCardProps) {
  const remaining = Math.max(debt.total_amount - debt.paid_amount, 0);
  const progress =
    debt.total_amount > 0
      ? Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
      : 0;

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
          <DebtStatusBadge dueDate={debt.due_date} status={debt.status} />
          <DebtPriorityBadge priority={debt.priority} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs min-[440px]:grid-cols-3">
        <div>
          <p className="app-muted text-[10px]">Toplam</p>
          <p className="app-text mt-1 font-medium">{formatTRY(debt.total_amount)}</p>
        </div>
        <div>
          <p className="app-muted text-[10px]">Ödenen</p>
          <p className="mt-1 font-medium text-emerald-400">{formatTRY(debt.paid_amount)}</p>
        </div>
        <div>
          <p className="app-muted text-[10px]">Kalan</p>
          <p className="app-text mt-1 font-semibold">{formatTRY(remaining)}</p>
        </div>
      </div>

      <div className="app-surface-2 mt-4 h-1.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="app-muted mt-3 flex items-center gap-2 text-[11px]">
        <CalendarClock className="size-3.5" />
        {debt.due_date
          ? `Son ödeme: ${new Intl.DateTimeFormat("tr-TR").format(new Date(`${debt.due_date}T00:00:00`))}`
          : "Son ödeme tarihi yok"}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" onClick={(event) => event.stopPropagation()}>
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
