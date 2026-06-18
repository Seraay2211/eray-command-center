"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCopy,
  FolderPlus,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AiOutputPanel } from "@/components/ai/ai-output-panel";
import { DeleteNoteDialog } from "@/components/notes/delete-note-dialog";
import { EmptyNotes } from "@/components/notes/empty-notes";
import { FullscreenNoteEditor } from "@/components/notes/fullscreen-note-editor";
import { NoteCard } from "@/components/notes/note-card";
import { NoteDetailPanel } from "@/components/notes/note-detail-panel";
import { NoteForm } from "@/components/notes/note-form";
import { OpenNoteTabs } from "@/components/notes/open-note-tabs";
import { QuickCaptureModal } from "@/components/notes/quick-capture-modal";
import {
  NotesToolbar,
  type NotesSort,
  type NotesViewFilter,
} from "@/components/notes/notes-toolbar";
import { TemplatePicker } from "@/components/templates/template-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { getCategoryDisplayName } from "@/lib/categories/display";
import {
  formatAiOutputForDisplay,
  formatAiOutputForNote,
} from "@/lib/ai/format-ai-output";
import { trackRecentItem } from "@/lib/recent-items";
import { getUserFacingError } from "@/lib/user-facing-error";
import {
  applyTemplateVariables,
  cleanSystemTemplateContent,
  getTemplateVariableDefaults,
} from "@/lib/templates/apply-template";
import {
  createDefaultCategories,
  createNote,
  createQuickCaptureNote,
  deleteNote,
  getNotes,
  archiveNote,
  restoreArchivedNote,
  toggleFavoriteNote,
  togglePinNote,
  updateNote,
} from "@/features/notes/actions";
import { createReport } from "@/services/reports-service";
import { createTask } from "@/services/tasks-service";
import type {
  AiActionKey,
  AiActionRequest,
  AiActionResponse,
  AiOutputState,
  Category,
  CreateNoteInput,
  NoteImage,
  NoteWithRelations,
  OpenNoteTab,
  Template,
} from "@/types";

interface NotesClientProps {
  initialCategories: Category[];
  initialDefaultCategoryId: string | null;
  initialEditorValue: string;
  initialError: string;
  initialNotes: NoteWithRelations[];
  initialNoteId: string;
  initialOpen: boolean;
  initialQuery: string;
  initialQuickOpen: boolean;
  initialTemplateId: string;
  initialTemplatePickerOpen: boolean;
  initialTemplates: Template[];
  userLabel: string;
}

interface NoteImagesApiResponse {
  error?: string;
  id?: string;
  images?: NoteImage[];
  success: boolean;
}

function createEmptyAiOutputState(): AiOutputState {
  return {
    action: null,
    error: null,
    isLoading: false,
    output: "",
    provider: null,
    sourceNoteId: null,
    sourceTitle: "",
  };
}

interface FullscreenEditorSeed {
  categoryId: string;
  content: string;
  isPinned: boolean;
  tags: string;
  title: string;
}

function buildTemplateSeed(options: {
  categories: Category[];
  defaultCategoryId: string | null;
  existingNote?: NoteWithRelations | null;
  template: Template;
  userLabel: string;
}) {
  const {
    categories,
    defaultCategoryId,
    existingNote,
    template,
    userLabel,
  } = options;
  const categoryId =
    template.category_id ??
    existingNote?.category_id ??
    defaultCategoryId ??
    "";
  const categoryName =
    existingNote?.category?.name ??
    categories.find((category) => category.id === categoryId)?.name ??
    "Genel";
  const templateContent = template.is_system
    ? cleanSystemTemplateContent(template.content)
    : template.content;

  return {
    categoryId,
    content: applyTemplateVariables(templateContent, {
      category: categoryName,
      title: existingNote?.title || template.name,
      user: userLabel,
      variables: getTemplateVariableDefaults(template.variables),
    }),
    isPinned: existingNote?.is_pinned ?? false,
    tags: existingNote?.tags.map((tag) => tag.name).join(", ") ?? "",
    title: existingNote?.title || template.name,
  } satisfies FullscreenEditorSeed;
}


async function uploadNoteImages(
  noteId: string,
  files: File[],
): Promise<{ data: NoteImage[] | null; error: string | null }> {
  if (files.length === 0) {
    return { data: [], error: null };
  }

  const formData = new FormData();
  formData.set("noteId", noteId);
  files.forEach((file) => formData.append("files", file));

  try {
    const response = await fetch("/api/note-images", {
      body: formData,
      method: "POST",
    });
    const result = (await response.json()) as NoteImagesApiResponse;

    if (!response.ok || !result.success || !result.images) {
      return {
        data: null,
        error: result.error ?? "Görsel yüklenemedi. Lütfen tekrar dene.",
      };
    }

    return { data: result.images, error: null };
  } catch {
    return {
      data: null,
      error: "Görsel yüklenemedi. Lütfen tekrar dene.",
    };
  }
}

