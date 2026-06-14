"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  Check,
  Command,
  Copy,
  Expand,
  FolderPlus,
  LoaderCircle,
  PanelRightClose,
  Pin,
  SlidersHorizontal,
  Sparkles,
  Tags,
  WandSparkles,
  X,
} from "lucide-react";
import { AiActionButtons } from "@/components/ai/ai-action-buttons";
import { DeleteImageDialog } from "@/components/notes/delete-image-dialog";
import { ImagePreviewModal } from "@/components/notes/image-preview-modal";
import { ImageUploader } from "@/components/notes/image-uploader";
import { NoteImageGallery } from "@/components/notes/note-image-gallery";
import { getCategoryDisplayName } from "@/lib/categories/display";
import {
  formatAiOutputForDisplay,
  formatAiOutputForNote,
} from "@/lib/ai/format-ai-output";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import type {
  AiActionKey,
  AiActionResponse,
  AiProvider,
  Category,
  CreateNoteInput,
  NoteImage,
  NoteWithRelations,
} from "@/types";

interface EditorStateOverride {
  categoryId?: string;
  content?: string;
  isPinned?: boolean;
  tags?: string;
  title?: string;
}

interface FullscreenNoteEditorProps {
  categories: Category[];
  defaultCategoryId: string | null;
  error: string;
  initialStateOverride?: EditorStateOverride | null;
  isCreatingCategories: boolean;
  isDeletingImage: boolean;
  isOpen: boolean;
  isSaving: boolean;
  note: NoteWithRelations | null;
  onClose: () => void;
  onCreateDefaultCategories: () => void;
  onDeleteImage: (image: NoteImage) => Promise<boolean>;
  onOpenTemplatePicker?: () => void;
  onSave: (
    input: CreateNoteInput,
    files: File[],
    options: { closeAfterSave: boolean; note: NoteWithRelations | null },
  ) => Promise<boolean>;
  templateName?: string | null;
}

const fieldClassName =
  "app-input h-11 w-full rounded-xl border px-4 text-sm outline-none";

function createAiState() {
  return {
    action: null as AiActionKey | null,
    error: null as string | null,
    isLoading: false,
    output: "",
    provider: null as AiProvider | null,
  };
}

function buildInitialState(
  note: NoteWithRelations | null,
  defaultCategoryId: string | null,
  override?: EditorStateOverride | null,
) {
  return {
    categoryId:
      override?.categoryId ??
      (note ? (note.category_id ?? "") : (defaultCategoryId ?? "")),
    content: override?.content ?? note?.content ?? "",
    isPinned: override?.isPinned ?? note?.is_pinned ?? false,
    tags:
      override?.tags ?? note?.tags.map((tag) => tag.name).join(", ") ?? "",
    title: override?.title ?? note?.title ?? "",
  };
}

