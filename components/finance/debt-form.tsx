"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import {
  formatNumberTR,
  formatTRY,
  isValidMoneyInput,
  parseMoneyInput,
} from "@/lib/utils/currency";
import type { CreateDebtInput, Debt, DebtPriority, DebtStatus } from "@/types";

interface DebtFormProps {
  debt: Debt | null;
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDebtInput) => void;
}

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "overdue", label: "Gecikmiş" },
  { value: "structured", label: "Yapılandırıldı" },
  { value: "cancelled", label: "İptal" },
];
const priorityOptions = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
  { value: "critical", label: "Kritik" },
];
const inputClass =
  "app-input h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]";

export function DebtForm({
  debt,
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: DebtFormProps) {
  const [title, setTitle] = useState(debt?.title ?? "");
  const [creditor, setCreditor] = useState(debt?.creditor ?? "");
  const [total, setTotal] = useState(
    debt ? formatNumberTR(debt.total_amount) : "",
  );
  const [currency, setCurrency] = useState(debt?.currency ?? "TRY");
  const [status, setStatus] = useState<DebtStatus>(debt?.status ?? "active");
  const [priority, setPriority] = useState<DebtPriority>(
    debt?.priority ?? "medium",
  );
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "");
  const [installments, setInstallments] = useState(
    debt?.installment_count ? String(debt.installment_count) : "",
  );
  const [isInstallment, setIsInstallment] = useState(
    debt?.is_installment ?? false,
  );
  const [installmentAmount, setInstallmentAmount] = useState(
    debt?.installment_amount
      ? formatNumberTR(debt.installment_amount)
      : "",
  );
  const [installmentStartDate, setInstallmentStartDate] = useState(
    debt?.installment_start_date ?? debt?.due_date ?? "",
  );
  const [installmentDay, setInstallmentDay] = useState(
    debt?.installment_day ? String(debt.installment_day) : "",
  );
  const [installmentNote, setInstallmentNote] = useState(
    debt?.installment_note ?? "",
  );
  const [notes, setNotes] = useState(debt?.notes ?? "");
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const totalAmount = parseMoneyInput(total);
  const installmentCount = Number(installments);
  const suggestedInstallmentAmount =
    totalAmount > 0 && installmentCount > 0
      ? totalAmount / installmentCount
      : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (totalAmount <= 0) {
      setInputError("Geçerli bir tutar gir.");
      return;
    }
    setInputError("");

    onSubmit({
      title,
      creditor,
      total_amount: totalAmount,
      currency,
      status,
      priority,
      due_date: dueDate || null,
      installment_count: isInstallment ? installmentCount : null,
      is_installment: isInstallment,
      installment_amount: isInstallment
        ? parseMoneyInput(installmentAmount) || suggestedInstallmentAmount
        : null,
      installment_start_date: isInstallment
        ? installmentStartDate || dueDate || null
        : null,
      installment_day: isInstallment
        ? Number(installmentDay) ||
          Number((installmentStartDate || dueDate).slice(8, 10)) ||
          null
        : null,
      installment_note: isInstallment ? installmentNote : "",
      notes,
    });
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        aria-label="Borç formunu kapat"
        className="absolute inset-0 bg-black/70"
        disabled={isSaving}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-modal="true"
        className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l shadow-2xl"
        role="dialog"
      >
        <div className="app-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
              Finans kaydı
            </p>
            <h2 className="app-text mt-1 text-lg font-semibold">
              {debt ? "Borcu Düzenle" : "Yeni Borç"}
            </h2>
          </div>
          <button
            aria-label="Kapat"
            className="app-button-ghost flex size-9 items-center justify-center rounded-lg"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <label className="app-muted block text-xs font-medium">
              Borç adı
              <input
                autoFocus
                className={`${inputClass} mt-2`}
                disabled={isSaving}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Örn. Kredi kartı borcu"
                required
                value={title}
              />
            </label>
            <label className="app-muted block text-xs font-medium">
              Alacaklı / kurum
              <input
                className={`${inputClass} mt-2`}
                disabled={isSaving}
                onChange={(event) => setCreditor(event.target.value)}
                placeholder="Banka, kurum veya kişi"
                value={creditor}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
              <label className="app-muted block text-xs font-medium">
                Toplam tutar
                <input
                  className={`${inputClass} mt-2`}
                  disabled={isSaving}
                  inputMode="decimal"
                  onBlur={() => {
                    if (isValidMoneyInput(total)) {
                      setTotal(formatNumberTR(parseMoneyInput(total)));
                      setInputError("");
                    } else if (total.trim()) {
                      setInputError("Geçerli bir tutar gir.");
                    }
                  }}
                  onChange={(event) => {
                    setTotal(event.target.value);
                    setInputError("");
                  }}
                  placeholder="125.359,00"
                  required
                  type="text"
                  value={total}
                />
              </label>
              <label className="app-muted block text-xs font-medium">
                Para birimi
                <input
                  className={`${inputClass} mt-2 uppercase`}
                  disabled={isSaving}
                  maxLength={6}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  value={currency}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="app-muted mb-2 text-xs font-medium">Durum</p>
                <DarkSelect
                  ariaLabel="Borç durumu"
                  disabled={isSaving}
                  onChange={(value) => setStatus(value as DebtStatus)}
                  options={statusOptions}
                  value={status}
                />
              </div>
              <div>
                <p className="app-muted mb-2 text-xs font-medium">Öncelik</p>
                <DarkSelect
                  ariaLabel="Borç önceliği"
                  disabled={isSaving}
                  onChange={(value) => setPriority(value as DebtPriority)}
                  options={priorityOptions}
                  value={priority}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="app-muted block text-xs font-medium">
                Son ödeme tarihi
                <input
                  className={`${inputClass} mt-2`}
                  disabled={isSaving}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  value={dueDate}
                />
              </label>
            </div>

            <section className="app-surface-2 space-y-4 rounded-xl border p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="app-text text-sm font-semibold">Taksit Planı</p>
                  <p className="app-muted mt-1 text-[11px] leading-5">
                    Dönemlik tutarı ve ilk ödeme tarihini ayrı takip et.
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs app-text">
                  <input
                    checked={isInstallment}
                    className="size-4 accent-[var(--primary)]"
                    disabled={isSaving}
                    onChange={(event) => setIsInstallment(event.target.checked)}
                    type="checkbox"
                  />
                  Taksitli
                </label>
              </div>

              {isInstallment ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="app-muted block text-xs font-medium">
                    Taksit sayısı
                    <input
                      className={`${inputClass} mt-2`}
                      disabled={isSaving}
                      min="1"
                      onChange={(event) => setInstallments(event.target.value)}
                      required
                      type="number"
                      value={installments}
                    />
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    Aylık / dönemlik tutar
                    <input
                      className={`${inputClass} mt-2`}
                      disabled={isSaving}
                      inputMode="decimal"
                      onBlur={() => {
                        if (installmentAmount.trim()) {
                          setInstallmentAmount(
                            formatNumberTR(
                              parseMoneyInput(installmentAmount),
                            ),
                          );
                        }
                      }}
                      onChange={(event) =>
                        setInstallmentAmount(event.target.value)
                      }
                      placeholder={
                        suggestedInstallmentAmount
                          ? formatNumberTR(suggestedInstallmentAmount)
                          : "6.516,00"
                      }
                      type="text"
                      value={installmentAmount}
                    />
                    {!installmentAmount && suggestedInstallmentAmount > 0 ? (
                      <span className="mt-1.5 block text-[10px] app-muted">
                        Önerilen tutar:{" "}
                        {formatTRY(suggestedInstallmentAmount)}
                      </span>
                    ) : null}
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    İlk taksit tarihi
                    <input
                      className={`${inputClass} mt-2`}
                      disabled={isSaving}
                      onChange={(event) =>
                        setInstallmentStartDate(event.target.value)
                      }
                      required
                      type="date"
                      value={installmentStartDate}
                    />
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    Ödeme günü
                    <input
                      className={`${inputClass} mt-2`}
                      disabled={isSaving}
                      max="31"
                      min="1"
                      onChange={(event) => setInstallmentDay(event.target.value)}
                      placeholder={
                        installmentStartDate
                          ? String(Number(installmentStartDate.slice(8, 10)))
                          : "16"
                      }
                      type="number"
                      value={installmentDay}
                    />
                  </label>
                  <label className="app-muted block text-xs font-medium sm:col-span-2">
                    Taksit notu
                    <textarea
                      className="app-input mt-2 min-h-20 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none"
                      disabled={isSaving}
                      onChange={(event) =>
                        setInstallmentNote(event.target.value)
                      }
                      placeholder="Planla ilgili kısa takip notu..."
                      value={installmentNote}
                    />
                  </label>
                </div>
              ) : null}
            </section>
            <label className="app-muted block text-xs font-medium">
              Not
              <textarea
                className="app-input mt-2 min-h-28 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none"
                disabled={isSaving}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Borçla ilgili takip notları..."
                value={notes}
              />
            </label>
            {inputError || error ? (
              <div
                className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-300"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0" />
                {inputError || error}
              </div>
            ) : null}
          </div>

          <div className="app-border grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:justify-end">
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
              disabled={
                isSaving ||
                !title.trim() ||
                !isValidMoneyInput(total) ||
                (isInstallment &&
                  (!installments ||
                    Number(installments) < 1 ||
                    !installmentStartDate))
              }
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
