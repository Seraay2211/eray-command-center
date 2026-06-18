"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  CreatePlannerEventInput,
  PlannerEventPriority,
  PlannerEventStatus,
  PlannerEventType,
  PlannerEventWithLinks,
  PlannerStats,
  TaskPriority,
  TaskStatus,
  UpdatePlannerEventInput,
} from "@/types";

const plannerEventSelect = `
  id,
  user_id,
  task_id,
  note_id,
  title,
  description,
  event_type,
  status,
  priority,
  start_at,
  end_at,
  all_day,
  color,
  created_at,
  updated_at,
  task:tasks (
    id,
    title,
    status,
    priority
  ),
  note:notes (
    id,
    title
  )
`;

const eventTypes: PlannerEventType[] = [
  "plan",
  "focus",
  "reminder",
  "meeting",
  "task",
  "note",
  "personal",
];

const eventStatuses: PlannerEventStatus[] = [
  "scheduled",
  "in_progress",
  "done",
  "cancelled",
];

const eventPriorities: PlannerEventPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

interface PlannerQueryParams {
  endAt?: string;
  eventId?: string;
  limit?: number;
  priority?: PlannerEventPriority | "all";
  query?: string;
  startAt?: string;
  status?: PlannerEventStatus | "all";
  type?: PlannerEventType | "all";
}

type LinkedItem<T> = T | T[] | null;

interface RawPlannerEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  note_id: string | null;
  title: string;
  description: string;
  event_type: PlannerEventType;
  status: PlannerEventStatus;
  priority: PlannerEventPriority;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  task: LinkedItem<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  }>;
  note: LinkedItem<{
    id: string;
    title: string;
  }>;
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Takvim alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum dogrulanamadi. Lütfen yeniden giris yapin.";
  }

  return message || "Takvim işlemi tamamlanamadi.";
}

function pickRelation<T>(value: LinkedItem<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapPlannerEvent(event: RawPlannerEvent): PlannerEventWithLinks {
  return {
    id: event.id,
    user_id: event.user_id,
    task_id: event.task_id,
    note_id: event.note_id,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    status: event.status,
    priority: event.priority,
    start_at: event.start_at,
    end_at: event.end_at,
    all_day: event.all_day,
    color: event.color,
    created_at: event.created_at,
    updated_at: event.updated_at,
    task: pickRelation(event.task),
    note: pickRelation(event.note),
  };
}

function normalizeDateTime(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tarih ve saat bilgisi gecerli olmali.");
  }

  return date.toISOString();
}

function validateInput(
  input: CreatePlannerEventInput | UpdatePlannerEventInput,
  requireTitle: boolean,
): UpdatePlannerEventInput {
  const values: UpdatePlannerEventInput = {};

  if (requireTitle || input.title !== undefined) {
    const title = input.title?.trim() ?? "";

    if (!title) {
      throw new Error("Plan basligi zorunludur.");
    }

    if (title.length > 200) {
      throw new Error("Plan basligi en fazla 200 karakter olabilir.");
    }

    values.title = title;
  }

  if (input.description !== undefined) {
    values.description = input.description.trim();
  }

  if (input.event_type !== undefined) {
    if (!eventTypes.includes(input.event_type)) {
      throw new Error("Gecersiz plan tipi.");
    }

    values.event_type = input.event_type;
  }

  if (input.status !== undefined) {
    if (!eventStatuses.includes(input.status)) {
      throw new Error("Gecersiz plan durumu.");
    }

    values.status = input.status;
  }

  if (input.priority !== undefined) {
    if (!eventPriorities.includes(input.priority)) {
      throw new Error("Gecersiz plan onceligi.");
    }

    values.priority = input.priority;
  }

  if (requireTitle || input.start_at !== undefined) {
    const startAt = normalizeDateTime(input.start_at);

    if (!startAt) {
      throw new Error("Baslangic zamani zorunludur.");
    }

    values.start_at = startAt;
  }

  if (input.end_at !== undefined) {
    values.end_at = normalizeDateTime(input.end_at);
  }

  if (
    values.start_at &&
    values.end_at &&
    new Date(values.end_at).getTime() < new Date(values.start_at).getTime()
  ) {
    throw new Error("Bitis zamani baslangictan once olamaz.");
  }

  if (input.all_day !== undefined) {
    values.all_day = Boolean(input.all_day);
  }

  if (input.task_id !== undefined) {
    values.task_id = input.task_id?.trim() || null;
  }

  if (input.note_id !== undefined) {
    values.note_id = input.note_id?.trim() || null;
  }

  if (input.color !== undefined) {
    values.color = input.color?.trim() || null;
  }

  return values;
}

function getTurkeyDateParts(value: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
  };
}

