"use server";

import { revalidatePath } from "next/cache";
import { getIstanbulDayRange } from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  Category,
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStats,
  TaskStatus,
  TaskWithCategory,
  UpdateTaskInput,
} from "@/types";

const taskSelect = `
  id,
  user_id,
  category_id,
  title,
  description,
  status,
  priority,
  due_date,
  completed_at,
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
  )
`;

const taskStatuses: TaskStatus[] = [
  "todo",
  "in_progress",
  "waiting",
  "done",
];

const taskPriorities: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

interface RawTask extends Task {
  category: Category | Category[] | null;
}

interface GetTasksOptions {
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

  if (message.includes("archived_at") || message.includes("PGRST204")) {
    return "Görev arşivi şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Görev alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.";
  }

  return message || "Görev işlemi tamamlanamadı.";
}

function mapTask(rawTask: RawTask): TaskWithCategory {
  return {
    id: rawTask.id,
    user_id: rawTask.user_id,
    category_id: rawTask.category_id,
    title: rawTask.title,
    description: rawTask.description,
    status: rawTask.status,
    priority: rawTask.priority,
    due_date: rawTask.due_date,
    completed_at: rawTask.completed_at,
    archived_at: rawTask.archived_at,
    created_at: rawTask.created_at,
    updated_at: rawTask.updated_at,
    category: Array.isArray(rawTask.category)
      ? (rawTask.category[0] ?? null)
      : rawTask.category,
  };
}

function normalizeDueDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Son tarih geçerli bir tarih olmalıdır.");
  }

  return date.toISOString();
}

function validateInput(
  input: CreateTaskInput | UpdateTaskInput,
  requireTitle: boolean,
): UpdateTaskInput {
  const values: UpdateTaskInput = {};

  if (requireTitle || input.title !== undefined) {
    const title = input.title?.trim() ?? "";

    if (!title) {
      throw new Error("Görev başlığı zorunludur.");
    }

    if (title.length > 200) {
      throw new Error("Görev başlığı en fazla 200 karakter olabilir.");
    }

    values.title = title;
  }

  if (input.description !== undefined) {
    values.description = input.description.trim();
  }

  if (input.category_id !== undefined) {
    values.category_id = input.category_id || null;
  }

  if (input.status !== undefined) {
    if (!taskStatuses.includes(input.status)) {
      throw new Error("Geçersiz görev durumu.");
    }

    values.status = input.status;
  }

  if (input.priority !== undefined) {
    if (!taskPriorities.includes(input.priority)) {
      throw new Error("Geçersiz görev önceliği.");
    }

    values.priority = input.priority;
  }

  if (input.due_date !== undefined) {
    values.due_date = normalizeDueDate(input.due_date);
  }

  return values;
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
  }

  return { supabase, user: data.user };
}

async function fetchTaskById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskId: string,
): Promise<TaskWithCategory> {
  const { data, error } = await supabase
    .from("tasks")
    .select(taskSelect)
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return mapTask(data as unknown as RawTask);
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function getTasks(
  options: GetTasksOptions = {},
): Promise<ActionResult<TaskWithCategory[]>> {
  try {
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);
    const offset = Math.max(options.offset ?? 0, 0);
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .select(taskSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: ((data ?? []) as unknown as RawTask[]).map(mapTask),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTodayTasks(
  limitValue = 20,
): Promise<ActionResult<TaskWithCategory[]>> {
  try {
    const limit = Math.min(Math.max(limitValue, 1), 20);
    const { startIso, endIso } = getIstanbulDayRange();
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .select(taskSelect)
      .eq("user_id", user.id)
      .is("archived_at", null)
      .gte("due_date", startIso)
      .lt("due_date", endIso)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      data: ((data ?? []) as unknown as RawTask[]).map(mapTask),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTaskById(
  taskId: string,
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();

    return {
      data: await fetchTaskById(supabase, user.id, taskId),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createTask(
  input: CreateTaskInput,
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const values = validateInput(input, true);
    const status = values.status ?? "todo";
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        category_id: values.category_id ?? null,
        title: values.title,
        description: values.description ?? "",
        status,
        priority: values.priority ?? "medium",
        due_date: values.due_date ?? null,
        completed_at: status === "done" ? new Date().toISOString() : null,
        archived_at: null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const task = await fetchTaskById(supabase, user.id, data.id);
    revalidateTaskViews();
    return { data: task, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const values = validateInput(input, false);
    const { supabase, user } = await getAuthenticatedContext();
    const updateValues: Record<string, unknown> = { ...values };

    if (values.status !== undefined) {
      const { data: existingTask, error: readError } = await supabase
        .from("tasks")
        .select("status,completed_at")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (readError) throw readError;
      if (!existingTask) {
        throw new Error("Görev bulunamadı veya düzenleme yetkiniz yok.");
      }

      updateValues.completed_at =
        values.status === "done"
          ? existingTask.status === "done"
            ? (existingTask.completed_at ?? new Date().toISOString())
            : new Date().toISOString()
          : null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateValues)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Görev bulunamadı veya düzenleme yetkiniz yok.");
    }

    const task = await fetchTaskById(supabase, user.id, taskId);
    revalidateTaskViews();
    return { data: task, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteTask(
  taskId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Görev bulunamadı veya silme yetkiniz yok.");
    }

    revalidateTaskViews();
    return { data: { id: taskId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult<TaskWithCategory>> {
  return updateTask(taskId, { status });
}

export async function archiveTask(
  taskId: string,
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Görev bulunamadı veya arşivleme yetkiniz yok.");
    }

    const task = await fetchTaskById(supabase, user.id, taskId);
    revalidateTaskViews();
    return { data: task, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function restoreArchivedTask(
  taskId: string,
): Promise<ActionResult<TaskWithCategory>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data: existingTask, error: readError } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;
    if (!existingTask) {
      throw new Error("Görev bulunamadı veya arşivden çıkarma yetkiniz yok.");
    }

    const updateValues: Record<string, unknown> = { archived_at: null };
    if (existingTask.status === "done") {
      updateValues.status = "todo";
      updateValues.completed_at = null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateValues)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Görev bulunamadı veya arşivden çıkarma yetkiniz yok.");
    }

    const task = await fetchTaskById(supabase, user.id, taskId);
    revalidateTaskViews();
    return { data: task, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTaskStats(): Promise<ActionResult<TaskStats>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const [totalResult, completedResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("archived_at", null),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("archived_at", null)
        .eq("status", "done"),
    ]);

    if (totalResult.error) throw totalResult.error;
    if (completedResult.error) throw completedResult.error;

    const total = totalResult.count ?? 0;
    const completed = completedResult.count ?? 0;

    return {
      data: {
        total,
        completed,
        open: Math.max(total - completed, 0),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
