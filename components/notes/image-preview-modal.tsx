"use client";

import { ImageIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NoteImage } from "@/types";

interface ImagePreviewModalProps {
  image: NoteImage | null;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: (image: NoteImage) => void;
}

export function ImagePreviewModal({
  image,
  isDeleting,
  onClose,
  onDelete,
}: ImagePreviewModalProps) {
  if (!image) return null;

  return (
    <div
      aria-labelledby="image-preview-title"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      role="dialog"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111114] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400">
              Görsel önizleme
            </p>
            <h2
              className="mt-1 truncate text-sm font-semibold text-zinc-200"
              id="image-preview-title"
            >
              {image.file_name}
            </h2>
          </div>
          <button
            aria-label="Görsel önizlemeyi kapat"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-72 flex-1 bg-black/40 p-3 sm:p-5">
          {image.signedUrl ? (
            <div
              aria-label={image.file_name}
              className="h-[65vh] max-h-[720px] min-h-72 w-full bg-contain bg-center bg-no-repeat"
              role="img"
              style={{ backgroundImage: `url("${image.signedUrl}")` }}
            />
          ) : (
            <div className="flex h-[55vh] min-h-72 flex-col items-center justify-center text-zinc-700">
              <ImageIcon className="size-10" />
              <p className="mt-3 text-xs">Önizleme bağlantısı alınamadı.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-medium text-zinc-300">{image.file_name}</p>
            <p className="mt-1 text-[10px] text-zinc-600">
              {(image.size_bytes / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button disabled={isDeleting} onClick={onClose} variant="secondary">
              Kapat
            </Button>
            <Button
              className="bg-rose-500 shadow-none hover:bg-rose-400"
              disabled={isDeleting}
              onClick={() => onDelete(image)}
            >
              <Trash2 className="size-4" />
              Sil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
