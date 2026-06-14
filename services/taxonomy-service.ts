"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";
import type {
  ActionResult,
  ManagedCategory,
  ManagedTag,
} from "@/types";

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("23505") ||
    message.toLocaleLowerCase("tr-TR").includes("duplicate key")
  ) {
    return "Bu isimde bir kayıt zaten mevcut.";
  }

  if (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Kategori ve etiket tabloları hazır değil. database/schema.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }

  return message || "Düzen işlemi tamamlanamadi.";
}

function isMissingTableError(error: { message?: string } | null) {
  const message = error?.message ?? "";

  return (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  );
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, userId: data.user.id };
}

function revalidateTaxonomyViews() {
  revalidatePath("/taxonomy");
  revalidatePath("/notes");
  revalidatePath("/tasks");
  revalidatePath("/templates");
}

async function buildUniqueCategorySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string,
  currentCategoryId?: string,
) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    throw new Error("Kategori adi zorunludur.");
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,slug")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const usedSlugs = new Set(
    (data ?? [])
      .filter((category) => category.id !== currentCategoryId)
      .map((category) => category.slug),
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextSlug = `${baseSlug}-${suffix}`;

  while (usedSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}

export async function getManagedCategories(): Promise<
  ActionResult<ManagedCategory[]>
> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const [categoriesResult, notesResult, tasksResult, templatesResult] =
      await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("name"),
        supabase
          .from("notes")
          .select("category_id")
          .eq("user_id", userId)
          .eq("status", "active"),
        supabase.from("tasks").select("category_id").eq("user_id", userId),
        supabase.from("templates").select("category_id").eq("user_id", userId),
      ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (notesResult.error) throw notesResult.error;
    if (tasksResult.error && !isMissingTableError(tasksResult.error)) {
      throw tasksResult.error;
    }
    if (templatesResult.error && !isMissingTableError(templatesResult.error)) {
      throw templatesResult.error;
    }

    const usageCounts = new Map<string, number>();

    [
      notesResult.data ?? [],
      tasksResult.data ?? [],
      templatesResult.data ?? [],
    ]
      .flat()
      .forEach((item) => {
        const categoryId = item.category_id as string | null;
        if (!categoryId) return;
        usageCounts.set(categoryId, (usageCounts.get(categoryId) ?? 0) + 1);
      });

    return {
      data: (categoriesResult.data ?? []).map((category) => ({
        ...category,
        isInbox: category.slug === "inbox",
        usageCount: usageCounts.get(category.id) ?? 0,
      })) as ManagedCategory[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createCategory(input: {
  color: string;
  name: string;
}): Promise<ActionResult<ManagedCategory>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const normalizedName = input.name.trim();
    const slug = await buildUniqueCategorySlug(supabase, userId, normalizedName);
    const { data, error } = await supabase
      .from("categories")
      .insert({
        color: input.color,
        name: normalizedName,
        slug,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) throw error;

    revalidateTaxonomyViews();
    return {
      data: { ...(data as ManagedCategory), isInbox: data.slug === "inbox", usageCount: 0 },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateCategory(
  categoryId: string,
  input: { color: string; name: string },
): Promise<ActionResult<ManagedCategory>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const normalizedName = input.name.trim();
    const slug = await buildUniqueCategorySlug(
      supabase,
      userId,
      normalizedName,
      categoryId,
    );
    const { data, error } = await supabase
      .from("categories")
      .update({
        color: input.color,
        name: normalizedName,
        slug,
      })
      .eq("id", categoryId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    revalidateTaxonomyViews();
    return {
      data: { ...(data as ManagedCategory), isInbox: data.slug === "inbox", usageCount: 0 },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (categoryError) throw categoryError;
    if (category.slug === "inbox") {
      throw new Error("Hızlı Kayıt kategorisi silinemez.");
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidateTaxonomyViews();
    return { data: { id: categoryId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getManagedTags(): Promise<ActionResult<ManagedTag[]>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const tagsResult = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    if (tagsResult.error) throw tagsResult.error;
    const tagIds = (tagsResult.data ?? []).map((tag) => tag.id);
    const noteTagsResult =
      tagIds.length > 0
        ? await supabase.from("note_tags").select("tag_id").in("tag_id", tagIds)
        : { data: [], error: null };

    if (noteTagsResult.error) throw noteTagsResult.error;

    const usageCounts = new Map<string, number>();
    (noteTagsResult.data ?? []).forEach((row) => {
      usageCounts.set(row.tag_id, (usageCounts.get(row.tag_id) ?? 0) + 1);
    });

    return {
      data: (tagsResult.data ?? []).map((tag) => ({
        ...tag,
        usageCount: usageCounts.get(tag.id) ?? 0,
      })) as ManagedTag[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createTag(input: {
  color: string;
  name: string;
}): Promise<ActionResult<ManagedTag>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const name = input.name.trim();
    const normalizedName = name.toLocaleLowerCase("tr-TR");
    const color = input.color.trim() || "#71717a";

    if (!name) {
      throw new Error("Etiket adi zorunludur.");
    }

    if (name.length > 50) {
      throw new Error("Etiket adi en fazla 50 karakter olabilir.");
    }

    const { data: existingTags, error: existingError } = await supabase
      .from("tags")
      .select("id,name")
      .eq("user_id", userId);

    if (existingError) throw existingError;
    if (
      (existingTags ?? []).some(
        (tag) => tag.name.toLocaleLowerCase("tr-TR") === normalizedName,
      )
    ) {
      throw new Error("Bu isimde bir etiket zaten mevcut.");
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({
        color,
        name,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) throw error;

    revalidateTaxonomyViews();
    return { data: { ...(data as ManagedTag), usageCount: 0 }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateTag(
  tagId: string,
  input: {
    color: string;
    name: string;
  },
): Promise<ActionResult<ManagedTag>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const name = input.name.trim();
    const normalizedName = name.toLocaleLowerCase("tr-TR");
    const color = input.color.trim() || "#71717a";

    if (!name) {
      throw new Error("Etiket adi zorunludur.");
    }

    const { data: otherTags, error: duplicateError } = await supabase
      .from("tags")
      .select("id,name")
      .eq("user_id", userId)
      .neq("id", tagId);

    if (duplicateError) throw duplicateError;
    if (
      (otherTags ?? []).some(
        (tag) => tag.name.toLocaleLowerCase("tr-TR") === normalizedName,
      )
    ) {
      throw new Error("Bu isimde bir etiket zaten mevcut.");
    }

    const { data, error } = await supabase
      .from("tags")
      .update({
        color,
        name,
      })
      .eq("id", tagId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    revalidateTaxonomyViews();
    return { data: { ...(data as ManagedTag), usageCount: 0 }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteTag(
  tagId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidateTaxonomyViews();
    return { data: { id: tagId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
