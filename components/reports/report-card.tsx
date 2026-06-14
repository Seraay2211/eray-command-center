"use client";

import { memo } from "react";
import {
  CalendarDays,
  ClipboardCopy,
  Edit3,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { ReportTypeBadge } from "@/components/reports/report-type-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportWithSources } from "@/types";

interface ReportCardProps {
  isSelected: boolean;
  onCopy: (report: ReportWithSources) => void;
  onDelete: (report: ReportWithSources) => void;
  onEdit: (report: ReportWithSources) => void;
  onSelect: (report: ReportWithSources) => void;
  report: ReportWithSources;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function ReportCardComponent({
  isSelected,
  onCopy,
  onDelete,
  onEdit,
  onSelect,
  report,
}: ReportCardProps) {
  const preview =
    report.summary?.trim() ||
    report.content.replace(/\s+/g, " ").trim() ||
    "Rapor özeti bulunmuyor.";

  return (
    <Card
      className={cn(
        "group relative flex min-h-56 flex-col overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-[#131317]",
        isSelected && "border-violet-400/35 bg-violet-500/[0.06]",
        report.status === "archived" && "opacity-65",
      )}
    >
      <button
        aria-label={`${report.title} raporunu aç`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70"
        onClick={() => onSelect(report)}
        type="button"
      />

      <div className="pointer-events-none relative z-[1] flex flex-wrap items-center gap-2">
        <ReportTypeBadge reportType={report.report_type} />
        <ReportStatusBadge status={report.status} />
        {report.ai_generated ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
            <Sparkles className="size-3" />
            AI
          </span>
        ) : null}
      </div>

      <h2 className="pointer-events-none relative z-[1] mt-4 line-clamp-2 text-base font-semibold leading-6 text-zinc-100">
        {report.title}
      </h2>
      <p className="pointer-events-none relative z-[1] mt-2 line-clamp-4 flex-1 text-xs leading-5 text-zinc-600">
        {preview}
      </p>

      <div className="pointer-events-none relative z-[1] mt-4 flex items-center justify-between border-t border-white/[0.055] pt-3">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-700">
          <CalendarDays className="size-3.5" />
          {formatDate(report.updated_at)}
        </span>
        <div className="pointer-events-auto relative z-10 flex items-center gap-1">
          <button
            aria-label={`${report.title} içeriğini kopyala`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            onClick={(event) => {
              event.stopPropagation();
              onCopy(report);
            }}
            type="button"
          >
            <ClipboardCopy className="size-3.5" />
          </button>
          <button
            aria-label={`${report.title} raporunu düzenle`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(report);
            }}
            type="button"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            aria-label={`${report.title} raporunu sil`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-rose-500/[0.08] hover:text-rose-300"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(report);
            }}
            type="button"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export const ReportCard = memo(
  ReportCardComponent,
  (previous, next) =>
    previous.isSelected === next.isSelected &&
    previous.report === next.report,
);
