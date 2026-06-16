"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getNoteImages,
  removeNoteImageFiles,
} from "@/services/note-images-service";
import type {
  ActionResult,
  Category,
  CreateNoteInput,
  Note,
  NoteWithRelations,
  Tag,
  UpdateNoteInput,
} from "@/types";

const noteSelect = `
  id,
  user_id,
  category_id,
  title,
  content,
  status,
  is_pinned,
  is_favorite,
  archived_at,
  created_at,
  updated_at,
  category:categories (
    id,
    user_id,
    name,
    slug,
    color,
    created_at
  ),
  note_tags (
    tag:tags (
      id,
      user_id,
      name,
      color,
      created_at
    )
  )
`;

const defaultCategories = [
  { name: "Finans Operasyon", slug: "finans-operasyon", color: "#8b5cf6" },
  { name: "Yazılım", slug: "yazilim", color: "#3b82f6" },
  { name: "AI Fikirleri", slug: "ai-fikirleri", color: "#f59e0b" },
  { name: "Kişisel Plan", slug: "kisisel-plan", color: "#10b981" },
  { name: "Genel", slug: "genel", color: "#71717a" },
];

const inboxCategory = {
  name: "Hızlı Kayıtlar",
  slug: "inbox",
  color: "#64748b",
};

const tagColors = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

interface RawNote extends Note {
  category: Category | Category[] | null;
  note_tags: Array<{ tag: Tag | Tag[] | null }> | null;
}

interface GetNotesOptions {
  limit?: number;
  offset?: number;
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("PGRST204") ||
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Not sistemi için gerekli güncelleme henüz tamamlanmamış. Kurulum adımını tamamlayıp tekrar dene.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.";
  }

  return message || "Not işlemi tamamlanamadı.";
}

function revalidateNoteViews() {
  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

function mapNote(rawNote: RawNote): NoteWithRelations {
  const category = Array.isArray(rawNote.category)
    ? (rawNote.category[0] ?? null)
    : rawNote.category;
  const tags =
    rawNote.note_tags?.flatMap(({ tag }) =>
      Array.isArray(tag) ? tag : tag ? [tag] : [],
    ) ?? [];

  return {
    id: rawNote.id,
    user_id: rawNote.user_id,
    category_id: rawNote.category_id,
    title: rawNote.title,
    content: rawNote.content,
    status: rawNote.status,
    is_pinned: rawNote.is_pinned,
    is_favorite: rawNote.is_favorite,
    archived_at: rawNote.archived_at,
    created_at: rawNote.created_at,
    updated_at: rawNote.updated_at,
    category,
    images: [],
    tags,
  };
}

async function attachImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  notes: NoteWithRelations[],
): Promise<NoteWithRelations[]> {
  if (notes.length === 0) {
    return notes;
  }

  const images = await getNoteImages(
    supabase,
    userId,
    notes.map((note) => note.id),
  );
  const imagesByNote = new Map<string, typeof images>();

  images.forEach((image) => {
    const current = imagesByNote.get(image.note_id) ?? [];
    current.push(image);
    imagesByNote.set(image.note_id, current);
  });

  return notes.map((note) => ({
    ...note,
    images: imagesByNote.get(note.id) ?? [],
  }));
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) =>
          tag
            .trim()
            .replace(/^#+/, "")
            .toLocaleLowerCase("tr-TR"),
        )
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

function getTagColor(name: string): string {
  const hash = Array.from(name).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return tagColors[hash % tagColors.length];
}

function validateInput(input: CreateNoteInput): CreateNoteInput {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Not başlığı zorunludur.");
  }

  if (title.length > 200) {
    throw new Error("Not başlığı en fazla 200 karakter olabilir.");
  }

  return {
    title,
    content: input.content.trim(),
    categoryId: input.categoryId || null,
    tags: normalizeTags(input.tags),
    isPinned: Boolean(input.isPinned),
    isFavorite:
      input.isFavorite === undefined ? undefined : Boolean(input.isFavorite),
  };
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
  }

  return { supabase, user: data.user };
}

async function fetchNoteById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  noteId: string,
) {
  const { data, error } = await supabase
    .from("notes")
    .select(noteSelect)
    .eq("id", noteId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  const [note] = await attachImages(
    supabase,
    userId,
    [mapNote(data as unknown as RawNote)],
  );

  return note;
}

async function getOrCreateTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  names: string[],
): Promise<Tag[]> {
  if (names.length === 0) return [];

  const rows = names.map((name) => ({
    user_id: userId,
    name,
    color: getTagColor(name),
  }));

  const { error: upsertError } = await supabase
    .from("tags")
    .upsert(rows, {
      onConflict: "user_id,name",
      ignoreDuplicates: true,
    });

  if (upsertError) throw upsertError;

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .in("name", names);

  if (error) throw error;

  return (data ?? []) as Tag[];
}

async function replaceNoteTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  noteId: string,
  names: string[],
) {
  const { error: deleteError } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId);

  if (deleteError) throw deleteError;

  const tags = await getOrCreateTags(supabase, userId, names);

  if (tags.length === 0) return;

  const { error: linkError } = await supabase.from("note_tags").insert(
    tags.map((tag) => ({
      note_id: noteId,
      tag_id: tag.id,
    })),
  );

  if (linkError) throw linkError;
}

