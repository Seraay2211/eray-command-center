"use client";

import { CalendarPlus, Pencil, X } from "lucide-react";
import { DebtPriorityBadge, DebtStatusBadge } from "@/components/finance/debt-badges";
import { FinanceAttachments } from "@/components/finance/finance-attachments";
import { InstallmentSchedule } from "@/components/finance/installment-schedule";
import { PaymentForm } from "@/components/finance/payment-form";
import { PaymentList } from "@/components/finance/payment-list";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { formatSensitiveTRY } from "@/lib/privacy";
import type {
  CreateDebtPaymentWithReceiptInput,
  Debt,
  DebtInstallment,
  DebtPayment,
} from "@/types";

interface DebtDetailPanelProps {
  debt: Debt | null;
  isDeletingPayment: string;
  isLoadingPayments: boolean;
  isSavingPayment: boolean;
  installments: DebtInstallment[];
  onAddReminder: (debt: Debt) => void;
  onClose: () => void;
  onDeletePayment: (payment: DebtPayment) => void;
  onDeleteReceipt: (payment: DebtPayment) => void;
  onEdit: (debt: Debt) => void;
  onPayment: (input: CreateDebtPaymentWithReceiptInput) => void;
  onInstallmentPayment: (installment: DebtInstallment) => void;
  onViewReceipt: (payment: DebtPayment) => void;
  paymentError: string;
  paymentHistoryError: string;
  payments: DebtPayment[];
  receiptError: string;
  receiptActionId: string;
}

export function DebtDetailPanel({
  debt,
  isDeletingPayment,
  isLoadingPayments,
  isSavingPayment,
  installments,
  onAddReminder,
  onClose,
  onDeletePayment,
  onDeleteReceipt,
  onEdit,
  onPayment,
  onInstallmentPayment,
  onViewReceipt,
  paymentError,
  paymentHistoryError,
  payments,
  receiptError,
  receiptActionId,
}: DebtDetailPanelProps) {
  const { settings } = useSettings();

  if (!debt) {
    return (
      <div className="app-card flex min-h-[520px] items-center justify-center rounded-2xl border p-8 text-center">
        <div>
          <p className="app-text text-sm font-semibold">Bir borç kaydı seç</p>
          <p className="app-muted mt-2 text-xs">Detayları ve ödeme geçmişini görmek için listeden bir kayıt aç.</p>
        </div>
      </div>
    );
  }

  const remaining = Math.max(debt.total_amount - debt.paid_amount, 0);

  return (
    <div className="app-card rounded-2xl border">
      <div className="app-border flex items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <DebtStatusBadge dueDate={debt.due_date} status={debt.status} />
            <DebtPriorityBadge priority={debt.priority} />
          </div>
          <h2 className="app-text mt-3 break-words text-lg font-semibold">{debt.title}</h2>
          <p className="app-muted mt-1 text-xs">{debt.creditor || "Alacaklı belirtilmedi"}</p>
        </div>
        <button aria-label="Detayı kapat" className="app-button-ghost flex size-9 items-center justify-center rounded-lg" onClick={onClose} type="button"><X className="size-5" /></button>
      </div>
      <div className="space-y-5 p-3 sm:p-5">
        <section>
          <div className="mb-3">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
              Borç Detayı
            </p>
            <p className="app-muted mt-1 text-xs">
              Seçili kaydın finansal durumu ve takip bilgileri.
            </p>
          </div>
        <div className="grid gap-2 min-[440px]:grid-cols-3">
          {[
            ["Toplam", formatSensitiveTRY(debt.total_amount, settings)],
            ["Ödenen", formatSensitiveTRY(debt.paid_amount, settings)],
            ["Kalan", formatSensitiveTRY(remaining, settings)],
          ].map(([label, value]) => (
            <div className="app-surface-2 rounded-xl border p-3" key={label}>
              <p className="app-muted text-[10px]">{label}</p>
              <p className="app-text mt-1 break-words text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
          <dl className="app-surface-2 mt-3 grid gap-3 rounded-xl border p-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="app-muted text-[10px]">Alacaklı / Kurum</dt>
              <dd className="app-text mt-1 font-medium">
                {debt.creditor || "Belirtilmedi"}
              </dd>
            </div>
            <div>
              <dt className="app-muted text-[10px]">Son Ödeme Tarihi</dt>
              <dd className="app-text mt-1 font-medium">
                {debt.due_date
                  ? new Intl.DateTimeFormat("tr-TR").format(
                      new Date(`${debt.due_date}T00:00:00`),
                    )
                  : "Belirtilmedi"}
              </dd>
            </div>
            <div>
              <dt className="app-muted text-[10px]">Durum</dt>
              <dd className="mt-1">
                <DebtStatusBadge
                  dueDate={debt.due_date}
                  status={debt.status}
                />
              </dd>
            </div>
            <div>
              <dt className="app-muted text-[10px]">Öncelik</dt>
              <dd className="mt-1">
                <DebtPriorityBadge priority={debt.priority} />
              </dd>
            </div>
          </dl>
          {debt.notes ? (
            <div className="mt-3">
              <p className="app-muted text-[10px]">Notlar</p>
              <p className="app-surface-2 app-text mt-1.5 whitespace-pre-wrap rounded-xl border p-4 text-xs leading-6">
                {debt.notes}
              </p>
            </div>
          ) : null}
        </section>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onEdit(debt)} size="sm" variant="secondary"><Pencil className="size-3.5" /> Düzenle</Button>
          {debt.due_date ? <Button onClick={() => onAddReminder(debt)} size="sm" variant="secondary"><CalendarPlus className="size-3.5" /> Takvime Ekle</Button> : null}
        </div>
        {debt.is_installment ? (
          <section>
            <div className="mb-3">
              <p className="app-text text-sm font-semibold">Taksit Planı</p>
              <p className="app-muted mt-1 text-[11px]">
                {debt.installment_count ?? installments.length} dönem ·{" "}
                {formatSensitiveTRY(debt.installment_amount ?? 0, settings)}{" "}
                dönemlik ödeme
              </p>
            </div>
            <InstallmentSchedule
              installments={installments}
              onPayment={onInstallmentPayment}
            />
          </section>
        ) : null}
        <FinanceAttachments debtId={debt.id} />
        <PaymentForm
          debt={debt}
          error={paymentError}
          isSaving={isSavingPayment}
          key={`${debt.id}-${payments.length}`}
          onSubmit={onPayment}
        />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="app-text text-sm font-semibold">Ödeme Geçmişi</p>
            <span className="app-muted text-[10px]">{payments.length} kayıt</span>
          </div>
          <PaymentList
            actionError={receiptError}
            error={paymentHistoryError}
            isDeleting={isDeletingPayment}
            isLoading={isLoadingPayments}
            onDelete={onDeletePayment}
            onDeleteReceipt={onDeleteReceipt}
            onViewReceipt={onViewReceipt}
            payments={payments}
            receiptActionId={receiptActionId}
          />
        </div>
      </div>
    </div>
  );
}
