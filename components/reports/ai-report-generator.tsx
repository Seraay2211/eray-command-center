"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarRange,
  Check,
  FileText,
  ListChecks,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { ReportOutputPanel } from "@/components/reports/report-output-panel";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { REPORT_TYPE_OPTIONS } from "@/lib/reports";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type {
  AiProvider,
  AiReportRequest,
  AiReportResponse,
  CreateReportInput,
  NoteWithRelations,
  ReportType,
  TaskWithCategory,
} from "@/types";

interface GeneratedReport {
  content: string;
  provider: AiProvider;
  reportType: ReportType;
  summary: string;
  title: string;
}

interface AiReportGeneratorProps {
  initialTimestamp: number;
  initialType: ReportType;
  isOpen: boolean;
  notes: NoteWithRelations[];
  onClose: () => void;
  onSaveNote: (title: string, content: string) => Promise<boolean>;
  onSaveReport: (input: CreateReportInput) => Promise<boolean>;
  tasks: TaskWithCategory[];
}

type PeriodPreset = "today" | "7days" | "custom";

function getIstanbulDate(timestamp: number, offsetDays = 0): string {
  const date = new Date(timestamp + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function AiReportGenerator({
  initialTimestamp,
  initialType,
  isOpen,
  notes,
  onClose,
  onSaveNote,
  onSaveReport,
  tasks,
}: AiReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [title, setTitle] = useState("");
  const [manualText, setManualText] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(
    initialType === "weekly" ? "7days" : "today",
  );
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);

  const period = useMemo(() => {
    if (periodPreset === "custom") {
      return { start: customStart || null, end: customEnd || null };
    }
    if (periodPreset === "7days") {
      return {
        start: getIstanbulDate(initialTimestamp, -6),
        end: getIstanbulDate(initialTimestamp),
      };
    }
    const today = getIstanbulDate(initialTimestamp);
    return { start: today, end: today };
  }, [customEnd, customStart, initialTimestamp, periodPreset]);

  if (!isOpen) return null;

  function toggleId(id: string, current: string[], update: (ids: string[]) => void) {
    update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleGenerate() {
    if (!manualText.trim() && selectedNoteIds.length === 0 && selectedTaskIds.length === 0) {
      setError("AI raporu oluşturmak için en az bir not, görev veya manuel metin eklemelisin.");
      return;
    }
    if (period.start && period.end && period.start > period.end) {
      setError("Dönem başlangıcı, dönem bitişinden sonra olamaz.");
      return;
    }

    setIsGenerating(true);
    setError("");
    const payload: AiReportRequest = {
      reportType,
      title: title.trim() || undefined,
      manualText: manualText.trim() || undefined,
      notes: selectedNoteIds.map((id) => ({ id, title: "" })),
      tasks: selectedTaskIds.map((id) => ({ id, title: "" })),
      periodStart: period.start,
      periodEnd: period.end,
    };

    try {
      const response = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as AiReportResponse;

      if (!response.ok || !result.success) {
        setError(result.success ? "Rapor oluşturulamadı. Lütfen tekrar dene." : result.error);
        return;
      }

      setGenerated({
        content: result.content,
        provider: result.provider,
        reportType: result.reportType,
        summary: result.summary,
        title: result.title,
      });
    } catch {
      setError("Rapor oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.content);
    } catch {
      setError("Rapor panoya kopyalanamadı.");
    }
  }

  async function handleSaveReport() {
    if (!generated) return;
    setIsSavingReport(true);
    const saved = await onSaveReport({
      title: generated.title,
      content: generated.content,
      summary: generated.summary,
      report_type: generated.reportType,
      status: "draft",
      source_date: period.start === period.end ? period.start : null,
      period_start: period.start,
      period_end: period.end,
      ai_generated: true,
      sources: [
        ...selectedNoteIds.map((source_id) => ({ source_type: "note" as const, source_id })),
        ...selectedTaskIds.map((source_id) => ({ source_type: "task" as const, source_id })),
      ],
    });
    setIsSavingReport(false);
    if (saved) onClose();
  }

  async function handleSaveNote() {
    if (!generated) return;
    setIsSavingNote(true);
    await onSaveNote(generated.title, generated.content);
    setIsSavingNote(false);
  }

  return (
    <div className="fixed inset-0 z-[85]">
      <button aria-label="AI rapor oluşturucuyu kapat" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} type="button" />
      <aside aria-labelledby="ai-report-title" aria-modal="true" className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l app-border shadow-[-30px_0_80px_rgba(0,0,0,0.4)]" role="dialog">
        {generated ? (
          <ReportOutputPanel
            content={generated.content}
            isSavingNote={isSavingNote}
            isSavingReport={isSavingReport}
            onClose={onClose}
            onCopy={handleCopy}
            onRegenerate={() => setGenerated(null)}
            onSaveNote={handleSaveNote}
            onSaveReport={handleSaveReport}
            provider={generated.provider}
            reportType={generated.reportType}
            summary={generated.summary}
            title={generated.title}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">AI rapor merkezi</p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-100" id="ai-report-title">Kaynaklardan rapor oluştur</h2>
              </div>
              <button aria-label="AI rapor oluşturucuyu kapat" className="flex size-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-200" onClick={onClose} type="button">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-400">Rapor tipi</p>
                  <DarkSelect ariaLabel="AI rapor tipi" onChange={(value) => setReportType(value as ReportType)} options={REPORT_TYPE_OPTIONS} value={reportType} />
                </div>
                <label className="text-xs font-medium text-zinc-400">
                  Başlık (opsiyonel)
                  <input className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none focus:border-violet-400/45" onChange={(event) => setTitle(event.target.value)} placeholder="AI uygun başlığı üretebilir" value={title} />
                </label>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400"><CalendarRange className="size-3.5" /> Tarih aralığı</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    ["today", "Bugün"],
                    ["7days", "Son 7 gün"],
                    ["custom", "Özel aralık"],
                  ] as const).map(([value, label]) => (
                    <button className={cn("h-10 rounded-xl border text-xs font-medium transition", periodPreset === value ? "border-violet-400/25 bg-violet-500/10 text-violet-200" : "border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:text-zinc-200")} key={value} onClick={() => setPeriodPreset(value)} type="button">
                      {label}
                    </button>
                  ))}
                </div>
                {periodPreset === "custom" ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input aria-label="Dönem başlangıcı" className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs text-zinc-200 [color-scheme:dark]" onChange={(event) => setCustomStart(event.target.value)} type="date" value={customStart} />
                    <input aria-label="Dönem bitişi" className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs text-zinc-200 [color-scheme:dark]" onChange={(event) => setCustomEnd(event.target.value)} type="date" value={customEnd} />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><FileText className="size-3.5 text-violet-400" /> Notlardan seç</p>
                    <span className="font-mono text-[9px] text-zinc-700">{selectedNoteIds.length} seçili</span>
                  </div>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {notes.length ? notes.slice(0, 30).map((note) => {
                      const selected = selectedNoteIds.includes(note.id);
                      return (
                        <button className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", selected ? "border-violet-400/25 bg-violet-500/[0.08]" : "border-white/[0.06] bg-black/15 hover:border-white/[0.11]")} key={note.id} onClick={() => toggleId(note.id, selectedNoteIds, setSelectedNoteIds)} type="button">
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-violet-400 bg-violet-500 text-white" : "border-white/15 text-transparent")}><Check className="size-3.5" /></span>
                          <span className="min-w-0"><span className="block truncate text-xs font-medium text-zinc-300">{note.title}</span><span className="mt-1 block line-clamp-1 text-[10px] text-zinc-600">{note.content || "İçerik yok"}</span></span>
                        </button>
                      );
                    }) : <p className="py-8 text-center text-[10px] text-zinc-700">Seçilebilir not yok</p>}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><ListChecks className="size-3.5 text-violet-400" /> Görevlerden seç</p>
                    <span className="font-mono text-[9px] text-zinc-700">{selectedTaskIds.length} seçili</span>
                  </div>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {tasks.length ? tasks.slice(0, 30).map((task) => {
                      const selected = selectedTaskIds.includes(task.id);
                      return (
                        <button className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition", selected ? "border-violet-400/25 bg-violet-500/[0.08]" : "border-white/[0.06] bg-black/15 hover:border-white/[0.11]")} key={task.id} onClick={() => toggleId(task.id, selectedTaskIds, setSelectedTaskIds)} type="button">
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-violet-400 bg-violet-500 text-white" : "border-white/15 text-transparent")}><Check className="size-3.5" /></span>
                          <span className="min-w-0"><span className="block truncate text-xs font-medium text-zinc-300">{task.title}</span><span className="mt-1 block text-[10px] text-zinc-600">{TASK_STATUS_LABELS[task.status]} · {TASK_PRIORITY_LABELS[task.priority]}</span></span>
                        </button>
                      );
                    }) : <p className="py-8 text-center text-[10px] text-zinc-700">Seçilebilir görev yok</p>}
                  </div>
                </section>
              </div>

              <label className="block text-xs font-medium text-zinc-400">
                Manuel ek bilgi
                <textarea className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-violet-400/45" onChange={(event) => setManualText(event.target.value)} placeholder="Rapora dahil edilmesini istediğin ek bilgileri yaz..." value={manualText} />
              </label>

              {error ? (
                <div className="flex gap-2.5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200" role="alert">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" /> {error}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-white/[0.06] px-5 py-4 sm:px-6">
              <Button disabled={isGenerating} onClick={handleGenerate}>
                {isGenerating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isGenerating ? "Rapor oluşturuluyor..." : "AI ile Rapor Oluştur"}
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