async function getOrCreateCategoryBySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  category: {
    color: string;
    name: string;
    slug: string;
  },
): Promise<Category> {
  const { data: existingCategory, error: existingError } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", category.slug)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingCategory) {
    if (
      existingCategory.name !== category.name ||
      existingCategory.color !== category.color
    ) {
      const { data: updatedCategory, error: updateError } = await supabase
        .from("categories")
        .update({
          color: category.color,
          name: category.name,
        })
        .eq("id", existingCategory.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (updateError) throw updateError;
      return updatedCategory as Category;
    }

    return existingCategory as Category;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      color: category.color,
      name: category.name,
      slug: category.slug,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as Category;
}

function buildQuickCaptureTitle(
  title: string | undefined,
  content: string,
): string {
  const normalizedTitle = title?.trim();

  if (normalizedTitle) {
    return normalizedTitle.slice(0, 200);
  }

  const firstLine =
    content
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "";

  if (firstLine) {
    return firstLine.slice(0, 200);
  }

  return "Hızlı Kayıt";
}

export async function getNotes(
  options: GetNotesOptions = {},
): Promise<
  ActionResult<NoteWithRelations[]>
> {
  try {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .select(noteSelect)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const notes = ((data ?? []) as unknown as RawNote[]).map(mapNote);

    return {
      data: await attachImages(supabase, user.id, notes),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getNoteById(
  noteId: string,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();

    return {
      data: await fetchNoteById(supabase, user.id, noteId),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getCategories(): Promise<ActionResult<Category[]>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) throw error;

    return { data: (data ?? []) as Category[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDefaultCategories(): Promise<
  ActionResult<Category[]>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { error: upsertError } = await supabase
      .from("categories")
      .upsert(
        [...defaultCategories, inboxCategory].map((category) => ({
          ...category,
          user_id: user.id,
        })),
        {
          onConflict: "user_id,slug",
          ignoreDuplicates: false,
        },
      );

    if (upsertError) throw upsertError;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) throw error;

    revalidateNoteViews();
    return { data: (data ?? []) as Category[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getOrCreateInboxCategory(): Promise<
  ActionResult<Category>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();

    return {
      data: await getOrCreateCategoryBySlug(
        supabase,
        user.id,
        inboxCategory,
      ),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createNote(
  input: CreateNoteInput,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const values = validateInput(input);
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        category_id: values.categoryId,
        title: values.title,
        content: values.content,
        is_pinned: values.isPinned,
        is_favorite: values.isFavorite ?? false,
      })
      .select("id")
      .single();

    if (error) throw error;

    try {
      await replaceNoteTags(supabase, user.id, data.id, values.tags);
    } catch (tagError) {
      await supabase
        .from("notes")
        .delete()
        .eq("id", data.id)
        .eq("user_id", user.id);
      throw tagError;
    }

    const note = await fetchNoteById(supabase, user.id, data.id);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createQuickCaptureNote(input: {
  content: string;
  tags?: string[];
  title?: string;
}): Promise<ActionResult<NoteWithRelations>> {
  try {
    const content = input.content.trim();

    if (!content) {
      throw new Error("Hızlı kayıt boş olamaz.");
    }

    const { supabase, user } = await getAuthenticatedContext();
    const inbox = await getOrCreateCategoryBySlug(
      supabase,
      user.id,
      inboxCategory,
    );
    const title = buildQuickCaptureTitle(input.title, content);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        category_id: inbox.id,
        content,
        is_favorite: false,
        is_pinned: false,
        title,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    try {
      await replaceNoteTags(
        supabase,
        user.id,
        data.id,
        normalizeTags(input.tags ?? []),
      );
    } catch (tagError) {
      await supabase
        .from("notes")
        .delete()
        .eq("id", data.id)
        .eq("user_id", user.id);
      throw tagError;
    }

    const note = await fetchNoteById(supabase, user.id, data.id);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateNote(
  input: UpdateNoteInput,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const values = validateInput(input);
    const { supabase, user } = await getAuthenticatedContext();
    const updateValues: Record<string, unknown> = {
      category_id: values.categoryId,
      title: values.title,
      content: values.content,
      is_pinned: values.isPinned,
      updated_at: new Date().toISOString(),
    };

    if (values.isFavorite !== undefined) {
      updateValues.is_favorite = values.isFavorite;
    }

    const { data, error } = await supabase
      .from("notes")
      .update(updateValues)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Not bulunamadı veya düzenleme yetkiniz yok.");

    await replaceNoteTags(supabase, user.id, input.id, values.tags);

    const note = await fetchNoteById(supabase, user.id, input.id);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteNote(
  noteId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const images = await getNoteImages(supabase, user.id, [noteId]);

    if (images.length > 0) {
      await removeNoteImageFiles(supabase, images);
    }

    const { data, error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Not bulunamadı veya silme yetkiniz yok.");

    revalidateNoteViews();
    return { data: { id: noteId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function togglePinNote(
  noteId: string,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data: existingNote, error: readError } = await supabase
      .from("notes")
      .select("is_pinned")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;
    if (!existingNote) throw new Error("Not bulunamadı.");

    const { error } = await supabase
      .from("notes")
      .update({
        is_pinned: !existingNote.is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) throw error;

    const note = await fetchNoteById(supabase, user.id, noteId);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function toggleFavoriteNote(
  noteId: string,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data: existingNote, error: readError } = await supabase
      .from("notes")
      .select("is_favorite")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;
    if (!existingNote) throw new Error("Not bulunamadı.");

    const { error } = await supabase
      .from("notes")
      .update({
        is_favorite: !existingNote.is_favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) throw error;

    const note = await fetchNoteById(supabase, user.id, noteId);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function archiveNote(
  noteId: string,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Not bulunamadı.");

    const note = await fetchNoteById(supabase, user.id, noteId);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function restoreArchivedNote(
  noteId: string,
): Promise<ActionResult<NoteWithRelations>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .update({
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Not bulunamadı.");

    const note = await fetchNoteById(supabase, user.id, noteId);
    revalidateNoteViews();
    return { data: note, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
