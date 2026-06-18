"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { getAiActionDefinition } from "@/lib/ai/actions";
import { AI_MAX_INPUT_CHARS } from "@/lib/ai/config";
import {
  formatAiOutputForDisplay,
  formatAiOutputForNote,
} from "@/lib/ai/format-ai-output";
import { getUserFacingError } from "@/lib/user-facing-error";
import { createNote } from "@/features/notes/actions";
import { AiActionButtons } from "@/components/ai/ai-action-buttons";
import { AiOutputPanel } from "@/components/ai/ai-output-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import type {
  AiActionKey,
  AiActionRequest,
  AiActionResponse,
  AiOutputState,
} from "@/types";

interface AiWorkspaceProps {
  initialAction: AiActionKey;
  isAiConfigured: boolean;
  showSensitiveWarning: boolean;
}

function createEmptyOutputState(): AiOutputState {
  return {
    action: null,
    error: null,
    isLoading: false,
    output: "",
    provider: null,
    sourceNoteId: null,
    sourceTitle: "",
  };
}

function getTodayDateLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date());
}

function buildNoteTitle(
  sourceTitle: string,
  action: AiActionKey | null,
): string {
  if (action === "command_summary") {
    return `AI Komuta Özeti — ${getTodayDateLabel()}`;
  }

  if (action === "daily_summary") {
    return `Günün Özeti — ${getTodayDateLabel()}`;
  }

  const cleanTitle = sourceTitle.trim();

  if (cleanTitle) {
    return `[AI] ${cleanTitle}`;
  }

  const label = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date());

  return `[AI] Çıktı - ${label}`;
}

