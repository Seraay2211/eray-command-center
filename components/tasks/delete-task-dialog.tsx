"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskWithCategory } from "@/types";

interface DeleteTaskDialogProps {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  task: TaskWithCategory | null;
}

export function DeleteTaskDialog({
  isDeleting,
  onCancel,
  onConfirm,
  task,
}: DeleteTaskDialogProps) {
  if (!task) return null;

  return (
    <div
      aria-labelledby="delete-task-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="app-card w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-500/[0.08] text-rose-300">
            <Trash2 className="size-5" />
          </span>
          <button
            aria-label="Görev silme penceresini kapat"
            className="app-button-ghost flex size-8 items-center justify-center rounded-lg transition"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2
          className="app-text mt-5 text-lg font-semibold"
          id="delete-task-title"
        >
          Bu görev silinecek. Emin misin?
        </h2>
        <p className="app-muted mt-2 text-sm leading-6">
          <span className="app-text font-medium">“{task.title}”</span>{" "}
          kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={isDeleting}
            onClick={onCancel}
            variant="secondary"
          >
            İptal
          </Button>
          <Button
            className="bg-rose-500 shadow-none hover:bg-rose-400"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {isDeleting ? "Siliniyor..." : "Görevi Sil"}
          </Button>
        </div>
      </div>
    </div>
  );
}
