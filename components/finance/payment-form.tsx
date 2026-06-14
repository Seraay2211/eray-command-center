"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Check,
  FileImage,
  LoaderCircle,
  ScanText,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import {
  FINANCE_RECEIPT_MIME_TYPES,
  validateFinanceReceiptFile,
} from "@/lib/finance/receipt-config";
import {
  formatNumberTR,
  formatTRY,
  isValidMoneyInput,
  parseMoneyInput,
} from "@/lib/utils/currency";
import type {
  CreateDebtPaymentWithReceiptInput,
  Debt,
  FinanceOcrResult,
  FinanceOcrStatus,
} from "@/types";

interface PaymentFormProps {
  debt: Debt;
  error: string;
  isSaving: boolean;
  onCancel?: () => void;
  onSubmit: (input: CreateDebtPaymentWithReceiptInput) => void;
}

interface OcrApiResponse {
  error?: string;
  provider?: "gemini" | "demo";
  result?: FinanceOcrResult;
  success: boolean;
}

const inputClass =
  "app-input h-10 w-full rounded-xl border px-3 text-sm outline-none";

function buildOcrNote(result: FinanceOcrResult): string {
  return [
    result.bank ? `Banka: ${result.bank}` : "",
    result.sender ? `Gönderen: ${result.sender}` : "",
    result.receiver ? `Alıcı: ${result.receiver}` : "",
    result.reference_no ? `Referans No: ${result.reference_no}` : "",
    result.description ? `Açıklama: ${result.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function PaymentForm({
  debt,
  error,
  isSaving,
  onCancel,
  onSubmit,
}: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getIstanbulDateKey());
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [inputError, setInputError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [ocrResult, setOcrResult] = useState<FinanceOcrResult | null>(null);
  const [ocrStatus, setOcrStatus] = useState<FinanceOcrStatus>("idle");
  const [ocrError, setOcrError] = useState("");
  const [ocrNotice, setOcrNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasApplicableOcrData = Boolean(
    ocrResult?.amount ||
      ocrResult?.payment_date ||
      ocrResult?.method ||
      ocrResult?.bank ||
      ocrResult?.sender ||
      ocrResult?.receiver ||
      ocrResult?.reference_no ||
      ocrResult?.description,
  );

  useEffect(
    () => () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    },
    [receiptPreviewUrl],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const paymentAmount = parseMoneyInput(amount);
    if (paymentAmount <= 0) {
      setInputError("Geçerli bir tutar gir.");
      return;
    }
    setInputError("");

    onSubmit({
      debt_id: debt.id,
      amount: paymentAmount,
      payment_date: paymentDate,
      method,
      note,
      receipt: receiptFile
        ? {
            file: receiptFile,
            ocr_result: ocrResult,
            ocr_status: ocrStatus,
          }
        : undefined,
    });
  }

  function selectReceipt(file: File | null) {
    if (!file) return;

    const validationError = validateFinanceReceiptFile(file);
    if (validationError) {
      setOcrError(validationError);
      return;
    }

    setReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));
    setOcrResult(null);
    setOcrStatus("idle");
    setOcrError("");
    setOcrNotice("");
  }

  function removeReceipt() {
    setReceiptFile(null);
    setReceiptPreviewUrl("");
    setOcrResult(null);
    setOcrStatus("idle");
    setOcrError("");
    setOcrNotice("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function readReceipt() {
    if (!receiptFile) {
      setOcrError("Önce bir dekont görseli seç.");
      return;
    }

    setOcrStatus("processing");
    setOcrError("");
    setOcrNotice("");

    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      const response = await fetch("/api/finance/ocr", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as OcrApiResponse;

      if (!response.ok || !payload.success || !payload.result) {
        setOcrStatus("failed");
        setOcrError(payload.error ?? "OCR başarısız oldu. Lütfen tekrar dene.");
        return;
      }

      setOcrResult(payload.result);
      setOcrStatus(payload.provider === "demo" ? "failed" : "success");
      setOcrNotice(
        payload.result.warning ??
          "Dekont okundu. Sonuçları kontrol edip ödeme alanlarına uygulayabilirsin.",
      );
    } catch {
      setOcrStatus("failed");
      setOcrError("OCR başarısız oldu. Lütfen tekrar dene.");
    }
  }

  function applyOcrResult() {
    if (!ocrResult) return;

    if (ocrResult.amount) setAmount(formatNumberTR(ocrResult.amount));
    if (ocrResult.payment_date) setPaymentDate(ocrResult.payment_date);
    if (ocrResult.method) setMethod(ocrResult.method);

    const extractedNote = buildOcrNote(ocrResult);
    if (extractedNote) {
      setNote((current) =>
        current.trim() ? `${current.trim()}\n\n${extractedNote}` : extractedNote,
      );
    }

    setInputError("");
    setOcrNotice(
      "OCR sonucu ödeme alanlarına uygulandı. Kaydetmeden önce tutar ve tarihi kontrol et.",
    );
  }

  return (
    <form
      className="app-surface-2 space-y-3 rounded-xl border p-4"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="app-text text-sm font-semibold">Ödeme Ekle</p>
        <p className="app-muted mt-1 text-[11px]">{debt.title}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="app-muted text-xs">
          Tutar
          <input
            autoFocus
            className={`${inputClass} mt-1.5`}
            disabled={isSaving}
            inputMode="decimal"
            onBlur={() => {
              if (isValidMoneyInput(amount)) {
                setAmount(formatNumberTR(parseMoneyInput(amount)));
                setInputError("");
              } else if (amount.trim()) {
                setInputError("Geçerli bir tutar gir.");
              }
            }}
            onChange={(event) => {
              setAmount(event.target.value);
              setInputError("");
            }}
            placeholder="6.964,00"
            required
            type="text"
            value={amount}
          />
        </label>
        <label className="app-muted text-xs">
          Ödeme tarihi
          <input
            className={`${inputClass} mt-1.5`}
            disabled={isSaving}
            onChange={(event) => setPaymentDate(event.target.value)}
            required
            type="date"
            value={paymentDate}
          />
        </label>
      </div>
      <label className="app-muted block text-xs">
        Yöntem
        <input
          className={`${inputClass} mt-1.5`}
          disabled={isSaving}
          onChange={(event) => setMethod(event.target.value)}
          placeholder="Havale, nakit, kart..."
          value={method}
        />
      </label>
      <label className="app-muted block text-xs">
        Not
        <textarea
          className="app-input mt-1.5 min-h-20 w-full rounded-xl border p-3 text-sm outline-none"
          disabled={isSaving}
          onChange={(event) => setNote(event.target.value)}
          value={note}
        />
      </label>

      <section className="app-surface rounded-xl border p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="app-text flex items-center gap-2 text-xs font-semibold">
              <FileImage className="app-primary size-4" />
              Dekont / Görsel
            </p>
            <p className="app-muted mt-1 text-[10px] leading-5">
              PNG, JPG veya WEBP. En fazla 10 MB.
            </p>
          </div>
          <Button
            disabled={isSaving || ocrStatus === "processing"}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="secondary"
          >
            <Upload className="size-3.5" />
            Görsel Seç
          </Button>
        </div>

        <input
          accept={FINANCE_RECEIPT_MIME_TYPES.join(",")}
          className="sr-only"
          disabled={isSaving || ocrStatus === "processing"}
          onChange={(event) => selectReceipt(event.target.files?.[0] ?? null)}
          ref={fileInputRef}
          type="file"
        />

        {receiptFile && receiptPreviewUrl ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div
              aria-label={`${receiptFile.name} önizlemesi`}
              className="app-surface-2 aspect-[4/3] rounded-xl border bg-contain bg-center bg-no-repeat"
              role="img"
              style={{ backgroundImage: `url("${receiptPreviewUrl}")` }}
            />
            <div className="min-w-0">
              <p className="app-text truncate text-xs font-medium">
                {receiptFile.name}
              </p>
              <p className="app-muted mt-1 text-[10px]">
                {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={isSaving || ocrStatus === "processing"}
                  onClick={() => void readReceipt()}
                  size="sm"
                  variant="secondary"
                >
                  {ocrStatus === "processing" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <ScanText className="size-3.5" />
                  )}
                  {ocrStatus === "processing"
                    ? "OCR okunuyor..."
                    : "Dekonttan Oku"}
                </Button>
                <Button
                  disabled={
                    isSaving ||
                    ocrStatus === "processing" ||
                    !hasApplicableOcrData
                  }
                  onClick={applyOcrResult}
                  size="sm"
                >
                  <Sparkles className="size-3.5" />
                  OCR Sonucunu Uygula
                </Button>
                <Button
                  disabled={isSaving || ocrStatus === "processing"}
                  onClick={removeReceipt}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                  Görseli Kaldır
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="app-surface-2 app-muted mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-xs transition hover:border-[var(--primary)] hover:text-[var(--text)]"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Upload className="size-4" />
            Dekont görseli ekle
          </button>
        )}

        <p className="app-muted mt-3 text-[10px] leading-5">
          Şimdilik yalnızca görsel dekontlar destekleniyor.
        </p>

        {ocrResult ? (
          <div className="app-surface-2 mt-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="app-text text-xs font-semibold">OCR Sonucu</p>
              <span className="app-muted text-[10px]">
                Güven:{" "}
                {ocrResult.confidence === "high"
                  ? "Yüksek"
                  : ocrResult.confidence === "medium"
                    ? "Orta"
                    : "Düşük"}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
              <div className="app-muted">
                Tutar:{" "}
                <span className="app-text">
                  {ocrResult.amount ? formatTRY(ocrResult.amount) : "Okunamadı"}
                </span>
              </div>
              <div className="app-muted">
                Ödeme Tarihi:{" "}
                <span className="app-text">
                  {ocrResult.payment_date ?? "Okunamadı"}
                </span>
              </div>
              <div className="app-muted">
                Banka:{" "}
                <span className="app-text">
                  {ocrResult.bank ?? "Okunamadı"}
                </span>
              </div>
              <div className="app-muted">
                Referans No:{" "}
                <span className="app-text">
                  {ocrResult.reference_no ?? "Okunamadı"}
                </span>
              </div>
              <div className="app-muted">
                Gönderen:{" "}
                <span className="app-text">
                  {ocrResult.sender ?? "Okunamadı"}
                </span>
              </div>
              <div className="app-muted">
                Alıcı:{" "}
                <span className="app-text">
                  {ocrResult.receiver ?? "Okunamadı"}
                </span>
              </div>
            </dl>
            <p className="app-muted mt-3 text-[10px] leading-5">
              OCR sonuçları otomatik tahmindir. Kaydetmeden önce tutar ve tarihi
              kontrol edin.
            </p>
          </div>
        ) : null}
      </section>

      {inputError || error || ocrError ? (
        <p className="text-xs text-rose-400" role="alert">
          {inputError || error || ocrError}
        </p>
      ) : null}
      {ocrNotice ? (
        <p className="app-muted text-xs" role="status">
          {ocrNotice}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button
            disabled={isSaving}
            onClick={onCancel}
            size="sm"
            variant="ghost"
          >
            İptal
          </Button>
        ) : null}
        <Button
          disabled={
            isSaving ||
            ocrStatus === "processing" ||
            !isValidMoneyInput(amount)
          }
          size="sm"
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
  );
}
