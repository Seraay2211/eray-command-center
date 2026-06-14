"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyCommandResponse {
  error?: string;
  output?: string;
  provider?: "demo" | "gemini";
  success: boolean;
}

export function AiDailyPlan() {
  const [output, setOutput] = useState("");
  const [provider, setProvider] = useState<"demo" | "gemini" | null>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function generatePlan() {
    setIsPending(true);
    setError("");

    try {
      const response = await fetch("/api/ai/daily-command-summary", {
        method: "POST",
      });
      const payload = (await response.json()) as DailyCommandResponse;

      if (!response.ok || !payload.success || !payload.output) {
        setError(payload.error ?? "AI günlük planı oluşturulamadı.");
        return;
      }

      setOutput(payload.output);
      setProvider(payload.provider ?? "demo");
    } catch {
      setError("AI günlük planı oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-5">
      <Button
        className="w-full sm:w-auto"
        disabled={isPending}
        onClick={() => void generatePlan()}
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {isPending ? "Günlük plan hazırlanıyor..." : "AI Günlük Plan Oluştur"}
      </Button>

      {error ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-3 text-xs text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {output ? (
        <div className="app-surface relative mt-4 rounded-xl border p-4 sm:p-5">
          <button
            aria-label="AI günlük planını kapat"
            className="app-button-ghost absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg"
            onClick={() => setOutput("")}
            type="button"
          >
            <X className="size-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Bot className="app-primary size-4" />
            <p className="app-text text-xs font-semibold">AI Günlük Plan</p>
            <span className="app-surface-2 app-muted rounded-full border px-2 py-0.5 text-[9px]">
              {provider === "gemini" ? "Gemini" : "Demo"}
            </span>
          </div>
          <p className="app-text mt-4 whitespace-pre-wrap text-xs leading-6 sm:text-sm">
            {output}
          </p>
          <p className="app-muted mt-4 flex items-center gap-2 text-[10px]">
            <CheckCircle2 className="size-3.5 text-[var(--success)]" />
            AI çıktıları kişisel planlama amaçlıdır.
          </p>
        </div>
      ) : null}
    </div>
  );
}
