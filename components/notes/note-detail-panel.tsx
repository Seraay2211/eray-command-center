"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Edit3,
  Expand,
  FileText,
  Pin,
  Plus,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { AiActionButtons } from "@/components/ai/ai-action-buttons";
import { InboxActions } from "@/components/inbox/inbox-actions";
import { DeleteImageDialog } from "@/components/notes/delete-image-dialog";
import { ImagePreviewModal } from "@/components/notes/image-preview-modal";
import { NoteImageGallery } from "@/components/notes/note-image-gallery";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  AiActionKey,
  Category,
  NoteImage,
  NoteWithRelations,
  Template,
} from "@/types";

interface NoteDetailPanelProps {
  aiBusyAction: AiActionKey | null;
  aiDisabled: boolean;
  categories: Category[];
  error?: string;
  isBusy: boolean;
  isDeletingImage: boolean;
  note: NoteWithRelations | null;
  onApplyInboxTemplate: (
    note: NoteWithRelations,
    template: Template,
    mode: "update" | "new",
    variables?: Record<string, string>,
  ) => Promise<void>;
  onAiAction: (note: NoteWithRelations, action: AiActionKey) => void;
  onClose: () => void;
  onConvertInboxToReport: (note: NoteWithRelations) => Promise<void>;
  onConvertInboxToTask: (note: NoteWithRelations) => Promise<void>;
  onCreate: () => void;
  onDelete: (note: NoteWithRelations) => void;
  onDeleteImage: (image: NoteImage) => Promise<boolean>;
  onEdit: (note: NoteWithRelations) => void;
  onMoveInboxCategory: (
    note: NoteWithRelations,
    categoryId: string,
  ) => Promise<void>;
  onOpenFullscreenEdit: (note: NoteWithRelations) => void;
  onTogglePin: (note: NoteWithRelations) => void;
  templates: Template[];
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NoteDetailPanel({
  aiBusyAction,
  aiDisabled,
  categories,
  error = "",
  isBusy,
  isDeletingImage,
  note,
  onApplyInboxTemplate,
  onAiAction,
  onClose,
  onConvertInboxToReport,
  onConvertInboxToTask,
  onCreate,
  onDelete,
  onDeleteImage,
  onEdit,
  onMoveInboxCategory,
  onOpenFullscreenEdit,
  onTogglePin,
  templates,
}: NoteDetailPanelProps) {
  const [previewImage, setPreviewImage] = useState<NoteImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<NoteImage | null>(null);
  const isVisible = Boolean(note || error);

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

  if (!isVisible) {
    return (
      <Card className="hidden min-h-[460px] flex-col items-center justify-center p-8 text-center xl:flex">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] text-violet-300">
          <FileText className="size-6" />
        </span>
        <h2 className="mt-5 text-base font-semibold text-zinc-200">
          Bir not seç
        </h2>
        <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-600">
          Notlarını okumak, düzenlemek veya AI ile işlemek için soldaki
          listeden bir kayıt seç.
        </p>
        <Button className="mt-5" onClick={onCreate} size="sm">
          <Plus className="size-3.5" />
          Yeni Not Oluştur
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "app-surface fixed inset-0 z-[70] flex flex-col overflow-hidden rounded-none xl:sticky xl:top-24 xl:z-auto xl:max-h-[calc(100vh-7rem)] xl:min-h-[560px] xl:rounded-2xl",
          note?.is_pinned && "border-violet-400/20",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.065] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              Not okuma modu
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold text-zinc-100">
              {note?.title ?? "Not bulunamadı"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {note ? (
              <>
                <button
                  aria-label={
                    note.is_pinned
                      ? "Notun sabitlemesini kaldır"
                      : "Notu sabitle"
                  }
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition hover:bg-white/[0.05]",
                    note.is_pinned
                      ? "text-violet-300"
                      : "text-zinc-600 hover:text-violet-300",
                  )}
                  disabled={isBusy}
                  onClick={() => onTogglePin(note)}
                  title={note.is_pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                  type="button"
                >
                  <Pin
                    className="size-4"
                    fill={note.is_pinned ? "currentColor" : "none"}
                  />
                </button>
                <button
                  aria-label="Notu düzenle"
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
                  disabled={isBusy}
                  onClick={() => onEdit(note)}
                  title="Düzenle"
                  type="button"
                >
                  <Edit3 className="size-4" />
                </button>
                <button
                  aria-label="Notu sil"
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-rose-500/[0.08] hover:text-rose-300"
                  disabled={isBusy}
                  onClick={() => onDelete(note)}
                  title="Sil"
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  aria-label="Notu tam ekranda düzenle"
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
                  disabled={isBusy}
                  onClick={() => onOpenFullscreenEdit(note)}
                  title="Tam ekranda düzenle"
                  type="button"
                >
                  <Expand className="size-4" />
                </button>
              </>
            ) : null}
            <button
              aria-label="Not detayını kapat"
              className="flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
              onClick={onClose}
              title="Kapat"
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {error || !note ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-500/[0.07] text-rose-300">
              <AlertCircle className="size-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-zinc-200">
              Not açılamadı
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-600">
              {error || "Bu not artık mevcut değil veya erişim iznin bulunmuyor."}
            </p>
            <Button className="mt-5" onClick={onClose} variant="secondary">
              Listeye dön
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                {note.category ? (
                  <span
                    className="inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${note.category.color}12`,
                      borderColor: `${note.category.color}35`,
                      color: note.category.color,
                    }}
                  >
                    {getCategoryDisplayName(note.category)}
                  </span>
                ) : (
                  <span className="inline-flex rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
                    Kategorisiz
                  </span>
                )}
                {note.is_pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                    <Pin className="size-3" fill="currentColor" />
                    Sabitli
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="text-2xl font-semibold leading-tight tracking-tight text-white">
                  {note.title}
                </h3>
                <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-400">
                  {note.content || "Bu notta henüz içerik bulunmuyor."}
                </p>
              </div>

              {note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
                      key={tag.id}
                      style={{
                        backgroundColor: `${tag.color}10`,
                        borderColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      <TagIcon className="size-2.5" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <NoteImageGallery images={note.images} onOpen={setPreviewImage} />

              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                  AI Aksiyonları
                </p>
                <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                  Açık notu özetle, kısalt veya profesyonel bir çıktıya dönüştür.
                </p>
                <div className="mt-3">
                  <AiActionButtons
                    activeAction={aiBusyAction}
                    disabled={aiDisabled}
                    onAction={(action) => onAiAction(note, action)}
                  />
                </div>
              </div>

              {note.category?.slug === "inbox" ? (
                <InboxActions
                  categories={categories}
                  isBusy={isBusy || isDeletingImage}
                  key={note.id}
                  note={note}
                  onApplyTemplate={onApplyInboxTemplate}
                  onConvertToReport={onConvertInboxToReport}
                  onConvertToTask={onConvertInboxToTask}
                  onMoveCategory={onMoveInboxCategory}
                  onRefineWithAi={(currentNote) => onAiAction(currentNote, "premium")}
                  templates={templates}
                />
              ) : null}

              <div className="grid gap-3 border-t border-white/[0.055] pt-5 text-[10px] text-zinc-600 sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" />
                  Oluşturuldu: {formatDateTime(note.created_at)}
                </span>
                <span className="flex items-center gap-2 sm:justify-end">
                  <CalendarDays className="size-3.5" />
                  Güncellendi: {formatDateTime(note.updated_at)}
                </span>
              </div>
            </div>

          </>
        )}
      </Card>

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
    </>
  );
}
