import { AlertCircle, ClipboardCopy, LoaderCircle, Plus, X } from "lucide-react";
import { getAiActionDefinition } from "@/lib/ai/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AiActionKey, AiProvider } from "@/types";

interface AiOutputPanelProps {
  action: AiActionKey | null;
  canAppend?: boolean;
  error: string | null;
  inline?: boolean;
  isAppending?: boolean;
  isLoading: boolean;
  isSavingAsNote?: boolean;
  isVisible: boolean;
  onAppend?: () => void;
  onClose: () => void;
  onCopy: () => void;
  onSaveAsNote: () => void;
  output: string;
  provider?: AiProvider | null;
  sourceTitle?: string;
}

function PanelBody({
  action,
  canAppend = false,
  error,
  isAppending = false,
  isLoading,
  isSavingAsNote = false,
  onAppend,
  onClose,
  onCopy,
  onSaveAsNote,
  output,
  provider,
  sourceTitle,
}: Omit<AiOutputPanelProps, "inline" | "isVisible">) {
  const actionLabel = action ? getAiActionDefinition(action).label : "AI Aksiyonu";
  const canUseOutput = Boolean(output) && !isLoading && !error;

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
            AI Çıktısı
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-100">
            {actionLabel}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {provider ? (
              <Badge variant={provider === "gemini" ? "violet" : "amber"}>
                {provider === "gemini" ? "Gemini" : "Demo AI"}
              </Badge>
            ) : null}
            {sourceTitle ? (
              <p className="text-xs text-zinc-500">{sourceTitle}</p>
            ) : null}
          </div>
        </div>
        <button
          aria-label="AI çıktı panelini kapat"
          className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-violet-400/15 bg-violet-500/[0.04] text-center">
            <LoaderCircle className="size-6 animate-spin text-violet-300" />
            <p className="mt-4 text-sm font-medium text-zinc-100">
              AI metni işliyor
            </p>
            <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-500">
              Çıktı hazır olduğunda burada görünecek.
            </p>
          </div>
        ) : error ? (
          <div
            className="flex gap-2.5 rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-sm leading-6 text-rose-100"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            {error}
          </div>
        ) : (
          <div className="min-h-56 whitespace-pre-wrap rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-7 text-zinc-200">
            {output}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] bg-[#0d0d10]/95 px-5 py-4 sm:px-6">
        <Button disabled={!canUseOutput} onClick={onCopy} size="sm" variant="secondary">
          <ClipboardCopy className="size-3.5" />
          Kopyala
        </Button>
        {canAppend && onAppend ? (
          <Button
            disabled={!canUseOutput || isAppending}
            onClick={onAppend}
            size="sm"
            variant="secondary"
          >
            {isAppending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Mevcut nota ekle
          </Button>
        ) : null}
        <Button disabled={!canUseOutput || isSavingAsNote} onClick={onSaveAsNote} size="sm">
          {isSavingAsNote ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Yeni not olarak kaydet
        </Button>
      </div>
    </>
  );
}

export function AiOutputPanel({
  inline = false,
  isVisible,
  ...props
}: AiOutputPanelProps) {
  if (!isVisible) {
    return null;
  }

  if (inline) {
    return (
      <Card className="flex min-h-[32rem] flex-col overflow-hidden">
        <PanelBody {...props} />
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        aria-label="AI çıktı paneli arka planı"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={props.onClose}
        type="button"
      />
      <aside
        aria-labelledby="ai-output-panel-title"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/[0.08] bg-[#0d0d10] shadow-[-30px_0_80px_rgba(0,0,0,0.4)]"
        role="dialog"
      >
        <div className="sr-only" id="ai-output-panel-title">
          AI Çıktısı
        </div>
        <PanelBody {...props} />
      </aside>
    </div>
  );
}
