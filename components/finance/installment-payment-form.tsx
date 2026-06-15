"use client";

import { useState, type FormEvent } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { formatFinanceDate } from "@/lib/finance/installments";
import {
  formatNumberTR,
  formatTRY,
  isValidMoneyInput,
  parseMoneyInput,
} from "@/lib/utils/currency";
import type {
  CreateDebtPaymentInput,
  Debt,
  DebtInstallment,
} from "@/types";

interface InstallmentPaymentFormProps {
  debt: Debt;
  error: string;
  installment: DebtInstallment;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDebtPaymentInput) => void;
}

export function InstallmentPaymentForm({
  debt,
  error,
  installment,
  isSaving,
  onClose,
  onSubmit,
}: InstallmentPaymentFormProps) {
  const remainingExpected = Math.max(
    installment.expected_amount - installment.paid_amount,
    0,
  );
  const [amount, setAmount] = useState(formatNumberTR(remainingExpected));
  const [paymentDate, setPaymentDate] = useState(getIstanbulDateKey());
  const [note, setNote] = useState("");
  const [inputError, setInputError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const paidAmount = parseMoneyInput(amount);
    if (paidAmount <= 0) {
      setInputError("Geçerli bir ödeme tutarı gir.");
      return;
    }

    setInputError("");
    onSubmit({
      debt_id: debt.id,
      installment_id: installment.id,
      amount: paidAmount,
      payment_date: paymentDate,
      method: "Taksit ödemesi",
      note,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        aria-label="Taksit ödeme formunu kapat"
        className="absolute inset-0 bg-black/70"
        disabled={isSaving}
        onClick={onClose}
        type="button"
      />
      <form
        aria-labelledby="installment-payment-title"
        aria-modal="true"
        className="app-surface safe-bottom relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-4 shadow-2xl sm:rounded-2xl sm:p-5"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
              Taksit Ödemesi
            </p>
            <h2
              className="app-text mt-1 truncate text-lg font-semibold"
              id="installment-payment-title"
            >
              {debt.title}
            </h2>
          </div>
          <button
            aria-label="Kapat"
            className="app-button-ghost flex size-9 shrink-0 items-center justify-center rounded-lg"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <dl className="app-surface-2 mt-4 grid gap-3 rounded-xl border p-4 text-xs sm:grid-cols-3">
          <div>
            <dt className="app-muted text-[10px]">Taksit</dt>
            <dd className="app-text mt-1 font-semibold">
              {installment.installment_no}
            </dd>
          </div>
          <div>
            <dt className="app-muted text-[10px]">Vade tarihi</dt>
            <dd className="app-text mt-1 font-semibold">
              {formatFinanceDate(installment.due_date)}
            </dd>
          </div>
          <div>
            <dt className="app-muted text-[10px]">Beklenen tutar</dt>
            <dd className="app-text mt-1 font-semibold">
              {formatTRY(installment.expected_amount)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="app-muted text-xs font-medium">
            Ödenen tutar
            <input
              autoFocus
              className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              disabled={isSaving}
              inputMode="decimal"
              onBlur={() => {
                if (isValidMoneyInput(amount)) {
                  setAmount(formatNumberTR(parseMoneyInput(amount)));
                }
              }}
              onChange={(event) => {
                setAmount(event.target.value);
                setInputError("");
              }}
              required
              value={amount}
            />
          </label>
          <label className="app-muted text-xs font-medium">
            Ödeme tarihi
            <input
              className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              disabled={isSaving}
              onChange={(event) => setPaymentDate(event.target.value)}
              required
              type="date"
              value={paymentDate}
            />
          </label>
        </div>

        <label className="app-muted mt-4 block text-xs font-medium">
          Not
          <textarea
            className="app-input mt-2 min-h-20 w-full rounded-xl border p-3 text-sm outline-none"
            disabled={isSaving}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ödeme ile ilgili kısa not..."
            value={note}
          />
        </label>

        {inputError || error ? (
          <p className="mt-3 text-xs text-rose-400" role="alert">
            {inputError || error}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={isSaving}
            onClick={onClose}
            variant="secondary"
          >
            İptal
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={isSaving || !isValidMoneyInput(amount)}
            type="submit"
          >
            {isSaving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {isSaving ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
