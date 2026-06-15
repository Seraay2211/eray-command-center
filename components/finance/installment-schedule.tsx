"use client";

import { CreditCard } from "lucide-react";
import { InstallmentStatusBadge } from "@/components/finance/installment-status-badge";
import { Button } from "@/components/ui/button";
import {
  formatFinanceDate,
  getInstallmentDisplayStatus,
} from "@/lib/finance/installments";
import { formatTRY } from "@/lib/utils/currency";
import type { DebtInstallment } from "@/types";

interface InstallmentScheduleProps {
  installments: DebtInstallment[];
  onPayment: (installment: DebtInstallment) => void;
}

export function InstallmentSchedule({
  installments,
  onPayment,
}: InstallmentScheduleProps) {
  if (!installments.length) {
    return (
      <div className="app-surface-2 app-muted rounded-xl border border-dashed p-4 text-xs">
        Taksit planı henüz oluşturulmadı.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {installments.map((installment) => {
        const status = getInstallmentDisplayStatus(installment);

        return (
          <div
            className="app-surface-2 flex min-w-0 flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            key={installment.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="app-text text-xs font-semibold">
                  {String(installment.installment_no).padStart(2, "0")}. Taksit
                </p>
                <InstallmentStatusBadge installment={installment} />
              </div>
              <p className="app-muted mt-1 text-[11px]">
                {formatFinanceDate(installment.due_date)} · Beklenen{" "}
                {formatTRY(installment.expected_amount)}
              </p>
              {installment.paid_amount > 0 ? (
                <p className="mt-1 text-[11px] text-emerald-400">
                  Ödenen {formatTRY(installment.paid_amount)}
                </p>
              ) : null}
            </div>
            {status !== "paid" ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => onPayment(installment)}
                size="sm"
              >
                <CreditCard className="size-3.5" />
                Taksit Ödendi
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
