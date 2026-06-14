"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportWithSources } from "@/types";

interface DeleteReportDialogProps {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  report: ReportWithSources | null;
}

export function DeleteReportDialog({
  isDeleting,
  onCancel,
  onConfirm,
  report,
}: DeleteReportDialogProps) {
  if (!report) return null;

  return (
    <div aria-labelledby="delete-report-title" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#111114] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-500/[0.08] text-rose-300">
            <Trash2 className="size-5" />
          </span>
          <button aria-label="Silme penceresini kapat" className="flex size-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300" disabled={isDeleting} onClick={onCancel} type="button">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-100" id="delete-report-title">
          Bu rapor silinecek. Emin misin?
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          <span className="font-medium text-zinc-300">“{report.title}”</span> kalıcı olarak silinecek.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={isDeleting} onClick={onCancel} variant="secondary">İptal</Button>
          <Button className="bg-rose-500 shadow-none hover:bg-rose-400" disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? "Siliniyor..." : "Raporu Sil"}
          </Button>
        </div>
      </div>
    </div>
  );
}