export function FullscreenNoteEditor({
  categories,
  defaultCategoryId,
  error,
  initialStateOverride,
  isCreatingCategories,
  isDeletingImage,
  isOpen,
  isSaving,
  note,
  onClose,
  onCreateDefaultCategories,
  onDeleteImage,
  onOpenTemplatePicker,
  onSave,
  templateName,
}: FullscreenNoteEditorProps) {
  const initialState = useMemo(
    () => buildInitialState(note, defaultCategoryId, initialStateOverride),
    [defaultCategoryId, initialStateOverride, note],
  );
  const [title, setTitle] = useState(() => initialState.title);
  const [content, setContent] = useState(() => initialState.content);
  const [categoryId, setCategoryId] = useState(() => initialState.categoryId);
  const [tags, setTags] = useState(() => initialState.tags);
  const [isPinned, setIsPinned] = useState(() => initialState.isPinned);
  const [files, setFiles] = useState<File[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<NoteImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<NoteImage | null>(null);
  const [aiState, setAiState] = useState(createAiState);
  const isDirty =
    title !== initialState.title ||
    content !== initialState.content ||
    categoryId !== initialState.categoryId ||
    tags !== initialState.tags ||
    isPinned !== initialState.isPinned ||
    files.length > 0;

  useEffect(() => {
    if (!isOpen || !isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isOpen]);

  const attemptClose = useCallback(() => {
    if (isDirty && !window.confirm("Kaydedilmemiş değişiklikler var.")) {
      return;
    }

    onClose();
  }, [isDirty, onClose]);

  const handleSave = useCallback(
    async (closeAfterSave: boolean) => {
      if (!title.trim()) {
        return;
      }

      await onSave(
        {
          categoryId: categoryId || null,
          content,
          isPinned,
          tags: tags.split(","),
          title,
        },
        files,
        {
          closeAfterSave,
          note,
        },
      );
    },
    [categoryId, content, files, isPinned, note, onSave, tags, title],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSave(true);
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "f"
      ) {
        event.preventDefault();
        setFocusMode((current) => !current);
      }

      if (event.key === "Escape" && !isSaving && !isDeletingImage) {
        event.preventDefault();

        if (deletingImage) {
          setDeletingImage(null);
          return;
        }

        if (previewImage) {
          setPreviewImage(null);
          return;
        }

        attemptClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    attemptClose,
    deletingImage,
    handleSave,
    isDeletingImage,
    isOpen,
    isSaving,
    previewImage,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave(false);
  }

  async function handleRunAiAction(action: AiActionKey) {
    if (!title.trim() && !content.trim()) {
      return;
    }

    setAiState({
      action,
      error: null,
      isLoading: true,
      output: "",
      provider: null,
    });

    try {
      const response = await fetch("/api/ai/note-action", {
        body: JSON.stringify({
          action,
          noteId: note?.id,
          text: content,
          title,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as AiActionResponse;

      if (!response.ok || !result.success) {
        setAiState({
          action,
            error: result.success
            ? "AI işlemi tamamlanamadı. Lütfen tekrar dene."
            : result.error,
          isLoading: false,
          output: "",
          provider: null,
        });
        return;
      }

      setAiState({
        action: result.action,
        error: null,
        isLoading: false,
        output: result.output,
        provider: result.provider ?? null,
      });
    } catch {
      setAiState({
        action,
        error: "AI işlemi tamamlanamadı. Lütfen tekrar dene.",
        isLoading: false,
        output: "",
        provider: null,
      });
    }
  }

  async function handleCopyAiOutput() {
    if (!aiState.output) {
      return;
    }

    await navigator.clipboard.writeText(
      formatAiOutputForDisplay(aiState.output),
    );
  }

  function appendAiOutput() {
    if (!aiState.output) {
      return;
    }

    setContent((current) => {
      const cleanOutput = formatAiOutputForNote(aiState.output);
      return current.trim()
        ? `${current.trim()}\n\n${cleanOutput}`
        : cleanOutput;
    });
  }

  async function handleConfirmDeleteImage() {
    if (!deletingImage) {
      return;
    }

    const deleted = await onDeleteImage(deletingImage);

    if (deleted) {
      if (previewImage?.id === deletingImage.id) {
        setPreviewImage(null);
      }

      setDeletingImage(null);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[130]"
      style={{ backgroundColor: "var(--background)", color: "var(--text)" }}
    >
      <form
        className="flex size-full flex-col"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <header className="app-topbar app-border safe-top flex shrink-0 flex-col gap-3 border-b px-3 py-3 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_12px_32px_color-mix(in_srgb,var(--primary)_24%,transparent)] sm:size-11">
              <Command className="size-6" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="shrink-0">
                  <span className="block text-sm font-semibold tracking-tight app-text">
                    Eray Command
                  </span>
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.24em] app-muted">
                    Center
                  </span>
                </div>
                <span className="hidden h-7 w-px app-surface-2 sm:block" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
                    Tam Ekran Not Editörü
                  </p>
                  <p className="mt-0.5 truncate text-xs app-muted">
                    {note ? "Not düzenleniyor" : "Yeni not oluşturuluyor"}
                    {templateName ? ` · Aktif Şablon: ${templateName}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:shrink-0 lg:justify-end">
            {!focusMode && onOpenTemplatePicker ? (
              <Button className="w-full sm:w-auto" onClick={onOpenTemplatePicker} size="sm" type="button" variant="secondary">
                <WandSparkles className="size-3.5" />
                Şablon Seç
              </Button>
            ) : null}
            {!focusMode ? (
              <Button
                className="w-full sm:w-auto xl:hidden"
                onClick={() => setMobileSettingsOpen(true)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <SlidersHorizontal className="size-3.5" />
                Not Ayarları
              </Button>
            ) : null}
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setMobileSettingsOpen(false);
                setFocusMode((current) => !current);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {focusMode ? (
                <PanelRightClose className="size-3.5" />
              ) : (
                <Expand className="size-3.5" />
              )}
              {focusMode ? "Odaktan Çık" : "Odak Modu"}
            </Button>
            <Button className="w-full sm:w-auto" onClick={attemptClose} size="sm" type="button" variant="secondary">
              <X className="size-3.5" />
              Kapat
            </Button>
            <Button
              disabled={isSaving || isDeletingImage || !title.trim()}
              className="w-full sm:w-auto"
              onClick={() => void handleSave(false)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isSaving ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Kaydet
            </Button>
            <Button
              disabled={isSaving || isDeletingImage || !title.trim()}
              className="col-span-2 w-full sm:w-auto"
              onClick={() => void handleSave(true)}
              size="sm"
              type="button"
            >
              {isSaving ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Kaydet ve Kapat
            </Button>
          </div>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto xl:grid xl:overflow-hidden ${
            focusMode ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_380px]"
          }`}
        >
          <main
            className={`min-h-0 px-3 py-4 sm:px-6 sm:py-7 ${
              focusMode ? "xl:px-10" : "xl:pr-8"
            }`}
          >
            <div
              className={`mx-auto flex h-full min-h-0 flex-col gap-5 ${
                focusMode ? "max-w-6xl" : "max-w-[1480px]"
              }`}
            >
              <section className="rounded-2xl border px-4 py-4 app-border app-surface sm:px-7 sm:py-5">
                <label
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] app-muted"
                  htmlFor="fullscreen-note-main-title"
                >
                  Başlık
                </label>
                <input
                  autoFocus
                  className="mt-2 w-full min-w-0 border-0 bg-transparent text-2xl font-semibold tracking-[-0.035em] outline-none placeholder:text-[var(--muted)] sm:text-4xl"
                  id="fullscreen-note-main-title"
                  maxLength={200}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Not başlığını yaz..."
                  value={title}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] app-muted">
                  <span>{note ? "Mevcut not" : "Yeni not"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{content.length.toLocaleString("tr-TR")} karakter</span>
                  {isDirty ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-500">
                        Kaydedilmemiş değişiklikler
                      </span>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border app-border app-surface">
                <div className="flex items-center justify-between border-b px-5 py-3 app-border sm:px-7">
                  <div>
                    <p className="text-xs font-semibold app-text">İçerik</p>
                    <p className="mt-0.5 text-[10px] app-muted">
                      Düşüncelerini düzenle, geliştir ve güvenle kaydet.
                    </p>
                  </div>
                  {focusMode ? (
                    <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium app-border app-surface-2 app-muted">
                      Odak Modu
                    </span>
                  ) : null}
                </div>
                <textarea
                  className={`w-full resize-none border-0 bg-transparent px-4 py-5 outline-none placeholder:text-[var(--muted)] sm:px-7 sm:py-7 ${
                    focusMode
                      ? "min-h-[68dvh] text-base leading-8"
                      : "min-h-[56dvh] text-[15px] leading-8 xl:h-full xl:min-h-[54vh]"
                  }`}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Notunu buraya yaz. Fikirlerini, operasyon kayıtlarını, planlarını veya rapor taslaklarını düzenli şekilde kaydet."
                  value={content}
                />
              </section>

              {error ? (
                <div className="flex gap-2.5 rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-sm leading-6 text-rose-100">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  {error}
                </div>
              ) : null}
            </div>
          </main>

          {!focusMode ? (
            <>
              <button
                aria-label="Not ayarlarını kapat"
                className={`fixed inset-0 z-10 bg-black/65 transition-opacity xl:hidden ${
                  mobileSettingsOpen
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
                onClick={() => setMobileSettingsOpen(false)}
                type="button"
              />
              <aside
                aria-label="Not ayarları"
                className={`app-surface-2 fixed inset-x-0 bottom-0 z-20 max-h-[78dvh] overflow-y-auto rounded-t-3xl border-t px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl transition-transform app-border sm:px-5 xl:static xl:z-auto xl:block xl:max-h-none xl:min-h-0 xl:translate-y-0 xl:overflow-y-auto xl:rounded-none xl:border-l xl:border-t-0 xl:py-6 xl:shadow-none ${
                  mobileSettingsOpen
                    ? "translate-y-0"
                    : "translate-y-full xl:translate-y-0"
                }`}
              >
                <div className="mb-4 flex items-center justify-between xl:hidden">
                  <div>
                    <p className="app-text text-sm font-semibold">Not Ayarları</p>
                    <p className="app-muted mt-0.5 text-[10px]">
                      Kategori, görsel ve AI seçenekleri
                    </p>
                  </div>
                  <button
                    aria-label="Not ayarlarını kapat"
                    className="app-button-ghost flex size-10 items-center justify-center rounded-xl"
                    onClick={() => setMobileSettingsOpen(false)}
                    type="button"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              <div className="space-y-6">
                <div className="rounded-2xl border p-5 app-border app-surface">
                  <p className="text-sm font-semibold app-text">Not Ayarları</p>
                  <p className="mt-1 text-[11px] leading-5 app-muted">
                    Notun temel bilgilerini ve görünümünü düzenle.
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        className="mb-2 block text-xs font-medium app-muted"
                        htmlFor="fullscreen-note-title"
                      >
                        Başlık
                      </label>
                      <input
                        className={fieldClassName}
                        disabled={isSaving}
                        id="fullscreen-note-title"
                        maxLength={200}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Not başlığını yaz..."
                        value={title}
                      />
                    </div>

                    <div>
                      <p className="mb-2 block text-xs font-medium app-muted">
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
                        className="mb-2 flex items-center gap-1.5 text-xs font-medium app-muted"
                        htmlFor="fullscreen-note-tags"
                      >
                        <Tags className="size-3.5" />
                        Etiketler
                      </label>
                      <input
                        className={fieldClassName}
                        disabled={isSaving}
                        id="fullscreen-note-tags"
                        onChange={(event) => setTags(event.target.value)}
                        placeholder="operasyon, ödeme, fikir"
                        value={tags}
                      />
                    </div>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-5 app-border app-surface">
                    <p className="text-xs font-medium app-text">
                      Henüz kategori bulunmuyor
                    </p>
                    <p className="mt-1 text-[11px] leading-5 app-muted">
                      Hızlı Kayıt ve diğer temel kategorileri tek adımda hazırlayabilirsin.
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

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border p-5 app-border app-surface">
                  <span>
                    <span className="flex items-center gap-2 text-xs font-semibold app-text">
                      <Pin className="size-3.5 text-[color:var(--primary)]" />
                      Notu sabitle
                    </span>
                    <span className="mt-1 block text-[10px] app-muted">
                      Sabitlenen notlar listede yukarı taşınır.
                    </span>
                  </span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-md border transition ${
                      isPinned
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                        : "app-border app-surface-2 text-transparent"
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

                <div className="rounded-2xl border p-5 app-border app-surface">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold app-text">Şablon Akışı</p>
                      <p className="mt-1 text-[11px] leading-5 app-muted">
                        Hazır bir format seçip bu editörü onunla başlatabilirsin.
                      </p>
                    </div>
                    {onOpenTemplatePicker ? (
                      <Button onClick={onOpenTemplatePicker} size="sm" type="button" variant="secondary">
                        <WandSparkles className="size-3.5" />
                        Şablon Seç
                      </Button>
                    ) : null}
                  </div>
                  {templateName ? (
                    <div className="mt-3 rounded-2xl border px-3 py-2 text-xs app-border app-surface-2 app-text">
                      Aktif Şablon: {templateName}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border p-5 app-border app-surface">
                  <p className="text-xs font-semibold app-text">Görseller</p>
                  <p className="mt-1 text-[11px] leading-5 app-muted">
                    Nota bağlı görselleri görüntüle veya yeni bir görsel ekle.
                  </p>
                  <div className="mt-4 space-y-5">
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
                  </div>
                </div>

                <div className="rounded-2xl border p-5 app-border app-surface">
                  <div className="flex items-center gap-2 text-xs font-semibold app-text">
                    <Sparkles className="size-3.5 text-[color:var(--primary)]" />
                    AI Aksiyonları
                  </div>
                  <p className="mt-1 text-[11px] leading-5 app-muted">
                    İçeriği özetle, kısalt ya da daha profesyonel bir tona taşı.
                  </p>
                  <div className="mt-3">
                    <AiActionButtons
                      activeAction={aiState.isLoading ? aiState.action : null}
                      disabled={isSaving}
                      onAction={(action) => void handleRunAiAction(action)}
                    />
                  </div>

                  {aiState.action ? (
                    <div className="mt-4 rounded-2xl border p-4 app-border app-surface-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
                            AI Çıktısı
                          </p>
                          <p className="mt-1 text-xs app-muted">
                            {aiState.provider
                              ? `${aiState.provider} ile hazırlandı`
                              : "AI ile işlendi"}
                          </p>
                        </div>
                        <button
                          className="app-muted transition hover:app-text"
                          onClick={() => setAiState(createAiState())}
                          type="button"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      {aiState.isLoading ? (
                        <div className="mt-3 flex items-center gap-2 text-sm app-muted">
                          <LoaderCircle className="size-4 animate-spin" />
                          AI çalışıyor...
                        </div>
                      ) : aiState.error ? (
                        <div className="mt-3 flex gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs text-rose-200">
                          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                          {aiState.error}
                        </div>
                      ) : (
                        <>
                          <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border p-3 text-xs leading-6 app-border app-surface app-text">
                            {aiState.output}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              onClick={() => void handleCopyAiOutput()}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              <Copy className="size-3.5" />
                              Kopyala
                            </Button>
                            <Button
                              onClick={appendAiOutput}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              <Sparkles className="size-3.5" />
                              Editöre ekle
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border p-5 text-[11px] leading-6 app-border app-surface app-muted">
                  <p className="font-semibold app-text">Kısayollar</p>
                  <p className="mt-2">Ctrl + S: Kaydet</p>
                  <p>Ctrl + Enter: Kaydet ve kapat</p>
                  <p>Ctrl + Shift + F: Odak modu</p>
                  <p>Esc: Kapat</p>
                </div>
              </div>
              </aside>
            </>
          ) : null}
        </div>
      </form>

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