export function NotesClient({
  initialCategories,
  initialDefaultCategoryId,
  initialEditorValue,
  initialError,
  initialNotes,
  initialNoteId,
  initialOpen,
  initialQuery,
  initialQuickOpen,
  initialTemplateId,
  initialTemplatePickerOpen,
  initialTemplates,
  userLabel,
}: NotesClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const isEnglish = settings.language === "en";
  const initialSelectedNote = initialNotes.find(
    (note) => note.id === initialNoteId,
  );
  const initialSelectedTemplate =
    initialTemplates.find((template) => template.id === initialTemplateId) ?? null;
  const [notes, setNotes] = useState(initialNotes);
  const [templates] = useState(initialTemplates);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialSelectedNote?.id ?? null,
  );
  const [openTabs, setOpenTabs] = useState<OpenNoteTab[]>(
    initialSelectedNote
      ? [{ id: initialSelectedNote.id, title: initialSelectedNote.title }]
      : [],
  );
  const [detailError, setDetailError] = useState(
    initialNoteId && !initialSelectedNote
      ? "Bağlantıdaki not bulunamadı veya artık erişilebilir değil."
      : "",
  );
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<NotesSort>("newest");
  const [viewFilter, setViewFilter] = useState<NotesViewFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(initialOpen);
  const [editingNote, setEditingNote] = useState<NoteWithRelations | null>(
    null,
  );
  const [fullscreenEditorValue, setFullscreenEditorValue] = useState(
    initialEditorValue || "",
  );
  const [templatePickerOpen, setTemplatePickerOpen] = useState(
    initialTemplatePickerOpen,
  );
  const [activeTemplateName, setActiveTemplateName] = useState(
    initialSelectedTemplate?.name ?? "",
  );
  const [fullscreenSeed, setFullscreenSeed] = useState<FullscreenEditorSeed | null>(
    initialSelectedTemplate
      ? buildTemplateSeed({
          categories: initialCategories,
          defaultCategoryId: initialDefaultCategoryId,
          existingNote: null,
          template: initialSelectedTemplate,
          userLabel,
        })
      : null,
  );
  const [fullscreenSeedVersion, setFullscreenSeedVersion] = useState(
    initialSelectedTemplate ? 1 : 0,
  );
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(initialQuickOpen);
  const [deletingNote, setDeletingNote] =
    useState<NoteWithRelations | null>(null);
  const [busyNoteId, setBusyNoteId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingCategories, setIsCreatingCategories] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  const [quickCaptureError, setQuickCaptureError] = useState("");
  const [pageError, setPageError] = useState(() =>
    initialError ? getUserFacingError(initialError) : "",
  );
  const [notice, setNotice] = useState("");
  const [aiOutput, setAiOutput] = useState<AiOutputState>(
    createEmptyAiOutputState(),
  );
  const [isAppendingAi, setIsAppendingAi] = useState(false);
  const [isSavingAiNote, setIsSavingAiNote] = useState(false);
  const [isQuickCaptureSaving, setIsQuickCaptureSaving] = useState(false);
  const [visibleState, setVisibleState] = useState({
    count: 50,
    key: "",
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialNotes.length >= 50);
  const debouncedQuery = useDebounce(query, 250);

  const isDevelopment = process.env.NODE_ENV === "development";
  const schemaMissing =
    isDevelopment &&
    (initialError.includes("gerekli güncelleme") ||
      initialError.includes("kullanıma hazırlanıyor"));
  const selectedNote =
    notes.find((note) => note.id === selectedNoteId) ?? null;
  const fullscreenNote =
    fullscreenEditorValue && fullscreenEditorValue !== "new"
      ? notes.find((note) => note.id === fullscreenEditorValue) ?? null
      : null;

  const filteredNotes = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase("tr-TR");

    return notes
      .filter((note) => {
        const categoryName = getCategoryDisplayName(note.category);
        const tagText = note.tags.map((tag) => tag.name).join(" ");
        const matchesQuery =
          !normalizedQuery ||
          note.title.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
          note.content.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
          categoryName.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
          tagText.toLocaleLowerCase("tr-TR").includes(normalizedQuery);
        const matchesCategory =
          categoryId === "all" ||
          (categoryId === "uncategorized" && !note.category_id) ||
          note.category_id === categoryId;
        const matchesView =
          viewFilter === "archive"
            ? Boolean(note.archived_at)
            : !note.archived_at &&
              (viewFilter === "all" ||
                viewFilter === "recent" ||
                (viewFilter === "pinned" && note.is_pinned) ||
                (viewFilter === "favorites" && note.is_favorite));

        return matchesQuery && matchesCategory && matchesView;
      })
      .sort((first, second) => {
        if (sort === "oldest") {
          return (
            new Date(first.created_at).getTime() -
            new Date(second.created_at).getTime()
          );
        }

        if (sort === "pinned" && first.is_pinned !== second.is_pinned) {
          return first.is_pinned ? -1 : 1;
        }

        const firstDate =
          sort === "pinned" || viewFilter === "recent"
            ? first.updated_at
            : first.created_at;
        const secondDate =
          sort === "pinned" || viewFilter === "recent"
            ? second.updated_at
            : second.created_at;

        return (
          new Date(secondDate).getTime() - new Date(firstDate).getTime()
        );
      });
  }, [categoryId, debouncedQuery, notes, sort, viewFilter]);
  const filterKey = useMemo(
    () => [categoryId, debouncedQuery, sort, viewFilter].join("|"),
    [categoryId, debouncedQuery, sort, viewFilter],
  );
  const visibleCount =
    visibleState.key === filterKey ? visibleState.count : 50;
  const visibleNotes = useMemo(
    () => filteredNotes.slice(0, visibleCount),
    [filteredNotes, visibleCount],
  );

  useEffect(() => {
    if (!selectedNote) {
      return;
    }

    trackRecentItem({
      href: `/notes?note=${encodeURIComponent(selectedNote.id)}`,
      id: selectedNote.id,
      title: selectedNote.title,
      type: "note",
    });
  }, [selectedNote]);

  const replaceParams = useCallback(
    (changes: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      });

      router.replace(
        nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname,
        {
          scroll: false,
        },
      );
    },
    [pathname, router, searchParams],
  );

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingNote(null);
    setFormError("");
    replaceParams({ new: null });
  }, [replaceParams, setEditingNote, setFormError, setIsFormOpen]);

  const syncNoteParam = useCallback(
    (noteId: string | null) => {
      replaceParams({ note: noteId });
    },
    [replaceParams],
  );

  function selectNote(note: NoteWithRelations, updateUrl = true) {
    setDetailError("");
    setSelectedNoteId(note.id);
    trackRecentItem({
      href: `/notes?note=${encodeURIComponent(note.id)}`,
      id: note.id,
      title: note.title,
      type: "note",
    });
    setOpenTabs((current) => {
      const existingTab = current.find((tab) => tab.id === note.id);

      if (existingTab) {
        return current.map((tab) =>
          tab.id === note.id ? { ...tab, title: note.title } : tab,
        );
      }

      return [...current, { id: note.id, title: note.title }].slice(-6);
    });
    if (updateUrl) {
      syncNoteParam(note.id);
    }
  }

  function closeFormAfterSave(noteId: string) {
    setIsFormOpen(false);
    setEditingNote(null);
    setFormError("");
    replaceParams({ new: null, note: noteId });
  }

  function selectOpenTab(noteId: string) {
    const note = notes.find((item) => item.id === noteId);

    if (!note) {
      setDetailError("Bu not artık mevcut değil.");
      setSelectedNoteId(null);
      syncNoteParam(null);
      return;
    }

    selectNote(note);
  }

  function closeNoteTab(noteId: string) {
    const closingIndex = openTabs.findIndex((tab) => tab.id === noteId);
    const nextTabs = openTabs.filter((tab) => tab.id !== noteId);

    setOpenTabs(nextTabs);

    if (selectedNoteId !== noteId) {
      return;
    }

    const nextTab =
      nextTabs[Math.min(closingIndex, nextTabs.length - 1)] ?? null;

    setDetailError("");
    setSelectedNoteId(nextTab?.id ?? null);
    syncNoteParam(nextTab?.id ?? null);
  }

  function closeDetail() {
    if (selectedNoteId) {
      closeNoteTab(selectedNoteId);
      return;
    }

    setDetailError("");
    syncNoteParam(null);
  }

  function openNewNote() {
    setEditingNote(null);
    setFormError("");
    setFullscreenEditorValue("");
    setFullscreenSeed(null);
    setActiveTemplateName("");
    setTemplatePickerOpen(false);
    setIsQuickCaptureOpen(false);
    setIsFormOpen(true);
    replaceParams({
      editor: null,
      new: "1",
      quick: null,
      template: null,
      templatePicker: null,
    });
  }

  function openEditNote(note: NoteWithRelations) {
    setEditingNote(note);
    setFormError("");
    setIsFormOpen(true);
  }

  const openFullscreenEditor = useCallback((noteId: string | "new") => {
    setFullscreenError("");
    setFullscreenEditorValue(noteId);
    setIsFormOpen(false);
    setIsQuickCaptureOpen(false);
    setEditingNote(null);
    if (noteId !== "new") {
      setFullscreenSeed(null);
      setActiveTemplateName("");
      setTemplatePickerOpen(false);
    } else if (!searchParams.get("template")) {
      setFullscreenSeed(null);
      setActiveTemplateName("");
    }
    replaceParams({
      editor: noteId,
      new: null,
      quick: null,
      template: noteId === "new" ? searchParams.get("template") : null,
      templatePicker: noteId === "new" ? searchParams.get("templatePicker") : null,
    });
  }, [
    replaceParams,
    searchParams,
    setActiveTemplateName,
    setEditingNote,
    setFullscreenEditorValue,
    setFullscreenError,
    setFullscreenSeed,
    setIsFormOpen,
    setIsQuickCaptureOpen,
    setTemplatePickerOpen,
  ]);

  const closeFullscreenEditor = useCallback(() => {
    setFullscreenEditorValue("");
    setFullscreenError("");
    setFullscreenSeed(null);
    setActiveTemplateName("");
    setTemplatePickerOpen(false);
    replaceParams({ editor: null, template: null, templatePicker: null });
  }, [
    replaceParams,
    setActiveTemplateName,
    setFullscreenEditorValue,
    setFullscreenError,
    setFullscreenSeed,
    setTemplatePickerOpen,
  ]);

  const openQuickCapture = useCallback(() => {
    setQuickCaptureError("");
    setIsFormOpen(false);
    setEditingNote(null);
    setFullscreenEditorValue("");
    setFullscreenSeed(null);
    setActiveTemplateName("");
    setTemplatePickerOpen(false);
    setIsQuickCaptureOpen(true);
    replaceParams({
      editor: null,
      new: null,
      quick: "1",
      template: null,
      templatePicker: null,
    });
  }, [
    replaceParams,
    setActiveTemplateName,
    setEditingNote,
    setFullscreenEditorValue,
    setFullscreenSeed,
    setIsFormOpen,
    setIsQuickCaptureOpen,
    setQuickCaptureError,
    setTemplatePickerOpen,
  ]);

  const closeQuickCapture = useCallback(() => {
    setQuickCaptureError("");
    setIsQuickCaptureOpen(false);
    replaceParams({ quick: null });
  }, [replaceParams]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function openTemplateStarter() {
    setEditingNote(null);
    setIsFormOpen(false);
    setIsQuickCaptureOpen(false);
    setFullscreenEditorValue("new");
    setTemplatePickerOpen(true);
    setFullscreenSeed(null);
    setActiveTemplateName("");
    replaceParams({
      editor: "new",
      new: null,
      quick: null,
      template: null,
      templatePicker: "1",
    });
  }

  function handleApplyTemplateToEditor(payload: {
    renderedContent: string;
    template: Template;
    variables: Record<string, string>;
  }) {
    void payload.variables;
    const sourceNote =
      fullscreenEditorValue && fullscreenEditorValue !== "new"
        ? notes.find((note) => note.id === fullscreenEditorValue) ?? null
        : null;
    const nextSeed: FullscreenEditorSeed = {
      categoryId:
        payload.template.category_id ??
        sourceNote?.category_id ??
        initialDefaultCategoryId ??
        "",
      content: payload.renderedContent,
      isPinned: sourceNote?.is_pinned ?? false,
      tags: sourceNote?.tags.map((tag) => tag.name).join(", ") ?? "",
      title: sourceNote?.title || payload.template.name,
    };

    setFullscreenSeed(nextSeed);
    setFullscreenSeedVersion((current) => current + 1);
    setActiveTemplateName(payload.template.name);
    setFullscreenEditorValue(sourceNote?.id ?? "new");
    setTemplatePickerOpen(false);
    replaceParams({
      editor: sourceNote?.id ?? "new",
      new: null,
      quick: null,
      template: payload.template.id,
      templatePicker: null,
    });
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);
    const result = await getNotes({
      limit: 50,
      offset: notes.length,
    });
    setIsLoadingMore(false);

    if (result.error || !result.data) {
      setPageError(getUserFacingError(result.error, "Daha fazla not yüklenemedi."));
      return;
    }

    const nextNotes = result.data;

    setNotes((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...nextNotes.filter((item) => !existingIds.has(item.id)),
      ];
    });
    setHasMore(nextNotes.length === 50);
  }

  function closeAiOutput() {
    setAiOutput(createEmptyAiOutputState());
  }

  async function handleRunAiAction(
    note: NoteWithRelations,
    action: AiActionKey,
  ) {
    setPageError("");
    setAiOutput({
      action,
      error: null,
      isLoading: true,
      output: "",
      provider: null,
      sourceNoteId: note.id,
      sourceTitle: note.title,
    });

    const payload: AiActionRequest = {
      action,
      noteId: note.id,
      text: note.content,
      title: note.title,
    };

    try {
      const response = await fetch("/api/ai/note-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as AiActionResponse;

      if (!response.ok || !result.success) {
        const error = result.success
          ? "AI işlemi tamamlanamadı. Lütfen tekrar dene."
          : getUserFacingError(result.error, "AI işlemi tamamlanamadı. Lütfen tekrar dene.");

        setAiOutput({
          action,
          error,
          isLoading: false,
          output: "",
          provider: null,
          sourceNoteId: note.id,
          sourceTitle: note.title,
        });
        return;
      }

      setAiOutput({
        action: result.action,
        error: null,
        isLoading: false,
        output: result.output,
        provider: result.provider ?? null,
        sourceNoteId: note.id,
        sourceTitle: note.title,
      });
    } catch {
      setAiOutput({
        action,
        error: "AI işlemi tamamlanamadı. Lütfen tekrar dene.",
        isLoading: false,
        output: "",
        provider: null,
        sourceNoteId: note.id,
        sourceTitle: note.title,
      });
    }
  }

  async function handleCopyAiOutput() {
    if (!aiOutput.output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatAiOutputForDisplay(aiOutput.output),
      );
      showNotice("AI çıktısı panoya kopyalandı.");
    } catch {
      setPageError("Çıktı panoya kopyalanamadı. Lütfen tekrar dene.");
    }
  }

  async function handleAppendAiOutput() {
    if (!aiOutput.output || !aiOutput.sourceNoteId) {
      return;
    }

    const sourceNote = notes.find((note) => note.id === aiOutput.sourceNoteId);

    if (!sourceNote) {
      setPageError("Not bulunamadı.");
      return;
    }

    const appendedContent = sourceNote.content.trim()
      ? `${sourceNote.content.trim()}\n\nAI Çıktısı - ${aiOutput.sourceTitle || sourceNote.title}\n${aiOutput.output}`
      : aiOutput.output;

    setIsAppendingAi(true);
    setPageError("");

    const result = await updateNote({
      id: sourceNote.id,
      title: sourceNote.title,
      content: appendedContent,
      categoryId: sourceNote.category_id,
      tags: sourceNote.tags.map((tag) => tag.name),
      isPinned: sourceNote.is_pinned,
      isFavorite: sourceNote.is_favorite,
    });

    setIsAppendingAi(false);

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(result.error, "AI çıktısı nota eklenemedi."),
      );
      return;
    }

    setNotes((current) =>
      current.map((note) => (note.id === result.data?.id ? result.data : note)),
    );
    setOpenTabs((current) =>
      current.map((tab) =>
        tab.id === result.data?.id
          ? { ...tab, title: result.data.title }
          : tab,
      ),
    );
    showNotice("AI çıktısı mevcut nota eklendi.");
  }

  async function handleSaveAiAsNewNote() {
    if (!aiOutput.output) {
      return;
    }

    const sourceNote = aiOutput.sourceNoteId
      ? notes.find((note) => note.id === aiOutput.sourceNoteId)
      : null;
    const baseTitle = sourceNote?.title || aiOutput.sourceTitle || "Çıktı";
    const nextTitle = `[AI] ${baseTitle}`;

    setIsSavingAiNote(true);
    setPageError("");

    const result = await createNote({
      title: nextTitle,
      content: formatAiOutputForNote(aiOutput.output),
      categoryId: sourceNote?.category_id ?? null,
      tags: sourceNote?.tags.map((tag) => tag.name) ?? [],
      isPinned: false,
    });

    setIsSavingAiNote(false);

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(
          result.error,
          "AI çıktısı yeni not olarak kaydedilemedi.",
        ),
      );
      return;
    }

    setNotes((current) => [result.data as NoteWithRelations, ...current]);
    selectNote(result.data as NoteWithRelations);
    showNotice("AI çıktısı yeni not olarak kaydedildi.");
  }

  async function handleSave(input: CreateNoteInput, files: File[]) {
    setIsSaving(true);
    setFormError("");

    const wasEditing = Boolean(editingNote);
    const result = editingNote
      ? await updateNote({ ...input, id: editingNote.id })
      : await createNote(input);

    if (result.error || !result.data) {
      setIsSaving(false);
      setFormError(getUserFacingError(result.error, "Not kaydedilemedi."));
      return;
    }

    let savedNote = result.data;

    if (files.length > 0) {
      const uploadResult = await uploadNoteImages(savedNote.id, files);

      if (uploadResult.error || !uploadResult.data) {
        setIsSaving(false);

        if (wasEditing) {
          setNotes((current) =>
            current.map((note) =>
              note.id === savedNote.id ? savedNote : note,
            ),
          );
          setEditingNote(savedNote);
          setFormError(
            getUserFacingError(uploadResult.error, "Görsel yüklenemedi."),
          );
          return;
        }

        const rollbackResult = await deleteNote(savedNote.id);

        if (rollbackResult.error) {
          setNotes((current) => [savedNote, ...current]);
          setEditingNote(savedNote);
          setFormError(
            "Not kaydedildi ancak görsel yüklenemedi. Görseli yeniden seçip tekrar kaydet.",
          );
          return;
        }

        setFormError(
          getUserFacingError(uploadResult.error, "Görsel yüklenemedi."),
        );
        return;
      }

      savedNote = {
        ...savedNote,
        images: [...savedNote.images, ...uploadResult.data],
      };
    }

    setIsSaving(false);

    if (wasEditing) {
      setNotes((current) =>
        current.map((note) =>
          note.id === savedNote.id ? savedNote : note,
        ),
      );
      setOpenTabs((current) =>
        current.map((tab) =>
          tab.id === savedNote.id
            ? { ...tab, title: savedNote.title }
            : tab,
        ),
      );
      showNotice("Not güncellendi.");
    } else {
      setNotes((current) => [savedNote, ...current]);
      showNotice("Yeni not oluşturuldu.");
    }

    setPageError("");
    selectNote(savedNote, false);
    closeFormAfterSave(savedNote.id);
  }

  async function handleFullscreenSave(
    input: CreateNoteInput,
    files: File[],
    options: { closeAfterSave: boolean; note: NoteWithRelations | null },
  ): Promise<boolean> {
    setIsSaving(true);
    setFullscreenError("");

    const targetNote = options.note;
    const wasEditing = Boolean(targetNote);
    const result = targetNote
      ? await updateNote({ ...input, id: targetNote.id })
      : await createNote(input);

    if (result.error || !result.data) {
      setIsSaving(false);
      setFullscreenError(getUserFacingError(result.error, "Not kaydedilemedi."));
      return false;
    }

    let savedNote = result.data;

    if (files.length > 0) {
      const uploadResult = await uploadNoteImages(savedNote.id, files);

      if (uploadResult.error || !uploadResult.data) {
        setIsSaving(false);

        if (wasEditing) {
          setNotes((current) =>
            current.map((note) =>
              note.id === savedNote.id ? savedNote : note,
            ),
          );
        } else {
          const rollbackResult = await deleteNote(savedNote.id);

          if (rollbackResult.error) {
            setNotes((current) => [savedNote, ...current]);
          }
        }

        setFullscreenError(
          getUserFacingError(uploadResult.error, "Görsel yüklenemedi."),
        );
        return false;
      }

      savedNote = {
        ...savedNote,
        images: [...savedNote.images, ...uploadResult.data],
      };
    }

    setIsSaving(false);

    if (wasEditing) {
      setNotes((current) =>
        current.map((note) =>
          note.id === savedNote.id ? savedNote : note,
        ),
      );
      setOpenTabs((current) =>
        current.map((tab) =>
          tab.id === savedNote.id
            ? { ...tab, title: savedNote.title }
            : tab,
        ),
      );
      showNotice("Not güncellendi.");
    } else {
      setNotes((current) => [savedNote, ...current]);
      showNotice("Yeni not oluşturuldu.");
    }

    setPageError("");
    selectNote(savedNote, false);
    setFullscreenEditorValue(options.closeAfterSave ? "" : savedNote.id);
    if (options.closeAfterSave) {
      setTemplatePickerOpen(false);
    }
    replaceParams({
      editor: options.closeAfterSave ? null : savedNote.id,
      new: null,
      note: savedNote.id,
      template: options.closeAfterSave ? null : searchParams.get("template"),
      templatePicker: null,
    });
    return true;
  }

  async function handleQuickCaptureSave(input: {
    content: string;
    title?: string;
  }): Promise<boolean> {
    setIsQuickCaptureSaving(true);
    setQuickCaptureError("");
    const result = await createQuickCaptureNote(input);
    setIsQuickCaptureSaving(false);

    if (result.error || !result.data) {
      setQuickCaptureError(
        getUserFacingError(result.error, "Hızlı kayıt oluşturulamadı."),
      );
      return false;
    }

    setNotes((current) => [result.data as NoteWithRelations, ...current]);
    selectNote(result.data as NoteWithRelations);
    showNotice("Hızlı kayıt Hızlı Kayıtlar alanına eklendi.");
    closeQuickCapture();
    return true;
  }

  async function handleApplyInboxTemplate(
    note: NoteWithRelations,
    template: Template,
    mode: "update" | "new",
    variables?: Record<string, string>,
  ) {
    setPageError("");

    const templateContent = template.is_system
      ? cleanSystemTemplateContent(template.content)
      : template.content;
    const content = `${applyTemplateVariables(templateContent, {
      category: getCategoryDisplayName(note.category),
      title: note.title || template.name,
      user: userLabel,
      variables: variables ?? getTemplateVariableDefaults(template.variables),
    })}\n\nHIZLI KAYIT NOTU\n\n${note.content}`.trim();
    const result =
      mode === "update"
        ? await updateNote({
            categoryId: template.category_id ?? note.category_id,
            content,
            id: note.id,
            isFavorite: note.is_favorite,
            isPinned: note.is_pinned,
            tags: note.tags.map((tag) => tag.name),
            title: note.title || template.name,
          })
        : await createNote({
            categoryId: template.category_id ?? note.category_id,
            content,
            isPinned: false,
            tags: note.tags.map((tag) => tag.name),
            title: `${template.name} - ${note.title || "Hızlı Kayıt"}`.slice(0, 200),
          });

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(
          result.error,
          "Hızlı kayıt şablona uygulanamadı.",
        ),
      );
      return;
    }

    if (mode === "update") {
      setNotes((current) =>
        current.map((item) => (item.id === result.data?.id ? result.data : item)),
      );
      showNotice("Hızlı kayıt seçilen şablona göre güncellendi.");
    } else {
      setNotes((current) => [result.data as NoteWithRelations, ...current]);
      selectNote(result.data as NoteWithRelations);
      showNotice("Hızlı kayıttan yeni not oluşturuldu.");
    }
  }

  async function handleMoveInboxCategory(
    note: NoteWithRelations,
    nextCategoryId: string,
  ) {
    const result = await updateNote({
      categoryId: nextCategoryId,
      content: note.content,
      id: note.id,
      isFavorite: note.is_favorite,
      isPinned: note.is_pinned,
      tags: note.tags.map((tag) => tag.name),
      title: note.title,
    });

    if (result.error || !result.data) {
      setPageError(getUserFacingError(result.error, "Kategori güncellenemedi."));
      return;
    }

    setNotes((current) =>
      current.map((item) => (item.id === result.data?.id ? result.data : item)),
    );
    showNotice("Hızlı kayıt yeni kategoriye taşındı.");
  }

  async function handleConvertInboxToTask(note: NoteWithRelations) {
    const result = await createTask({
      category_id: note.category_id,
      description: note.content,
      priority: "medium",
      status: "todo",
      title: note.title,
    });

    if (result.error) {
      setPageError(getUserFacingError(result.error));
      return;
    }

    showNotice("Not göreve çevrildi.");
  }

  async function handleConvertInboxToReport(note: NoteWithRelations) {
    const summary =
      note.content.replace(/\s+/g, " ").trim().slice(0, 180) || null;
    const result = await createReport({
      ai_generated: false,
      content: note.content,
      report_type: "custom",
      sources: [{ source_id: note.id, source_type: "note" }],
      status: "draft",
      summary,
      title: note.title,
    });

    if (result.error) {
      setPageError(getUserFacingError(result.error));
      return;
    }

    showNotice("Not rapora çevrildi.");
  }

  async function handleDeleteImage(image: NoteImage): Promise<boolean> {
    setIsDeletingImage(true);
    setFormError("");
    setPageError("");

    try {
      const response = await fetch(`/api/note-images/${image.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as NoteImagesApiResponse;

      if (!response.ok || !result.success) {
        const error =
          getUserFacingError(result.error, "Görsel silinemedi. Lütfen tekrar dene.");
        setFormError(error);
        setPageError(error);
        return false;
      }

      const removeImage = (note: NoteWithRelations): NoteWithRelations => ({
        ...note,
        images: note.images.filter((item) => item.id !== image.id),
      });

      setNotes((current) =>
        current.map((note) =>
          note.id === image.note_id ? removeImage(note) : note,
        ),
      );
      setEditingNote((current) =>
        current?.id === image.note_id ? removeImage(current) : current,
      );
      showNotice("Görsel nottan ve depolamadan silindi.");
      return true;
    } catch {
      const error = "Görsel silinemedi. Lütfen tekrar dene.";
      setFormError(error);
      setPageError(error);
      return false;
    } finally {
      setIsDeletingImage(false);
    }
  }

  async function handleTogglePin(note: NoteWithRelations) {
    setBusyNoteId(note.id);
    setPageError("");

    const result = await togglePinNote(note.id);
    setBusyNoteId("");

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(
          result.error,
          "Sabitleme durumu değiştirilemedi.",
        ),
      );
      return;
    }

    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? (result.data as NoteWithRelations) : item,
      ),
    );
  }

  async function handleToggleFavorite(note: NoteWithRelations) {
    setBusyNoteId(note.id);
    setPageError("");

    const result = await toggleFavoriteNote(note.id);
    setBusyNoteId("");

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(result.error, "Favori durumu değiştirilemedi."),
      );
      return;
    }

    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? (result.data as NoteWithRelations) : item,
      ),
    );
  }

  async function handleArchiveNote(note: NoteWithRelations) {
    setBusyNoteId(note.id);
    setPageError("");

    const result = await archiveNote(note.id);
    setBusyNoteId("");

    if (result.error || !result.data) {
      setPageError(getUserFacingError(result.error, "Not arşivlenemedi."));
      return;
    }

    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? (result.data as NoteWithRelations) : item,
      ),
    );
    if (selectedNoteId === note.id && viewFilter !== "archive") {
      closeNoteTab(note.id);
    }
    showNotice("Not arşivlendi.");
  }

  async function handleRestoreNote(note: NoteWithRelations) {
    setBusyNoteId(note.id);
    setPageError("");

    const result = await restoreArchivedNote(note.id);
    setBusyNoteId("");

    if (result.error || !result.data) {
      setPageError(
        getUserFacingError(result.error, "Not arşivden çıkarılamadı."),
      );
      return;
    }

    setNotes((current) =>
      current.map((item) =>
        item.id === note.id ? (result.data as NoteWithRelations) : item,
      ),
    );
    showNotice("Not arşivden çıkarıldı.");
  }

  async function performDelete(noteToDelete: NoteWithRelations) {
    const deletedNoteId = noteToDelete.id;
    setIsDeleting(true);
    setPageError("");
    const result = await deleteNote(deletedNoteId);
    setIsDeleting(false);

    if (result.error) {
      setPageError(getUserFacingError(result.error));
      setDeletingNote(null);
      return;
    }

    setNotes((current) =>
      current.filter((note) => note.id !== deletedNoteId),
    );
    const deletedTabIndex = openTabs.findIndex(
      (tab) => tab.id === deletedNoteId,
    );
    const nextTabs = openTabs.filter((tab) => tab.id !== deletedNoteId);
    setOpenTabs(nextTabs);

    if (selectedNoteId === deletedNoteId) {
      const nextTab =
        nextTabs[Math.min(deletedTabIndex, nextTabs.length - 1)] ?? null;
      setSelectedNoteId(nextTab?.id ?? null);
      syncNoteParam(nextTab?.id ?? null);
    }

    setDeletingNote(null);
    showNotice("Not silindi.");
  }

  function requestDelete(note: NoteWithRelations) {
    if (settings.confirm_before_delete) {
      setDeletingNote(note);
      return;
    }

    void performDelete(note);
  }

  async function handleDelete() {
    if (deletingNote) await performDelete(deletingNote);
  }

  async function handleCreateDefaultCategories() {
    setIsCreatingCategories(true);
    setFormError("");
    setFullscreenError("");
    setPageError("");
    const result = await createDefaultCategories();
    setIsCreatingCategories(false);

    if (result.error || !result.data) {
      const error = result.error ?? "Kategoriler oluşturulamadı.";
      setFormError(error);
      setPageError(error);
      return;
    }

    setCategories(result.data);
    showNotice("Varsayılan kategoriler hazır.");
  }

  function resetFilters() {
    setQuery("");
    setCategoryId("all");
    setSort("newest");
    setViewFilter("all");
  }

  useEffect(() => {
    if (schemaMissing) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        const key = event.key.toLowerCase();

        if (key === "n") {
          event.preventDefault();
          openFullscreenEditor("new");
        }

        if (key === "i") {
          event.preventDefault();
          openQuickCapture();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openFullscreenEditor, openQuickCapture, schemaMissing]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
            {isEnglish ? "Workspace" : "Çalışma alanı"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {isEnglish ? "Notes" : "Notlar"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {isEnglish
              ? "Manage personal notes, operation records and ideas."
              : "Kişisel notlar, operasyon kayıtları ve fikirlerini burada yönet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={schemaMissing} onClick={openQuickCapture} variant="secondary">
            Hızlı Kayıt
          </Button>
          <Button disabled={schemaMissing} onClick={openTemplateStarter} variant="secondary">
            Şablondan Başla
          </Button>
          <Button disabled={schemaMissing} onClick={() => openFullscreenEditor("new")} variant="secondary">
            Tam Ekran
          </Button>
          <Button disabled={schemaMissing} onClick={openNewNote}>
            <Plus className="size-4" />
            {isEnglish ? "New Note" : "Yeni Not"}
          </Button>
        </div>
      </div>

      {notice ? (
        <div
          className="app-surface fixed inset-x-3 top-20 z-[100] flex items-center gap-2 rounded-xl border border-emerald-400/15 px-4 py-3 text-xs font-medium text-emerald-500 shadow-2xl sm:left-auto sm:right-4"
          role="status"
        >
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      ) : null}

      {schemaMissing ? (
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="flex size-11 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-500/[0.08] text-amber-300">
              <AlertCircle className="size-5" />
            </span>
            <h2 className="app-text mt-5 text-lg font-semibold">
              Not alanı hazırlanıyor
            </h2>
            <p className="app-muted mt-2 text-sm leading-6">
              Not kayıtları şu anda yüklenemiyor. Birazdan tekrar kontrol
              edebilirsin.
            </p>
            {isDevelopment ? (
              <p className="app-muted mt-3 text-xs leading-5">
                Geliştirme notu: not alanı için gerekli kurulum adımlarını
                kontrol et.
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {isDevelopment ? (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "Not alanı için gerekli kurulum adımlarını kontrol et.",
                    );
                    showNotice("Kurulum notu kopyalandı.");
                  }}
                  variant="secondary"
                >
                  <ClipboardCopy className="size-4" />
                  Kurulum notunu kopyala
                </Button>
              ) : null}
              <Button onClick={() => router.refresh()}>
                <RefreshCw className="size-4" />
                Tekrar dene
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {pageError ? (
            <div
              className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-5 text-rose-200"
              role="alert"
            >
              <span className="flex gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                {pageError}
              </span>
              <button
                className="shrink-0 text-rose-300/60 hover:text-rose-200"
                onClick={() => setPageError("")}
                type="button"
              >
                Kapat
              </button>
            </div>
          ) : null}

          {categories.length === 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-violet-400/15 bg-violet-500/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Notlarını kategorilerle düzenle
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Önerilen beş kategoriyi tek tıkla oluştur.
                </p>
              </div>
              <Button
                disabled={isCreatingCategories}
                onClick={handleCreateDefaultCategories}
                size="sm"
                variant="secondary"
              >
                <FolderPlus className="size-3.5" />
                Varsayılan kategorileri oluştur
              </Button>
            </div>
          ) : null}

          <NotesToolbar
            categories={categories}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            onQueryChange={setQuery}
            onSortChange={setSort}
            onViewFilterChange={setViewFilter}
            query={query}
            resultCount={filteredNotes.length}
            sort={sort}
            viewFilter={viewFilter}
          />

          <OpenNoteTabs
            activeId={selectedNoteId}
            onClose={closeNoteTab}
            onSelect={selectOpenTab}
            tabs={openTabs}
          />

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)]">
            <div>
              {filteredNotes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {visibleNotes.map((note) => (
                    <NoteCard
                      isBusy={busyNoteId === note.id}
                      isSelected={selectedNoteId === note.id}
                      key={note.id}
                      note={note}
                      onArchive={handleArchiveNote}
                      onDelete={requestDelete}
                      onEdit={openEditNote}
                      onRestore={handleRestoreNote}
                      onSelect={selectNote}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              ) : (
                <EmptyNotes
                  isFiltered={Boolean(query || categoryId !== "all")}
                  onCreate={openNewNote}
                  onResetFilters={resetFilters}
                />
              )}
              {filteredNotes.length > visibleNotes.length ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() =>
                      setVisibleState({
                        count: visibleCount + 50,
                        key: filterKey,
                      })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    Daha fazla göster
                  </Button>
                </div>
              ) : null}
              {filteredNotes.length === visibleNotes.length && hasMore ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    disabled={isLoadingMore}
                    onClick={() => void handleLoadMore()}
                    size="sm"
                    variant="secondary"
                  >
                    {isLoadingMore ? "Yükleniyor..." : "50 kayıt daha yükle"}
                  </Button>
                </div>
              ) : null}
            </div>

            <NoteDetailPanel
              aiBusyAction={
                aiOutput.sourceNoteId === selectedNote?.id &&
                aiOutput.isLoading
                  ? aiOutput.action
                  : null
              }
              aiDisabled={aiOutput.isLoading}
              categories={categories}
              error={detailError}
              isBusy={busyNoteId === selectedNote?.id}
              isDeletingImage={isDeletingImage}
              note={selectedNote}
              onApplyInboxTemplate={handleApplyInboxTemplate}
              onAiAction={handleRunAiAction}
              onClose={closeDetail}
              onConvertInboxToReport={handleConvertInboxToReport}
              onConvertInboxToTask={handleConvertInboxToTask}
              onCreate={openNewNote}
              onArchive={handleArchiveNote}
              onDelete={requestDelete}
              onDeleteImage={handleDeleteImage}
              onEdit={openEditNote}
              onMoveInboxCategory={handleMoveInboxCategory}
              onOpenFullscreenEdit={(note) => openFullscreenEditor(note.id)}
              onRestore={handleRestoreNote}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              templates={templates}
            />
          </div>
        </div>
      )}

      <NoteForm
        categories={categories}
        defaultCategoryId={initialDefaultCategoryId}
        error={formError}
        isCreatingCategories={isCreatingCategories}
        isDeletingImage={isDeletingImage}
        isOpen={isFormOpen && !schemaMissing}
        isSaving={isSaving}
        key={`${isFormOpen}-${editingNote?.id ?? "new"}`}
        note={editingNote}
        onClose={closeForm}
        onCreateDefaultCategories={handleCreateDefaultCategories}
        onDeleteImage={handleDeleteImage}
        onOpenFullscreen={(note) => openFullscreenEditor(note?.id ?? "new")}
        onSubmit={handleSave}
      />
      <FullscreenNoteEditor
        categories={categories}
        defaultCategoryId={initialDefaultCategoryId}
        error={fullscreenError}
        initialStateOverride={fullscreenSeed}
        isCreatingCategories={isCreatingCategories}
        isDeletingImage={isDeletingImage}
        isOpen={Boolean(fullscreenEditorValue) && !schemaMissing}
        isSaving={isSaving}
        key={`${fullscreenEditorValue}-${fullscreenNote?.updated_at ?? "new"}-${fullscreenSeedVersion}`}
        note={fullscreenNote}
        onClose={closeFullscreenEditor}
        onCreateDefaultCategories={handleCreateDefaultCategories}
        onDeleteImage={handleDeleteImage}
        onOpenTemplatePicker={() => {
          setTemplatePickerOpen(true);
          replaceParams({
            editor: fullscreenEditorValue || "new",
            template: searchParams.get("template"),
            templatePicker: "1",
          });
        }}
        onSave={handleFullscreenSave}
        templateName={activeTemplateName || null}
      />
      <TemplatePicker
        category={getCategoryDisplayName(fullscreenNote?.category)}
        isOpen={templatePickerOpen && Boolean(fullscreenEditorValue) && !schemaMissing}
        key={`${fullscreenEditorValue}-${templatePickerOpen ? "open" : "closed"}`}
        onApply={handleApplyTemplateToEditor}
        onClose={() => {
          setTemplatePickerOpen(false);
          replaceParams({ templatePicker: null });
        }}
        templates={templates}
        title={fullscreenNote?.title ?? ""}
        user={userLabel}
      />
      <QuickCaptureModal
        error={quickCaptureError}
        isOpen={isQuickCaptureOpen && !schemaMissing}
        isSaving={isQuickCaptureSaving}
        key={isQuickCaptureOpen ? "quick-open" : "quick-closed"}
        onClose={closeQuickCapture}
        onSubmit={handleQuickCaptureSave}
      />
      <DeleteNoteDialog
        isDeleting={isDeleting}
        note={deletingNote}
        onCancel={() => setDeletingNote(null)}
        onConfirm={handleDelete}
      />
      <AiOutputPanel
        action={aiOutput.action}
        canAppend={Boolean(aiOutput.sourceNoteId)}
        error={aiOutput.error}
        isAppending={isAppendingAi}
        isLoading={aiOutput.isLoading}
        isSavingAsNote={isSavingAiNote}
        isVisible={Boolean(aiOutput.action)}
        onAppend={handleAppendAiOutput}
        onClose={closeAiOutput}
        onCopy={handleCopyAiOutput}
        onSaveAsNote={handleSaveAiAsNewNote}
        output={aiOutput.output}
        provider={aiOutput.provider}
        sourceTitle={aiOutput.sourceTitle}
      />
    </div>
  );
}
