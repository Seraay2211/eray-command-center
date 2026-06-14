"use client";

import { Eye, FileCheck2, LoaderCircle, Trash2 } from "lucide-react";
import { FinanceAttachments } from "@/components/finance/finance-attachments";
import { formatTRY } from "@/lib/utils/currency";
import type { DebtPayment } from "@/types";

interface PaymentListProps {
  actionError: string;
  error: string;
  isDeleting: string;
  isLoading: boolean;
  onDelete: (payment: DebtPayment) => void;
  onDeleteReceipt: (payment: DebtPayment) => void;
  onViewReceipt: (payment: DebtPayment) => void;
  payments: DebtPayment[];
  receiptActionId: string;
}

export function PaymentList({
  actionError,
  error,
  isDeleting,
  isLoading,
  onDelete,
  onDeleteReceipt,
  onViewReceipt,
  payments,
  receiptActionId,
}: PaymentListProps) {
  if (isLoading) {
    return (
      <div className="app-muted flex items-center gap-2 py-6 text-xs">
        <LoaderCircle className="size-4 animate-spin" />
        Ödemeler yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-xs text-rose-300"
        role="alert"
      >
        {error}
      </div>
    );
  }
  if (!payments.length) {
    return (
      <div className="app-surface-2 app-muted rounded-xl border border-dashed p-4 text-xs">
        Henüz ödeme kaydı yok.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actionError ? (
        <div
          className="app-surface app-text rounded-xl border p-3 text-xs"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}
      {payments.map((payment) => (
        <div
          className="app-surface-2 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-start sm:justify-between"
          key={payment.id}
        >
          <div className="min-w-0 flex-1">
            <p className="app-text text-sm font-semibold">
              {formatTRY(payment.amount)}
            </p>
            <p className="app-muted mt-1 text-[11px]">
              {new Intl.DateTimeFormat("tr-TR").format(
                new Date(`${payment.payment_date}T00:00:00`),
              )}
              {payment.method ? ` · ${payment.method}` : ""}
            </p>
            {payment.note ? (
              <p className="app-muted mt-2 text-xs">{payment.note}</p>
            ) : null}
            {payment.receipt_path ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="app-surface app-text inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-medium">
                  <FileCheck2 className="app-primary size-3.5" />
                  Dekont var
                </span>
                <button
                  className="app-button-ghost flex h-7 items-center gap-1.5 rounded-lg px-2 text-[10px]"
                  disabled={receiptActionId === payment.id}
                  onClick={() => onViewReceipt(payment)}
                  type="button"
                >
                  {receiptActionId === payment.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  Dekontu Gör
                </button>
                <button
                  className="app-button-ghost flex h-7 items-center gap-1.5 rounded-lg px-2 text-[10px]"
                  disabled={receiptActionId === payment.id}
                  onClick={() => onDeleteReceipt(payment)}
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                  Dekontu Sil
                </button>
              </div>
            ) : null}
            <FinanceAttachments compact paymentId={payment.id} />
          </div>
          <button
            aria-label="Ödemeyi sil"
            className="app-button-ghost flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs text-rose-400 sm:h-8 sm:w-auto"
            disabled={isDeleting === payment.id}
            onClick={() => onDelete(payment)}
            type="button"
          >
            {isDeleting === payment.id ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Ödemeyi Sil
          </button>
        </div>
      ))}
    </div>
  );
}
