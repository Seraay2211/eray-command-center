import { NotesClient } from "@/components/notes/notes-client";
import {
  getCategories,
  getNoteById,
  getNotes,
} from "@/features/notes/actions";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/services/settings-service";
import { getTemplateById, getTemplates } from "@/services/templates-service";

export const metadata = {
  title: "Notlar",
};

export const dynamic = "force-dynamic";

interface NotesPageProps {
  searchParams: Promise<{
    editor?: string;
    new?: string;
    note?: string;
    quick?: string;
    q?: string;
    template?: string;
    templatePicker?: string;
  }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: authData }, notesResult, categoriesResult, settingsResult, templatesResult] =
    await Promise.all([
      supabase.auth.getUser(),
      getNotes({ limit: 50 }),
      getCategories(),
      getUserSettings(),
      getTemplates(),
    ]);
  const requestedNoteIds = Array.from(
    new Set(
      [query.note, query.editor]
        .filter((value) => value && value !== "new") as string[],
    ),
  );
  const missingNoteIds = requestedNoteIds.filter(
    (noteId) => !(notesResult.data ?? []).some((note) => note.id === noteId),
  );
  const missingNoteResults = await Promise.all(
    missingNoteIds.map((noteId) => getNoteById(noteId)),
  );
  const fetchedNotes = missingNoteResults
    .flatMap((result) => (result.data ? [result.data] : []))
    .filter(Boolean);
  const initialNotes = [...fetchedNotes, ...(notesResult.data ?? [])].filter(
    (note, index, items) => items.findIndex((item) => item.id === note.id) === index,
  );
  const selectedTemplateResult =
    query.template && templatesResult.data?.some((template) => template.id === query.template)
      ? { data: templatesResult.data.find((template) => template.id === query.template) ?? null, error: null }
      : query.template
        ? await getTemplateById(query.template)
        : { data: null, error: null };
  const initialError =
    notesResult.error ??
    categoriesResult.error ??
    templatesResult.error ??
    selectedTemplateResult.error ??
    "";
  const initialEditorValue =
    query.editor ?? (selectedTemplateResult.data ? "new" : "");

  return (
    <NotesClient
      initialCategories={categoriesResult.data ?? []}
      initialDefaultCategoryId={
        settingsResult.data?.default_note_category_id ?? null
      }
      initialEditorValue={initialEditorValue}
      initialError={initialError}
      initialNotes={initialNotes}
      initialNoteId={query.note ?? ""}
      initialOpen={query.new === "1"}
      initialQuery={query.q ?? ""}
      initialQuickOpen={query.quick === "1"}
      initialTemplateId={selectedTemplateResult.data?.id ?? ""}
      initialTemplatePickerOpen={query.templatePicker === "1"}
      initialTemplates={templatesResult.data ?? []}
      userLabel={
        authData.user?.email?.split("@")[0] || authData.user?.email || "Workspace owner"
      }
      key={[
        query.q ?? "",
        query.new ?? "",
        query.note ?? "",
        query.editor ?? "",
        query.quick ?? "",
        query.template ?? "",
        query.templatePicker ?? "",
        initialError,
      ].join("|")}
    />
  );
}
