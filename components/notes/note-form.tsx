"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Expand,
  FolderPlus,
  LoaderCircle,
  Pin,
  Tags,
  X,
} from "lucide-react";
import { DeleteImageDialog } from "@/components/notes/delete-image-dialog";
import { ImagePreviewModal } from "@/components/notes/image-preview-modal";
import { ImageUploader } from "@/components/notes/image-uploader";
import { NoteImageGallery } from "@/components/notes/note-image-gallery";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import type {
  Category,
  CreateNoteInput,
  NoteImage,
  NoteWithRelations,
} from "@/types";

interface NoteFormProps {
  categories: Category[];
  defaultCategoryId: string | null;
  error: string;
  isCreatingCategories: boolean;
  isDeletingImage: boolean;
  isOpen: boolean;
  isSaving: boolean;
  note: NoteWithRelations | null;
  onClose: () => void;
  onCreateDefaultCategories: () => void;
  onDeleteImage: (image: NoteImage) => Promise<boolean>;
  onOpenFullscreen: (note: NoteWithRelations | null) => void;
  onSubmit: (input: CreateNoteInput, files: File[]) => void;
}

const fieldClassName =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10 disabled:cursor-wait disabled:opacity-60";

export function NoteForm({
  categories,
  defaultCategoryId,
  error,
  isCreatingCategories,
  isDeletingImage,
  isOpen,
  isSaving,
  note,
  onClose,
  onCreateDefaultCategories,
  onDeleteImage,
  onOpenFullscreen,
  onSubmit,
}: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    note ? (note.category_id ?? "") : (defaultCategoryId ?? ""),
  );
  const [tags, setTags] = useState(
    note?.tags.map((tag) => tag.name).join(", ") ?? "",
  );
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<NoteImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<NoteImage | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || isSaving || isDeletingImage) return;

      if (deletingImage) {
        setDeletingImage(null);
      } else if (previewImage) {
        setPreviewImage(null);
      } else {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [
    deletingImage,
    isDeletingImage,
    isOpen,
    isSaving,
    onClose,
    previewImage,
  ]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      title,
      content,
      categoryId: categoryId || null,
      tags: tags.split(","),
      isPinned,
    }, files);
  }

  async function handleConfirmDeleteImage() {
    if (!deletingImage) return;

    const deleted = await onDeleteImage(deletingImage);

    if (deleted) {
      if (previewImage?.id === deletingImage.id) {
        setPreviewImage(null);
      }

      setDeletingImage(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Not formunu kapat"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        disabled={isSaving || isDeletingImage}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="note-form-title"
        aria-modal="true"
        className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l app-border shadow-[-30px_0_80px_rgba(0,0,0,0.4)]"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              {note ? "Not düzenleme" : "Yeni kayıt"}
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-zinc-100"
              id="note-form-title"
            >
              {note ? "Notu düzenle" : "Yeni not oluştur"}
            </h2>
          </div>
          <button
            aria-label="Not formunu kapat"
            className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            disabled={isSaving || isDeletingImage}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            <div>
              <label
                className="mb-2 block text-xs font-medium text-zinc-400"
                htmlFor="note-title"
              >
                Başlık <span className="text-rose-400">*</span>
              </label>
              <input
                autoFocus
                className={`${fieldClassName} h-11`}
                disabled={isSaving}
                id="note-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Not başlığını yaz..."
                required
                value={title}
              />
              <span className="mt-1.5 block text-right font-mono text-[9px] text-zinc-700">
                {title.length}/200
              </span>
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-medium text-zinc-400"
                htmlFor="note-content"
              >
                İçerik
              </label>
              <textarea
                className={`${fieldClassName} min-h-52 resize-y py-3 leading-6`}
                disabled={isSaving}
                id="note-content"
                onChange={(event) => setContent(event.target.value)}
                placeholder="Not detaylarını, fikirlerini veya operasyon kaydını yaz..."
                value={content}
              />
            </div>

            <NoteImageGallery
              images={note?.images ?? []}
              onOpen={setPreviewImage}
            />

            <ImageUploader
              disabled={isSaving || isDeletingImage}
              existingCount={note?.images.length ?? 0}
              files={files}
              onChange={setFiles}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 block text-xs font-medium text-zinc-400">
                  Kategori
                </p>
                <DarkSelect
                  ariaLabel="Not kategorisi"
                  disabled={isSaving}
                  onChange={setCategoryId}
                  options={[
                    { label: "Kategorisiz", value: "" },
                    ...categories.map((category) => ({
                      label: getCategoryDisplayName(category),
                      value: category.id,
                    })),
                  ]}
                  value={categoryId}
                />
              </div>

              <div>
                <label
                  className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400"
                  htmlFor="note-tags"
                >
                  <Tags className="size-3.5" />
                  Etiketler
                </label>
                <input
                  className={`${fieldClassName} h-11`}
                  disabled={isSaving}
                  id="note-tags"
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="operasyon, ödeme, fikir"
                  value={tags}
                />
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-violet-400/20 bg-violet-500/[0.04] p-4">
                <p className="text-xs font-medium text-zinc-300">
                  Henüz kategori bulunmuyor
                </p>
                <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                  Finans, Yazılım, AI Fikirleri, Kişisel Plan ve Genel
                  kategorilerini tek tıkla oluşturabilirsin.
                </p>
                <Button
                  className="mt-3"
                  disabled={isCreatingCategories || isSaving}
                  onClick={onCreateDefaultCategories}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {isCreatingCategories ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <FolderPlus className="size-3.5" />
                  )}
                  Varsayılan kategorileri oluştur
                </Button>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <span>
                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <Pin className="size-3.5 text-violet-400" />
                  Notu sabitle
                </span>
                <span className="mt-1 block text-[10px] text-zinc-700">
                  Sabitlenen notlar öne çıkarılır.
                </span>
              </span>
              <span
                className={`flex size-5 items-center justify-center rounded-md border transition ${
                  isPinned
                    ? "border-violet-400 bg-violet-500 text-white"
                    : "border-white/15 bg-black/20 text-transparent"
                }`}
              >
                <Check className="size-3.5" />
              </span>
              <input
                checked={isPinned}
                className="sr-only"
                disabled={isSaving}
                onChange={(event) => setIsPinned(event.target.checked)}
                type="checkbox"
              />
            </label>

            {error ? (
              <div
                className="flex gap-2.5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                {error}
              </div>
            ) : null}
          </div>

          <div className="app-surface safe-bottom grid grid-cols-2 gap-2 border-t app-border px-5 py-4 sm:flex sm:justify-end sm:px-6">
            <Button
              disabled={isSaving || isDeletingImage}
              onClick={() => onOpenFullscreen(note)}
              type="button"
              variant="secondary"
            >
              <Expand className="size-4" />
              Tam Ekran Aç
            </Button>
            <Button
              disabled={isSaving || isDeletingImage}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              İptal
            </Button>
            <Button
              disabled={isSaving || isDeletingImage || !title.trim()}
              type="submit"
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isSaving ? "Kaydediliyor..." : "Notu Kaydet"}
            </Button>
          </div>
        </form>
      </aside>
      <ImagePreviewModal
        image={previewImage}
        isDeleting={isDeletingImage}
        onClose={() => setPreviewImage(null)}
        onDelete={setDeletingImage}
      />
      <DeleteImageDialog
        image={deletingImage}
        isDeleting={isDeletingImage}
        onCancel={() => setDeletingImage(null)}
        onConfirm={handleConfirmDeleteImage}
      />
    </div>
  );
}
