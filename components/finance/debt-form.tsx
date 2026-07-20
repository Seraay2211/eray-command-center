"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  BellRing,
  CalendarDays,
  Check,
  FileText,
  Landmark,
  Layers3,
  LoaderCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { addMonthsClamped, formatFinanceDate } from "@/lib/finance/installments";
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
  { value: "medium", label: "Normal" },
  { value: "high", label: "Önemli" },
  { value: "critical", label: "Kritik" },
];
const debtTypeOptions = [
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "loan", label: "Kredi" },
  { value: "bill", label: "Fatura" },
  { value: "personal", label: "Kişisel Borç" },
  { value: "structured", label: "Yapılandırma" },
  { value: "other", label: "Diğer" },
];
const reminderOptions = [
  { value: "0", label: "Son gün" },
  { value: "1", label: "1 gün önce" },
  { value: "3", label: "3 gün önce" },
  { value: "7", label: "7 gün önce" },
];
const inputClass =
  "app-input h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]";

function FormSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="app-surface-2 space-y-4 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span className="app-primary-bg flex size-8 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="app-text text-sm font-semibold">{title}</h3>
          <p className="app-muted mt-1 text-[11px] leading-5">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function DebtForm({
  debt,
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: DebtFormProps) {
  const today = getIstanbulDateKey();
  const [title, setTitle] = useState(debt?.title ?? "");
  const [creditor, setCreditor] = useState(debt?.creditor ?? "");
  const [debtType, setDebtType] = useState(debt?.debt_type ?? "other");
  const [category, setCategory] = useState(debt?.category ?? "");
  const [total, setTotal] = useState(
    debt ? formatNumberTR(debt.total_amount) : "",
  );
  const [currency, setCurrency] = useState(debt?.currency ?? "TRY");
  const [status, setStatus] = useState<DebtStatus>(debt?.status ?? "active");
  const [priority, setPriority] = useState<DebtPriority>(
    debt?.priority ?? "medium",
  );
  const [startDate, setStartDate] = useState(
    debt?.start_date ?? debt?.created_at.slice(0, 10) ?? today,
  );
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "");
  const [reminderDays, setReminderDays] = useState(
    String(debt?.reminder_days_before ?? 3),
  );
  const [installments, setInstallments] = useState(
    debt?.installment_count ? String(debt.installment_count) : "",
  );
  const [isInstallment, setIsInstallment] = useState(
    debt?.is_installment ?? false,
  );
  const [installmentAmount, setInstallmentAmount] = useState(
    debt?.installment_amount ? formatNumberTR(debt.installment_amount) : "",
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
  const normalizedInstallmentDay = Number(installmentDay);
  const suggestedInstallmentAmount =
    totalAmount > 0 && installmentCount > 0
      ? totalAmount / installmentCount
      : 0;
  const lastInstallmentDate =
    isInstallment && installmentStartDate && installmentCount > 0
      ? addMonthsClamped(
          installmentStartDate,
          installmentCount - 1,
          normalizedInstallmentDay || null,
        )
      : null;

  function validateForm(): string | null {
    if (!title.trim()) return "Borç adı zorunludur.";
    if (!debtType) return "Borç türü zorunludur.";
    if (!isValidMoneyInput(total) || totalAmount <= 0) {
      return "Borç tutarı 0’dan büyük olmalı.";
    }
    if (!startDate) return "Başlangıç tarihi zorunludur.";
    if (!dueDate) return "Son ödeme tarihi zorunludur.";
    if (dueDate < startDate) {
      return "Son ödeme tarihi başlangıç tarihinden önce olamaz.";
    }
    if (isInstallment) {
      if (!Number.isInteger(installmentCount) || installmentCount < 1) {
        return "Taksit sayısı 1’den küçük olamaz.";
      }
      if (!installmentStartDate) return "İlk ödeme tarihi zorunludur.";
      if (installmentStartDate < startDate) {
        return "İlk ödeme tarihi başlangıç tarihinden önce olamaz.";
      }
      if (
        installmentDay &&
        (!Number.isInteger(normalizedInstallmentDay) ||
          normalizedInstallmentDay < 1 ||
          normalizedInstallmentDay > 31)
      ) {
        return "Taksit günü 1 ile 31 arasında olmalı.";
      }
    }
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError("");

    onSubmit({
      title,
      creditor,
      debt_type: debtType,
      category: category || null,
      total_amount: totalAmount,
      currency,
      status,
      priority,
      start_date: startDate,
      due_date: dueDate,
      reminder_days_before: Number(reminderDays),
      installment_count: isInstallment ? installmentCount : null,
      is_installment: isInstallment,
      installment_amount: isInstallment
        ? parseMoneyInput(installmentAmount) || suggestedInstallmentAmount
        : null,
      installment_start_date: isInstallment ? installmentStartDate : null,
      installment_day: isInstallment
        ? normalizedInstallmentDay ||
          Number(installmentStartDate.slice(8, 10)) ||
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
        className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l shadow-2xl"
        role="dialog"
      >
        <div className="app-border flex items-center justify-between border-b px-4 py-4 sm:px-5">
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
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <FormSection
              description="Borcu tanımlayan temel bilgileri ve önem seviyesini belirle."
              icon={<Landmark className="size-4" />}
              title="Temel Bilgiler"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-muted block text-xs font-medium sm:col-span-2">
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
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">Borç türü</p>
                  <DarkSelect
                    ariaLabel="Borç türü"
                    disabled={isSaving}
                    onChange={setDebtType}
                    options={debtTypeOptions}
                    value={debtType}
                  />
                </div>
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
                <label className="app-muted block text-xs font-medium">
                  Kategori
                  <input
                    className={`${inputClass} mt-2`}
                    disabled={isSaving}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Örn. Banka, kişisel"
                    value={category}
                  />
                </label>
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
                      }
                    }}
                    onChange={(event) => {
                      setTotal(event.target.value);
                      setInputError("");
                    }}
                    placeholder="125.359,00"
                    required
                    value={total}
                  />
                </label>
                <label className="app-muted block text-xs font-medium">
                  Para birimi
                  <input
                    className={`${inputClass} mt-2 uppercase`}
                    disabled={isSaving}
                    maxLength={6}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    value={currency}
                  />
                </label>
                <div className="sm:col-span-2">
                  <p className="app-muted mb-2 text-xs font-medium">Durum</p>
                  <DarkSelect
                    ariaLabel="Borç durumu"
                    disabled={isSaving}
                    onChange={(value) => setStatus(value as DebtStatus)}
                    options={statusOptions}
                    value={status}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              description="Borç başlangıcını ve kapanması gereken son tarihi kaydet."
              icon={<CalendarDays className="size-4" />}
              title="Tarih ve Son Ödeme"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-muted block text-xs font-medium">
                  Başlangıç tarihi
                  <input className={`${inputClass} mt-2`} disabled={isSaving} onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} />
                </label>
                <label className="app-muted block text-xs font-medium">
                  Son ödeme tarihi
                  <input className={`${inputClass} mt-2`} disabled={isSaving} min={startDate || undefined} onChange={(event) => setDueDate(event.target.value)} required type="date" value={dueDate} />
                </label>
              </div>
            </FormSection>

            <FormSection
              description="Taksitli borçlarda ödeme günlerini güvenli biçimde oluştur."
              icon={<Layers3 className="size-4" />}
              title="Taksit Planı"
            >
              <label className="flex items-center gap-2 text-xs app-text">
                <input checked={isInstallment} className="size-4 accent-[var(--primary)]" disabled={isSaving} onChange={(event) => setIsInstallment(event.target.checked)} type="checkbox" />
                Bu borç taksitli
              </label>
              {isInstallment ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="app-muted block text-xs font-medium">
                    Taksit sayısı
                    <input className={`${inputClass} mt-2`} disabled={isSaving} min="1" onChange={(event) => setInstallments(event.target.value)} required type="number" value={installments} />
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    Taksit tutarı
                    <input className={`${inputClass} mt-2`} disabled={isSaving} inputMode="decimal" onBlur={() => installmentAmount.trim() && setInstallmentAmount(formatNumberTR(parseMoneyInput(installmentAmount)))} onChange={(event) => setInstallmentAmount(event.target.value)} placeholder={suggestedInstallmentAmount ? formatNumberTR(suggestedInstallmentAmount) : "6.516,00"} value={installmentAmount} />
                    {!installmentAmount && suggestedInstallmentAmount > 0 ? <span className="app-muted mt-1.5 block text-[10px]">Önerilen: {formatTRY(suggestedInstallmentAmount)}</span> : null}
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    İlk ödeme / taksit tarihi
                    <input className={`${inputClass} mt-2`} disabled={isSaving} min={startDate || undefined} onChange={(event) => setInstallmentStartDate(event.target.value)} required type="date" value={installmentStartDate} />
                  </label>
                  <label className="app-muted block text-xs font-medium">
                    Her ayın ödeme günü
                    <input className={`${inputClass} mt-2`} disabled={isSaving} max="31" min="1" onChange={(event) => setInstallmentDay(event.target.value)} placeholder={installmentStartDate ? String(Number(installmentStartDate.slice(8, 10))) : "16"} type="number" value={installmentDay} />
                  </label>
                  {lastInstallmentDate ? (
                    <div className="app-surface rounded-xl border p-3 sm:col-span-2">
                      <p className="app-muted text-[10px]">Tahmini son taksit tarihi</p>
                      <p className="app-text mt-1 text-xs font-semibold">{formatFinanceDate(lastInstallmentDate)}</p>
                    </div>
                  ) : null}
                  <label className="app-muted block text-xs font-medium sm:col-span-2">
                    Taksit notu
                    <textarea className="app-input mt-2 min-h-20 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none" disabled={isSaving} onChange={(event) => setInstallmentNote(event.target.value)} placeholder="Planla ilgili kısa takip notu..." value={installmentNote} />
                  </label>
                </div>
              ) : null}
            </FormSection>

            <FormSection
              description="Son ödeme tarihinden ne kadar önce uyarılacağını seç."
              icon={<BellRing className="size-4" />}
              title="Hatırlatma"
            >
              <DarkSelect ariaLabel="Hatırlatma zamanı" disabled={isSaving} onChange={setReminderDays} options={reminderOptions} value={reminderDays} />
            </FormSection>

            <FormSection
              description="Takip sırasında ihtiyaç duyacağın açıklamaları ekle."
              icon={<FileText className="size-4" />}
              title="Notlar"
            >
              <textarea className="app-input min-h-28 w-full resize-y rounded-xl border p-3 text-sm leading-6 outline-none" disabled={isSaving} onChange={(event) => setNotes(event.target.value)} placeholder="Borçla ilgili takip notları..." value={notes} />
            </FormSection>

            {inputError || error ? (
              <div className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-300" role="alert">
                <AlertCircle className="size-4 shrink-0" />
                {inputError || error}
              </div>
            ) : null}
          </div>

          <div className="app-border grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:justify-end">
            <Button className="w-full sm:w-auto" disabled={isSaving} onClick={onClose} variant="secondary">İptal</Button>
            <Button className="w-full sm:w-auto" disabled={isSaving || !title.trim() || !debtType || !startDate || !dueDate || !isValidMoneyInput(total)} type="submit">
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
