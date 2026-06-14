import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlannerEventWithLinks } from "@/types";

interface DeletePlannerEventDialogProps {
  event: PlannerEventWithLinks | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeletePlannerEventDialog({
  event,
  isDeleting,
  onCancel,
  onConfirm,
}: DeletePlannerEventDialogProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        aria-label="Silme penceresini kapat"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />
      <Card className="relative w-full max-w-md p-6">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-rose-400/15 bg-rose-500/[0.08] text-rose-300">
          <Trash2 className="size-5" />
        </div>
        <h2 className="mt-5 text-lg font-semibold app-text">
          Plan silinsin mi?
        </h2>
        <p className="mt-2 text-sm leading-6 app-muted">
          <strong className="app-text">{event.title}</strong> kaydı
          kalıcı olarak silinecek.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={isDeleting} onClick={onCancel} variant="secondary">
            İptal
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm}>
            {isDeleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Sil
          </Button>
        </div>
      </Card>
    </div>
  );
}
