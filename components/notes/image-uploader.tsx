"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import {
  NOTE_IMAGE_MAX_COUNT,
  NOTE_IMAGE_MIME_TYPES,
  validateNoteImageFile,
} from "@/lib/note-images/config";

interface ImageUploaderProps {
  disabled?: boolean;
  existingCount: number;
  files: File[];
  onChange: (files: File[]) => void;
}

interface SelectedImagePreviewProps {
  disabled: boolean;
  file: File;
  onRemove: () => void;
}

function SelectedImagePreview({
  disabled,
  file,
  onRemove,
}: SelectedImagePreviewProps) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  useEffect(
    () => () => {
      URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border app-border app-surface-2">
      <div
        aria-label={file.name}
        className="size-full bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url("${previewUrl}")` }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-6">
        <p className="truncate text-[9px] font-medium text-white">
          {file.name}
        </p>
      </div>
      <button
        aria-label={`${file.name} seçimini kaldır`}
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-lg border border-white/10 bg-black/70 text-white opacity-0 transition hover:bg-rose-500 group-hover:opacity-100"
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function ImageUploader({
  disabled = false,
  existingCount,
  files,
  onChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const remainingCount = NOTE_IMAGE_MAX_COUNT - existingCount - files.length;

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const selectedFiles = Array.from(fileList);

    if (selectedFiles.length > remainingCount) {
      setError("En fazla 5 görsel yükleyebilirsin.");
      return;
    }

    const validationError = selectedFiles
      .map(validateNoteImageFile)
      .find(Boolean);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    onChange([...files, ...selectedFiles]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold app-text">
            <ImagePlus className="size-3.5 text-[color:var(--primary)]" />
            Yeni Görsel
          </p>
          <p className="mt-1 text-[10px] leading-5 app-muted">
            PNG, JPG, WEBP veya GIF. Görsel başına en fazla 5 MB.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[9px] app-muted">
          {existingCount + files.length}/{NOTE_IMAGE_MAX_COUNT}
        </span>
      </div>

      <button
        className="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition app-border app-surface-2 hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || remainingCount <= 0}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[color:var(--primary)]">
          <Upload className="size-4" />
        </span>
        <span className="mt-3 text-xs font-semibold app-text">
          Görsel ekle
        </span>
        <span className="mt-1 text-[10px] app-muted">
          Aynı anda en fazla {Math.max(remainingCount, 0)} görsel seçebilirsin.
        </span>
      </button>

      <input
        accept={NOTE_IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        disabled={disabled || remainingCount <= 0}
        multiple
        onChange={(event) => addFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />

      {files.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, index) => (
            <SelectedImagePreview
              disabled={disabled}
              file={file}
              key={`${file.name}-${file.lastModified}-${index}`}
              onRemove={() =>
                onChange(files.filter((_, fileIndex) => fileIndex !== index))
              }
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-[10px] font-medium text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
