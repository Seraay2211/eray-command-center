import {
  AlertCircle,
  ClipboardCopy,
  Eraser,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { getAiActionDefinition } from "@/lib/ai/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
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
  loadingDescription?: string;
  loadingTitle?: string;
  onAppend?: () => void;
  onClear?: () => void;
  onClose: () => void;
  onCopy: () => void;
  onRegenerate?: () => void;
  onSaveAsNote: () => void;
  output: string;
  provider?: AiProvider | null;
  saveLabel?: string;
  sourceTitle?: string;
}

function PanelBody({
  action,
  canAppend = false,
  error,
  isAppending = false,
  isLoading,
  isSavingAsNote = false,
  loadingDescription = "Çıktı hazır olduğunda burada görünecek.",
  loadingTitle = "AI metni işliyor",
  onAppend,
  onClear,
  onClose,
  onCopy,
  onRegenerate,
  onSaveAsNote,
  output,
  provider,
  saveLabel = "Yeni not olarak kaydet",
  sourceTitle,
}: Omit<AiOutputPanelProps, "inline" | "isVisible">) {
  const actionLabel = action ? getAiActionDefinition(action).label : "AI Aksiyonu";
  const cleanOutput = formatAiOutputForDisplay(output);
  const canUseOutput = Boolean(cleanOutput) && !isLoading && !error;

  return (
    <>
      <div className="app-border flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div>
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
            AI Çıktısı
          </p>
          <h2 className="app-text mt-1 text-lg font-semibold">
            {actionLabel}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {provider ? (
              <Badge variant={provider === "gemini" ? "violet" : "amber"}>
                {provider === "gemini" ? "AI" : "Demo AI"}
              </Badge>
            ) : null}
            {sourceTitle ? (
              <p className="app-muted text-xs">{sourceTitle}</p>
            ) : null}
          </div>
        </div>
        <button
          aria-label="AI çıktı panelini kapat"
          className="app-button-ghost flex size-9 items-center justify-center rounded-lg transition"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
        {isLoading ? (
          <div className="app-surface-2 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed text-center">
            <LoaderCircle className="app-primary size-6 animate-spin" />
            <p className="app-text mt-4 text-sm font-medium">
              {loadingTitle}
            </p>
            <p className="app-muted mt-2 max-w-sm text-xs leading-6">
              {loadingDescription}
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
          <div className="app-surface-2 app-border app-text min-h-56 min-w-0 max-w-full whitespace-pre-wrap break-words rounded-2xl border p-4 text-sm leading-7 [overflow-wrap:anywhere]">
            {cleanOutput}
          </div>
        )}
      </div>

      <div className="app-surface app-border flex flex-wrap justify-end gap-2 border-t px-5 py-4 sm:px-6">
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
          {saveLabel}
        </Button>
        {onRegenerate ? (
          <Button
            disabled={!canUseOutput}
            onClick={onRegenerate}
            size="sm"
            variant="secondary"
          >
            <RefreshCw className="size-3.5" />
            Yeniden Oluştur
          </Button>
        ) : null}
        {onClear ? (
          <Button
            disabled={isLoading}
            onClick={onClear}
            size="sm"
            variant="ghost"
          >
            <Eraser className="size-3.5" />
            Temizle
          </Button>
        ) : null}
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
        className="app-surface app-border absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l shadow-[-30px_0_80px_rgba(0,0,0,0.4)]"
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
