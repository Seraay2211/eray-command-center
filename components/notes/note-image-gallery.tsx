"use client";

import { ImageIcon } from "lucide-react";
import type { NoteImage } from "@/types";

interface NoteImageGalleryProps {
  images: NoteImage[];
  onOpen: (image: NoteImage) => void;
}

export function NoteImageGallery({
  images,
  onOpen,
}: NoteImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold app-text">
          <ImageIcon className="size-3.5 text-[color:var(--primary)]" />
          Kayıtlı Görseller
        </p>
        <span className="font-mono text-[9px] app-muted">
          {images.length} görsel
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => (
          <button
            className="group relative aspect-square overflow-hidden rounded-xl border text-left transition app-border app-surface-2 hover:border-[var(--primary)]"
            key={image.id}
            onClick={() => onOpen(image)}
            type="button"
          >
            {image.signedUrl ? (
              <span
                aria-label={image.file_name}
                className="block size-full bg-cover bg-center transition duration-300 group-hover:scale-105"
                role="img"
                style={{ backgroundImage: `url("${image.signedUrl}")` }}
              />
            ) : (
              <span className="flex size-full items-center justify-center app-muted">
                <ImageIcon className="size-5" />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-5 text-[9px] font-medium text-zinc-200">
              {image.file_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
