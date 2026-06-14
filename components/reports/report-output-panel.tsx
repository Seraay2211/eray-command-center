"use client";

import {
  ClipboardCopy,
  FilePlus2,
  LoaderCircle,
  RefreshCw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAiProviderLabel } from "@/lib/ai/config";
import type { AiProvider, ReportType } from "@/types";

interface ReportOutputPanelProps {
  content: string;
  isSavingNote: boolean;
  isSavingReport: boolean;
  onClose: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onSaveNote: () => void;
  onSaveReport: () => void;
  provider: AiProvider;
  reportType: ReportType;
  summary: string;
  title: string;
}

export function ReportOutputPanel({
  content,
  isSavingNote,
  isSavingReport,
  onClose,
  onCopy,
  onRegenerate,
  onSaveNote,
  onSaveReport,
  provider,
  summary,
  title,
}: ReportOutputPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-300">
            <Sparkles className="size-3" />
            {getAiProviderLabel(provider)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-zinc-100">{title}</h2>
        </div>
        <button aria-label="AI rapor çıktısını kapat" className="flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-200" onClick={onClose} type="button">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">Kısa özet</p>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{summary}</p>
        </div>
        <article className="whitespace-pre-wrap break-words rounded-xl border border-white/[0.06] bg-black/20 p-5 font-mono text-xs leading-7 text-zinc-300">
          {content}
        </article>
      </div>

      <div className="app-surface safe-bottom flex flex-wrap justify-end gap-2 border-t app-border px-5 py-4 sm:px-6">
        <Button onClick={onCopy} size="sm" variant="secondary">
          <ClipboardCopy className="size-3.5" /> Kopyala
        </Button>
        <Button onClick={onRegenerate} size="sm" variant="secondary">
          <RefreshCw className="size-3.5" /> Yeniden Oluştur
        </Button>
        <Button disabled={isSavingNote} onClick={onSaveNote} size="sm" variant="secondary">
          {isSavingNote ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePlus2 className="size-3.5" />}
          Nota Kaydet
        </Button>
        <Button disabled={isSavingReport} onClick={onSaveReport} size="sm">
          {isSavingReport ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Rapor Olarak Kaydet
        </Button>
      </div>
    </div>
  );
}