export function AiWorkspace({
  initialAction,
  isAiConfigured,
  showSensitiveWarning,
}: AiWorkspaceProps) {
  const { settings } = useSettings();
  const isEnglish = settings.language === "en";
  const [selectedAction, setSelectedAction] = useState<AiActionKey>(initialAction);
  const [title, setTitle] = useState("");
  const [input, setInput] = useState("");
  const [outputState, setOutputState] = useState<AiOutputState>(
    createEmptyOutputState(),
  );
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSavingAsNote, setIsSavingAsNote] = useState(false);
  const noticeTimerRef = useRef<number | null>(null);
  const isCommandSummary = selectedAction === "command_summary";
  const isDailySummary = selectedAction === "daily_summary";

  const remainingCharacters = useMemo(
    () => AI_MAX_INPUT_CHARS - input.length,
    [input.length],
  );

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    },
    [],
  );

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 3200);
  }

  async function handleRunAction() {
    const text = input.trim();

    if (!isCommandSummary && !text) {
      setPageError(
        isDailySummary
          ? "Lütfen gün içinde yaşadıklarını kısaca yaz."
          : "İşlenecek metin boş olamaz.",
      );
      return;
    }

    if (!isCommandSummary && text.length > AI_MAX_INPUT_CHARS) {
      setPageError("Metin çok uzun, lütfen kısalt.");
      return;
    }

    setPageError("");
    setOutputState({
      action: selectedAction,
      error: null,
      isLoading: true,
      output: "",
      provider: null,
      sourceNoteId: null,
      sourceTitle: title.trim(),
    });

    const payload: AiActionRequest = {
      action: selectedAction,
      text,
      title: title.trim(),
    };

    try {
      const response = await fetch(
        isCommandSummary
          ? "/api/ai/daily-command-summary"
          : isDailySummary
            ? "/api/ai/daily-journal-summary"
            : "/api/ai/note-action",
        isCommandSummary
          ? { method: "POST" }
          : {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
      );

      const result = (await response.json()) as AiActionResponse;

      if (!response.ok || !result.success) {
        const error =
          isCommandSummary || isDailySummary
            ? isCommandSummary
              ? "Komuta özeti oluşturulamadı. Birazdan tekrar deneyebilirsin."
              : "Özet oluşturulamadı. Birazdan tekrar deneyebilirsin."
            : result.success
              ? "AI işlemi tamamlanamadı. Lütfen tekrar dene."
              : getUserFacingError(
                  result.error,
                  "AI işlemi tamamlanamadı. Lütfen tekrar dene.",
                );

        setOutputState({
          action: selectedAction,
          error,
          isLoading: false,
          output: "",
          provider: null,
          sourceNoteId: null,
          sourceTitle: title.trim(),
        });
        return;
      }

      setOutputState({
        action: result.action ?? selectedAction,
        error: null,
        isLoading: false,
        output: result.output,
        provider: result.provider ?? null,
        sourceNoteId: null,
        sourceTitle: title.trim(),
      });
    } catch {
      setOutputState({
        action: selectedAction,
        error: isCommandSummary
          ? "Komuta özeti oluşturulamadı. Birazdan tekrar deneyebilirsin."
          : isDailySummary
            ? "Özet oluşturulamadı. Birazdan tekrar deneyebilirsin."
            : "AI işlemi tamamlanamadı. Lütfen tekrar dene.",
        isLoading: false,
        output: "",
        provider: null,
        sourceNoteId: null,
        sourceTitle: title.trim(),
      });
    }
  }

  async function handleCopyOutput() {
    if (!outputState.output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatAiOutputForDisplay(outputState.output),
      );
      showNotice("AI çıktısı panoya kopyalandı.");
    } catch {
      setPageError("Çıktı panoya kopyalanamadı. Lütfen tekrar dene.");
    }
  }

  async function handleSaveAsNote() {
    if (!outputState.output) {
      return;
    }

    setIsSavingAsNote(true);
    setPageError("");

    try {
      const result = await createNote({
        title: buildNoteTitle(outputState.sourceTitle, outputState.action),
        content: formatAiOutputForNote(outputState.output),
        categoryId: null,
        tags: outputState.action === "daily_summary" ? ["günlük"] : [],
        isPinned: false,
      });

      if (result.error) {
        setPageError(
          outputState.action === "command_summary"
            ? "AI komuta özeti nota kaydedilemedi. Lütfen tekrar dene."
            : outputState.action === "daily_summary"
            ? "Günün özeti nota kaydedilemedi. Lütfen tekrar dene."
            : getUserFacingError(
                result.error,
                "AI çıktısı nota kaydedilemedi. Lütfen tekrar dene.",
              ),
        );
        return;
      }

      showNotice(
        outputState.action === "command_summary"
          ? "AI komuta özeti Notlar'a kaydedildi."
          : outputState.action === "daily_summary"
          ? "Günün özeti Notlar'a kaydedildi."
          : "AI çıktısı yeni not olarak kaydedildi.",
      );
    } catch {
      setPageError(
        outputState.action === "command_summary"
          ? "AI komuta özeti nota kaydedilemedi. Lütfen tekrar dene."
          : outputState.action === "daily_summary"
          ? "Günün özeti nota kaydedilemedi. Lütfen tekrar dene."
          : "AI çıktısı nota kaydedilemedi. Lütfen tekrar dene.",
      );
    } finally {
      setIsSavingAsNote(false);
    }
  }

  function resetOutputPanel() {
    setOutputState(createEmptyOutputState());
  }

  function handleClearDailySummary() {
    setInput("");
    setTitle("");
    setPageError("");
    resetOutputPanel();
  }

  function handleSelectAction(action: AiActionKey) {
    setSelectedAction(action);
    setPageError("");
    if (outputState.action && outputState.action !== action) {
      resetOutputPanel();
    }
  }

  const selectedDefinition = getAiActionDefinition(selectedAction);

  return (
    <div className="space-y-6">
      {!isAiConfigured ? (
        <div
          className="app-surface-2 app-border app-text flex items-start gap-3 rounded-xl border p-3 text-xs leading-5"
          role="status"
        >
          <Bot className="app-primary mt-0.5 size-4 shrink-0" />
          Akıllı asistan şu anda demo modunda çalışıyor. Temel örnek çıktılar
          gösterilecek.
        </div>
      ) : null}
      {showSensitiveWarning ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-100/80">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
          {isEnglish
            ? "Review text containing sensitive data before sending it to AI."
            : "Hassas veri içeren metinleri AI'a göndermeden önce kontrol et."}
        </div>
      ) : null}
      <div>
        <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
          {isEnglish ? "Smart tools" : "Akıllı araçlar"}
        </p>
        <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
          {isEnglish ? "AI Assistant" : "AI Asistan"}
        </h1>
        <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
          {isEnglish
            ? "Summarize independent text, improve its tone or create executive-ready output."
            : "Notlardan bağımsız metinleri burada özetleyebilir, daha premium bir dile taşıyabilir ya da yöneticiye sunulabilir çıktılar üretebilirsin."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          className="h-auto justify-start px-4 py-3 text-left"
          onClick={() => {
            setSelectedAction("command_summary");
            setPageError("");
            resetOutputPanel();
          }}
          variant={isCommandSummary ? "primary" : "secondary"}
        >
          <Bot className="size-4 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">
              AI Komuta Özeti
            </span>
            <span className="app-muted mt-1 block whitespace-normal text-[10px] leading-4">
              Görev, finans, takvim ve notlardan öncelikli aksiyon çıkarır.
            </span>
          </span>
        </Button>
        <Button
          className="h-auto justify-start px-4 py-3 text-left"
          onClick={() => {
            setSelectedAction("daily_summary");
            setPageError("");
            resetOutputPanel();
          }}
          variant={isDailySummary ? "primary" : "secondary"}
        >
          <Sparkles className="size-4 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">
              Günün Özeti
            </span>
            <span className="app-muted mt-1 block whitespace-normal text-[10px] leading-4">
              Dağınık günlük notlarını düzenli bir kayda çevirir.
            </span>
          </span>
        </Button>
      </div>

      {notice ? (
        <div
          className="app-surface fixed inset-x-3 top-20 z-[100] flex items-center gap-2 rounded-xl border border-emerald-400/20 px-4 py-3 text-xs font-medium text-emerald-400 shadow-2xl sm:left-auto sm:right-4"
          role="status"
        >
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="app-primary-bg flex size-10 items-center justify-center rounded-xl">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="app-text text-base font-semibold">
                {isCommandSummary
                  ? "AI Komuta Özeti"
                  : isDailySummary
                    ? "Günün Özeti"
                    : "Metin işleme alanı"}
              </h2>
              <p className="app-muted text-xs leading-5">
                {isCommandSummary
                  ? "Bugünkü görev, finans, takvim ve notlarını analiz ederek öncelikli aksiyonları çıkarır."
                  : isDailySummary
                    ? "Bugün neler yaptığını dağınık şekilde yaz. AI bunu düzenli ve özenli bir günlük nota çevirecek."
                    : selectedDefinition.description}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {isCommandSummary ? (
              <div className="app-surface-2 app-border rounded-2xl border p-4">
                <p className="app-text text-sm font-semibold">
                  Hazır komuta bağlamı
                </p>
                <p className="app-muted mt-2 text-xs leading-6">
                  Sistem bugünkü görevleri, takvim kayıtlarını, finans ve taksit
                  risklerini, son notları ve raporları güvenli şekilde toparlar.
                  Sen sadece özeti oluştur düğmesine bas.
                </p>
              </div>
            ) : !isDailySummary ? (
              <div>
                <label
                  className="app-muted mb-2 block text-xs font-medium"
                  htmlFor="ai-title"
                >
                  Başlık (opsiyonel)
                </label>
                <input
                  className="app-input h-11 w-full rounded-xl border px-3 text-sm outline-none"
                  id="ai-title"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="İsteğe bağlı bir başlık ekle..."
                  value={title}
                />
              </div>
            ) : null}

            {!isCommandSummary ? (
            <div>
              <label
                className="app-muted mb-2 block text-xs font-medium"
                htmlFor="ai-input"
              >
                {isDailySummary ? "Bugün neler yaptın?" : "Metin"}
              </label>
              <textarea
                className="app-input min-h-72 w-full max-w-full resize-y rounded-2xl border px-4 py-3 text-sm leading-7 outline-none [overflow-wrap:anywhere]"
                id="ai-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  isDailySummary
                    ? "Örnek: Sabah ofise gittim, öğlen toplantı yaptım, akşam şu işi tamamladım, sonra eve geçtim..."
                    : "İşlemek istediğin metni buraya yapıştır..."
                }
                value={input}
              />
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="app-muted">
                  Maksimum {AI_MAX_INPUT_CHARS} karakter
                </span>
                <span
                  className={
                    remainingCharacters < 0 ? "text-rose-400" : "app-muted"
                  }
                >
                  {remainingCharacters}
                </span>
              </div>
            </div>
            ) : null}

            <div>
              <p className="app-muted mb-3 text-xs font-medium">
                Aksiyon seçimi
              </p>
              <AiActionButtons
                activeAction={null}
                disabled={outputState.isLoading}
                includeDailySummary
                mode="select"
                onAction={handleSelectAction}
                selectedAction={selectedAction}
              />
            </div>

            {pageError ? (
              <div
                className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-6 text-rose-200"
                role="alert"
              >
                {pageError}
              </div>
            ) : null}

            <Button
              className="w-full sm:w-auto"
              disabled={outputState.isLoading}
              onClick={handleRunAction}
            >
              {outputState.isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {outputState.isLoading
                ? isCommandSummary
                  ? "Komuta özeti hazırlanıyor..."
                  : isDailySummary
                  ? "Özet hazırlanıyor..."
                  : "AI ile işleniyor..."
                : isCommandSummary
                  ? "Komuta Özeti Oluştur"
                  : isDailySummary
                  ? "Özet Oluştur"
                  : "AI ile işle"}
            </Button>
          </div>
        </Card>

        {outputState.action ? (
          <AiOutputPanel
            action={outputState.action}
            error={outputState.error}
            inline
            isLoading={outputState.isLoading}
            isSavingAsNote={isSavingAsNote}
            isVisible
            loadingDescription={
              isCommandSummary
                ? "Günlük veriler komuta özeti için sadeleştiriliyor."
                : isDailySummary
                ? "Günlük notun düzenli ve özenli bir kayda dönüştürülüyor."
                : undefined
            }
            loadingTitle={
              isCommandSummary
                ? "Komuta özeti hazırlanıyor..."
                : isDailySummary
                  ? "Özet hazırlanıyor..."
                  : undefined
            }
            onClear={
              isDailySummary ? handleClearDailySummary : undefined
            }
            onClose={resetOutputPanel}
            onCopy={handleCopyOutput}
            onRegenerate={
              isDailySummary || isCommandSummary
                ? () => void handleRunAction()
                : undefined
            }
            onSaveAsNote={handleSaveAsNote}
            output={outputState.output}
            provider={outputState.provider}
            saveLabel={
              isDailySummary || isCommandSummary ? "Nota Kaydet" : undefined
            }
            sourceTitle={outputState.sourceTitle}
          />
        ) : (
          <Card className="flex min-h-[32rem] flex-col items-center justify-center p-6 text-center">
            <span className="app-primary-bg flex size-14 items-center justify-center rounded-2xl">
              <Bot className="size-6" />
            </span>
            <h2 className="app-text mt-5 text-lg font-semibold">
              AI çıktısı burada görünecek
            </h2>
            <p className="app-muted mt-2 max-w-sm text-sm leading-6">
              {isCommandSummary
                ? "Komuta özeti oluşturduğunda günlük önceliklerin ve uyarıların burada görünecek."
                : isDailySummary
                  ? "Gün içinde yaşadıklarını yazıp özet oluşturduğunda düzenli günlük kaydın burada görünecek."
                  : "Soldan bir aksiyon seçip metnini işlediğinde özet, premium metin veya rapor sonucunu bu panelde göreceksin."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