function getTodayRange() {
  const { day, month, year } = getTurkeyDateParts(new Date());
  const start = new Date(`${year}-${month}-${day}T00:00:00+03:00`);
  const end = new Date(`${year}-${month}-${day}T23:59:59.999+03:00`);

  return {
    endIso: end.toISOString(),
    startIso: start.toISOString(),
  };
}

function getUpcomingRange() {
  const start = new Date();
  start.setMinutes(0, 0, 0);

  return start.toISOString();
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum dogrulanamadi. Lütfen yeniden giris yapin.");
  }

  return { supabase, userId: data.user.id };
}

async function fetchPlannerEventById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string,
): Promise<PlannerEventWithLinks> {
  const { data, error } = await supabase
    .from("planner_events")
    .select(plannerEventSelect)
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Plan bulunamadi veya erişim izniniz yok.");

  return mapPlannerEvent(data as RawPlannerEvent);
}

function revalidatePlannerViews() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function getPlannerEvents(
  params: PlannerQueryParams = {},
): Promise<ActionResult<PlannerEventWithLinks[]>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    let query = supabase
      .from("planner_events")
      .select(plannerEventSelect)
      .eq("user_id", userId)
      .order("start_at", { ascending: true });

    if (params.eventId) {
      query = query.eq("id", params.eventId);
    }

    if (params.startAt) {
      query = query.gte("start_at", params.startAt);
    }

    if (params.endAt) {
      query = query.lte("start_at", params.endAt);
    }

    if (params.type && params.type !== "all") {
      query = query.eq("event_type", params.type);
    }

    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }

    if (params.priority && params.priority !== "all") {
      query = query.eq("priority", params.priority);
    }

    if (params.query?.trim()) {
      const value = params.query.trim();
      query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%`);
    }

    if (params.limit) {
      query = query.limit(Math.min(Math.max(params.limit, 1), 100));
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: ((data ?? []) as RawPlannerEvent[]).map(mapPlannerEvent),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTodayPlannerEvents(
  limit = 5,
): Promise<ActionResult<PlannerEventWithLinks[]>> {
  const { startIso, endIso } = getTodayRange();
  return getPlannerEvents({ endAt: endIso, limit, startAt: startIso });
}

export async function getUpcomingPlannerEvents(
  limit = 10,
): Promise<ActionResult<PlannerEventWithLinks[]>> {
  return getPlannerEvents({
    limit,
    startAt: getUpcomingRange(),
    status: "all",
  });
}

export async function createPlannerEvent(
  input: CreatePlannerEventInput,
): Promise<ActionResult<PlannerEventWithLinks>> {
  try {
    const values = validateInput(input, true);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("planner_events")
      .insert({
        user_id: userId,
        title: values.title,
        description: values.description ?? "",
        event_type: values.event_type ?? "plan",
        status: values.status ?? "scheduled",
        priority: values.priority ?? "medium",
        start_at: values.start_at,
        end_at: values.end_at ?? null,
        all_day: values.all_day ?? false,
        task_id: values.task_id ?? null,
        note_id: values.note_id ?? null,
        color: values.color ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const event = await fetchPlannerEventById(supabase, userId, data.id);
    revalidatePlannerViews();
    return { data: event, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updatePlannerEvent(
  eventId: string,
  input: UpdatePlannerEventInput,
): Promise<ActionResult<PlannerEventWithLinks>> {
  try {
    const values = validateInput(input, false);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("planner_events")
      .update(values)
      .eq("id", eventId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Plan bulunamadi veya düzenleme yetkiniz yok.");
    }

    const event = await fetchPlannerEventById(supabase, userId, eventId);
    revalidatePlannerViews();
    return { data: event, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deletePlannerEvent(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("planner_events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Plan bulunamadi veya silme yetkiniz yok.");
    }

    revalidatePlannerViews();
    return { data: { id: eventId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function markPlannerEventDone(
  eventId: string,
): Promise<ActionResult<PlannerEventWithLinks>> {
  return updatePlannerEvent(eventId, { status: "done" });
}

export async function getPlannerStats(): Promise<ActionResult<PlannerStats>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { startIso, endIso } = getTodayRange();
    const upcomingStart = getUpcomingRange();
    const [totalResult, todayResult, completedResult, upcomingResult] =
      await Promise.all([
        supabase
          .from("planner_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("planner_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("start_at", startIso)
          .lte("start_at", endIso),
        supabase
          .from("planner_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "done"),
        supabase
          .from("planner_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("start_at", upcomingStart)
          .neq("status", "done")
          .neq("status", "cancelled"),
      ]);

    if (totalResult.error) throw totalResult.error;
    if (todayResult.error) throw todayResult.error;
    if (completedResult.error) throw completedResult.error;
    if (upcomingResult.error) throw upcomingResult.error;

    return {
      data: {
        total: totalResult.count ?? 0,
        today: todayResult.count ?? 0,
        completed: completedResult.count ?? 0,
        upcoming: upcomingResult.count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
