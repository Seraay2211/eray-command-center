"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, ShieldAlert, Sparkles } from "lucide-react";
import { getAiActionDefinition } from "@/lib/ai/actions";
import { AI_MAX_INPUT_CHARS } from "@/lib/ai/config";
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

function buildNoteTitle(sourceTitle: string): string {
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

  const remainingCharacters = useMemo(
    () => AI_MAX_INPUT_CHARS - input.length,
    [input.length],
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function handleRunAction() {
    const text = input.trim();

    if (!text) {
      setPageError("İşlenecek metin boş olamaz.");
      return;
    }

    if (text.length > AI_MAX_INPUT_CHARS) {
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
      const response = await fetch("/api/ai/note-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as AiActionResponse;

      if (!response.ok || !result.success) {
        const error = result.success
          ? "AI işlemi tamamlanamadı. Lütfen tekrar dene."
          : result.error;

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
        action: result.action,
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
        error: "AI işlemi tamamlanamadı. Lütfen tekrar dene.",
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
      await navigator.clipboard.writeText(outputState.output);
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

    const result = await createNote({
      title: buildNoteTitle(outputState.sourceTitle),
      content: outputState.output,
      categoryId: null,
      tags: [],
      isPinned: false,
    });

    setIsSavingAsNote(false);

    if (result.error) {
      setPageError(result.error);
      return;
    }

    showNotice("AI çıktısı yeni not olarak kaydedildi.");
  }

  function resetOutputPanel() {
    setOutputState(createEmptyOutputState());
  }

  const selectedDefinition = getAiActionDefinition(selectedAction);

  return (
    <div className="space-y-6">
      {showSensitiveWarning ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-100/80">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
          {isEnglish
            ? "Review text containing sensitive data before sending it to AI."
            : "Hassas veri içeren metinleri AI'a göndermeden önce kontrol et."}
        </div>
      ) : null}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
          {isEnglish ? "Smart tools" : "Akıllı araçlar"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {isEnglish ? "AI Assistant" : "AI Asistan"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {isEnglish
            ? "Summarize independent text, improve its tone or create executive-ready output."
            : "Notlardan bağımsız metinleri burada özetleyebilir, daha premium bir dile taşıyabilir ya da yöneticiye sunulabilir çıktılar üretebilirsin."}
        </p>
      </div>

      {notice ? (
        <div
          className="fixed right-4 top-20 z-[100] flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-[#101513] px-4 py-3 text-xs font-medium text-emerald-300 shadow-2xl"
          role="status"
        >
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Metin işleme alanı
              </h2>
              <p className="text-xs text-zinc-500">
                {selectedDefinition.description}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                className="mb-2 block text-xs font-medium text-zinc-400"
                htmlFor="ai-title"
              >
                Başlık (opsiyonel)
              </label>
              <input
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10"
                id="ai-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="İsteğe bağlı bir başlık ekle..."
                value={title}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-medium text-zinc-400"
                htmlFor="ai-input"
              >
                Metin
              </label>
              <textarea
                className="min-h-72 w-full resize-y rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10"
                id="ai-input"
                onChange={(event) => setInput(event.target.value)}
                placeholder="İşlemek istediğin metni buraya yapıştır..."
                value={input}
              />
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-zinc-700">
                  Maksimum {AI_MAX_INPUT_CHARS} karakter
                </span>
                <span
                  className={
                    remainingCharacters < 0 ? "text-rose-300" : "text-zinc-500"
                  }
                >
                  {remainingCharacters}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-zinc-400">
                Aksiyon seçimi
              </p>
              <AiActionButtons
                activeAction={null}
                disabled={outputState.isLoading}
                mode="select"
                onAction={setSelectedAction}
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
              AI ile işle
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
            onClose={resetOutputPanel}
            onCopy={handleCopyOutput}
            onSaveAsNote={handleSaveAsNote}
            output={outputState.output}
            provider={outputState.provider}
            sourceTitle={outputState.sourceTitle}
          />
        ) : (
          <Card className="flex min-h-[32rem] flex-col items-center justify-center p-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
              <Bot className="size-6" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-zinc-100">
              AI çıktısı burada görünecek
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              Soldan bir aksiyon seçip metnini işlediğinde özet, premium metin
              veya rapor sonucunu bu panelde göreceksin.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
