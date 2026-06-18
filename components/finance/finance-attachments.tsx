"use client";

import {
  Check,
  Clipboard,
  Eye,
  FilePlus2,
  FileText,
  LoaderCircle,
  NotebookPen,
  ScanText,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getUserFacingError } from "@/lib/user-facing-error";
import {
  appendAttachmentOcrToPaymentNote,
  saveAttachmentOcrAsNote,
} from "@/services/finance-attachments-service";
import type { DebtAttachment } from "@/types";

interface FinanceAttachmentsProps {
  compact?: boolean;
  debtId?: string;
  paymentId?: string;
}

interface AttachmentPayload {
  attachment?: DebtAttachment;
  attachments?: DebtAttachment[];
  error?: string;
  provider?: "demo" | "gemini";
  signedUrl?: string;
  success: boolean;
  warning?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(fileType: string) {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("image/")) return "Görsel";
  return "Dosya";
}

export function FinanceAttachments({
  compact = false,
  debtId,
  paymentId,
}: FinanceAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<DebtAttachment[]>([]);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isLoading, setIsLoading] = useState(!compact);
  const [isUploading, setIsUploading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isExpanded || (!debtId && !paymentId)) return;
    let ignore = false;

    async function loadAttachments() {
      const query = debtId
        ? `debt_id=${encodeURIComponent(debtId)}`
        : `payment_id=${encodeURIComponent(paymentId!)}`;
      try {
        const response = await fetch(`/api/finance/attachments?${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as AttachmentPayload;
        if (ignore) return;
        if (!response.ok || !payload.success) {
          setError(getUserFacingError(payload.error, "Dosyalar yüklenemedi."));
          return;
        }
        setAttachments(payload.attachments ?? []);
      } catch {
        if (!ignore) setError("Dosyalar yüklenemedi. Lütfen tekrar dene.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadAttachments();
    return () => {
      ignore = true;
    };
  }, [debtId, isExpanded, paymentId]);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (debtId) formData.append("debtId", debtId);
      if (paymentId) formData.append("paymentId", paymentId);

      const response = await fetch("/api/finance/attachments", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as AttachmentPayload;
      if (!response.ok || !payload.success || !payload.attachment) {
        setError(getUserFacingError(payload.error, "Dosya yüklenemedi."));
        return;
      }
      setAttachments((current) => [payload.attachment!, ...current]);
      setIsExpanded(true);
      setNotice("Dosya güvenli şekilde yüklendi.");
    } catch {
      setError("Dosya yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePreview(attachment: DebtAttachment) {
    setActionId(attachment.id);
    setError("");
    try {
      const response = await fetch(
        `/api/finance/attachments/${attachment.id}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as AttachmentPayload;
      if (!response.ok || !payload.success || !payload.signedUrl) {
        setError(getUserFacingError(payload.error, "Dosya önizlenemedi."));
        return;
      }
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError("Dosya önizlenemedi. Lütfen tekrar dene.");
    } finally {
      setActionId("");
    }
  }

  async function handleOcr(attachment: DebtAttachment) {
    setActionId(attachment.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/ai/ocr-finance-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachment_id: attachment.id }),
      });
      const payload = (await response.json()) as AttachmentPayload;
      if (!response.ok || !payload.success || !payload.attachment) {
        setError(
          getUserFacingError(payload.error, "OCR işlemi tamamlanamadı."),
        );
        return;
      }
      setAttachments((current) =>
        current.map((item) =>
          item.id === payload.attachment!.id ? payload.attachment! : item,
        ),
      );
      setNotice(
        payload.warning ??
          (payload.provider === "gemini"
            ? "OCR metni ve kısa özet kaydedildi."
            : "Demo OCR sonucu kaydedildi."),
      );
    } catch {
      setError("OCR işlemi tamamlanamadı. Lütfen tekrar dene.");
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(attachment: DebtAttachment) {
    if (!window.confirm(`"${attachment.file_name}" dosyası silinsin mi?`)) return;
    setActionId(attachment.id);
    setError("");
    try {
      const response = await fetch(
        `/api/finance/attachments/${attachment.id}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as AttachmentPayload;
      if (!response.ok || !payload.success) {
        setError(getUserFacingError(payload.error, "Dosya silinemedi."));
        return;
      }
      setAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
      setNotice("Dosya silindi.");
    } catch {
      setError("Dosya silinemedi. Lütfen tekrar dene.");
    } finally {
      setActionId("");
    }
  }

  async function handleCopy(attachment: DebtAttachment) {
    if (!attachment.ocr_text) return;
    try {
      await navigator.clipboard.writeText(attachment.ocr_text);
      setNotice("OCR metni panoya kopyalandı.");
    } catch {
      setError("Metin kopyalanamadı.");
    }
  }

  async function handleAppendToPayment(attachment: DebtAttachment) {
    setActionId(attachment.id);
    setError("");
    const result = await appendAttachmentOcrToPaymentNote(attachment.id);
    setActionId("");
    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }
    setNotice("OCR metni ödeme notuna eklendi.");
  }

  async function handleSaveAsNote(attachment: DebtAttachment) {
    setActionId(attachment.id);
    setError("");
    const result = await saveAttachmentOcrAsNote(attachment.id);
    setActionId("");
    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }
    setNotice("OCR içeriği yeni not olarak kaydedildi.");
  }

  const uploadButton = (
    <Button
      disabled={isUploading}
      onClick={() => fileInputRef.current?.click()}
      size="sm"
      variant="secondary"
    >
      {isUploading ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <Upload className="size-3.5" />
      )}
      {compact ? "Dekont Yükle" : "Dosya Yükle"}
    </Button>
  );

  return (
    <section
      className={
        compact
          ? "mt-3"
          : "app-surface-2 rounded-xl border p-4 sm:p-5"
      }
    >
      <input
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {!compact ? (
          <div>
            <div className="flex items-center gap-2">
              <FilePlus2 className="app-primary size-4" />
              <h3 className="app-text text-sm font-semibold">
                Dosyalar / Dekontlar
              </h3>
            </div>
            <p className="app-muted mt-1 text-[11px]">
              Borca ait görsel, dekont veya PDF belgelerini güvenli şekilde sakla.
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {uploadButton}
          {compact ? (
            <>
              <Button
                onClick={() => {
                  if (!isExpanded) setIsLoading(true);
                  setIsExpanded((current) => !current);
                }}
                size="sm"
                variant="ghost"
              >
                <FileText className="size-3.5" />
                {isExpanded ? "Dekontları Gizle" : "Dekontları Gör"}
              </Button>
              <Button
                disabled={!attachments.length || Boolean(actionId)}
                onClick={() => {
                  const attachment = attachments[0];
                  if (attachment) void handleOcr(attachment);
                }}
                size="sm"
                variant="ghost"
              >
                <ScanText className="size-3.5" />
                OCR Okut
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <div className={compact ? "mt-3" : "mt-4"}>
          {error ? (
            <div
              className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-400"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="app-surface app-text mb-3 flex items-center gap-2 rounded-lg border p-3 text-xs">
              <Check className="size-3.5 text-emerald-400" />
              {notice}
            </div>
          ) : null}

          {isLoading ? (
            <div className="app-muted flex items-center gap-2 py-4 text-xs">
              <LoaderCircle className="size-4 animate-spin" />
              Dosyalar yükleniyor...
            </div>
          ) : attachments.length ? (
            <div className="space-y-3">
              {attachments.map((attachment) => {
                const isBusy = actionId === attachment.id;
                return (
                  <article
                    className="app-surface rounded-xl border p-3 sm:p-4"
                    key={attachment.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="app-surface-2 app-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="app-text truncate text-xs font-semibold">
                          {attachment.file_name}
                        </p>
                        <p className="app-muted mt-1 text-[10px]">
                          {getFileTypeLabel(attachment.file_type)} ·{" "}
                          {formatFileSize(attachment.file_size)} ·{" "}
                          {new Intl.DateTimeFormat("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(attachment.created_at))}
                        </p>
                        <span className="app-surface-2 app-text mt-2 inline-flex rounded-md border px-2 py-1 text-[9px] font-medium">
                          OCR: {attachment.ocr_text ? "Tamamlandı" : "Bekliyor"}
                        </span>
                      </div>
                    </div>

                    {attachment.ai_summary ? (
                      <div className="app-surface-2 mt-3 rounded-lg border p-3">
                        <p className="app-primary text-[9px] font-semibold uppercase tracking-[0.14em]">
                          AI Kısa Özet
                        </p>
                        <p className="app-text mt-1.5 text-xs leading-5">
                          {attachment.ai_summary}
                        </p>
                      </div>
                    ) : null}
                    {attachment.ocr_text ? (
                      <div className="app-surface-2 mt-3 max-h-44 overflow-y-auto rounded-lg border p-3">
                        <p className="app-muted whitespace-pre-wrap text-[11px] leading-5">
                          {attachment.ocr_text}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        disabled={isBusy}
                        onClick={() => void handlePreview(attachment)}
                        size="sm"
                        variant="ghost"
                      >
                        <Eye className="size-3.5" /> Önizle
                      </Button>
                      <Button
                        disabled={isBusy}
                        onClick={() => void handleOcr(attachment)}
                        size="sm"
                        variant="secondary"
                      >
                        {isBusy ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <ScanText className="size-3.5" />
                        )}
                        OCR Okut
                      </Button>
                      {attachment.ocr_text ? (
                        <>
                          <Button
                            disabled={isBusy}
                            onClick={() => void handleCopy(attachment)}
                            size="sm"
                            variant="ghost"
                          >
                            <Clipboard className="size-3.5" /> Metni Kopyala
                          </Button>
                          {paymentId ? (
                            <Button
                              disabled={isBusy}
                              onClick={() =>
                                void handleAppendToPayment(attachment)
                              }
                              size="sm"
                              variant="ghost"
                            >
                              <FilePlus2 className="size-3.5" /> Ödeme Notuna Ekle
                            </Button>
                          ) : null}
                          <Button
                            disabled={isBusy}
                            onClick={() => void handleSaveAsNote(attachment)}
                            size="sm"
                            variant="ghost"
                          >
                            <NotebookPen className="size-3.5" /> Yeni Not Olarak
                            Kaydet
                          </Button>
                        </>
                      ) : null}
                      <Button
                        className="text-rose-400"
                        disabled={isBusy}
                        onClick={() => void handleDelete(attachment)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="size-3.5" /> Sil
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="app-surface rounded-xl border border-dashed p-5 text-center">
              <FilePlus2 className="app-primary mx-auto size-5" />
              <p className="app-text mt-3 text-sm font-semibold">
                Henüz dekont yüklenmedi
              </p>
              <p className="app-muted mx-auto mt-1 max-w-sm text-xs leading-5">
                Bu kayda dekont, görsel veya PDF bağlayarak belgelerini güvenli
                biçimde saklayabilirsin.
              </p>
              <Button
                className="mt-4"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="secondary"
              >
                <Upload className="size-3.5" />
                Dekont Yükle
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
