"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  FilePenLine,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/providers/settings-provider";
import { getUserFacingError } from "@/lib/user-facing-error";
import { createOrOpenDailyOperationNote } from "@/services/today-actions";

interface TodayActionsProps {
  existingNoteId: string | null;
}

interface AiResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export function TodayActions({ existingNoteId }: TodayActionsProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [aiOutput, setAiOutput] = useState("");

  async function openDailyNote() {
    if (existingNoteId) {
      router.push(`/notes?editor=${existingNoteId}`);
      return;
    }

    setIsCreatingNote(true);
    setNoteError("");
    try {
      const result = await createOrOpenDailyOperationNote();
      if (result.error || !result.data) {
        setNoteError(
          getUserFacingError(
            result.error,
            "Günlük operasyon notu oluşturulamadı.",
          ),
        );
        return;
      }

      router.push(`/notes?editor=${result.data.id}`);
    } catch {
      setNoteError("Günlük operasyon notu oluşturulamadı.");
    } finally {
      setIsCreatingNote(false);
    }
  }

  async function generateAiSummary() {
    setIsGeneratingAi(true);
    setAiOutput("");
    try {
      const response = await fetch("/api/ai/today-summary", {
        method: "POST",
      });
      const payload = (await response.json()) as AiResponse;
      setAiOutput(
        payload.success && payload.output
          ? payload.output
          : getUserFacingError(
              payload.error,
              "AI özeti oluşturulamadı. Lütfen tekrar dene.",
            ),
      );
    } catch {
      setAiOutput(
        "AI özeti şu anda kullanılamıyor. Günlük veriler manuel olarak listelendi.",
      );
    } finally {
      setIsGeneratingAi(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={isCreatingNote}
          onClick={() => void openDailyNote()}
        >
          {isCreatingNote ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <FilePenLine className="size-4" />
          )}
          {isCreatingNote
            ? "Günlük operasyon notu hazırlanıyor..."
            : existingNoteId
              ? "Bugünün Notunu Aç"
              : "Günlük Operasyon Notu Oluştur"}
        </Button>
        {settings.show_ai_summaries ? (
          <Button
            disabled={isGeneratingAi}
            onClick={() => void generateAiSummary()}
            variant="secondary"
          >
            {isGeneratingAi ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isGeneratingAi
              ? "AI günlük özeti hazırlanıyor..."
              : "AI ile Günümü Özetle"}
          </Button>
        ) : null}
      </div>

      {noteError ? (
        <p className="rounded-lg border border-[color-mix(in_srgb,var(--app-danger)_55%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-danger)_10%,var(--app-surface))] px-3 py-2 text-xs app-text">
          {noteError}
        </p>
      ) : null}

      {aiOutput ? (
        <div className="app-card rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Bot className="app-primary size-4" />
            <h2 className="app-text text-sm font-semibold">AI Günlük Özeti</h2>
          </div>
          <p className="app-text mt-3 whitespace-pre-wrap text-sm leading-6">
            {aiOutput}
          </p>
          <p className="app-muted mt-4 text-[11px] leading-5">
            AI çıktıları kişisel planlama amaçlıdır; finansal, hukuki veya
            profesyonel tavsiye değildir.
          </p>
        </div>
      ) : null}
    </div>
  );
}
