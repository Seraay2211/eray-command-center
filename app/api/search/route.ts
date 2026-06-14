import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/types";

const SEARCH_LIMIT = 5;

interface SearchRow {
  content?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  name?: string | null;
  priority?: string | null;
  report_type?: string | null;
  start_at?: string | null;
  status?: string | null;
  summary?: string | null;
  title: string;
  updated_at?: string | null;
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("PGRST205") ||
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

function buildPreview(value?: string | null, maxLength = 120): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function createMeta(parts: Array<string | null | undefined>) {
  const filtered = parts
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  return filtered.length ? filtered.join(" · ") : null;
}

async function searchNotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  query: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id,title,content,updated_at,category:categories(name)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as Array<
    SearchRow & {
      category?:
        | { name: string | null }
        | Array<{ name: string | null }>
        | null;
    }
  >).map((item) => {
    const category = Array.isArray(item.category)
      ? (item.category[0] ?? null)
      : item.category;
    const formattedDate = formatDate(item.updated_at);

    return {
      id: item.id,
      type: "note",
      title: item.title,
      description: buildPreview(item.content),
      href: `/notes?note=${encodeURIComponent(item.id)}`,
      meta: createMeta([category?.name ?? "Not", formattedDate]),
      created_at: item.updated_at ?? null,
    } satisfies SearchResult;
  });
}

async function searchTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  query: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,description,status,priority,updated_at")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as SearchRow[]).map((item) => ({
    id: item.id,
    type: "task",
    title: item.title,
    description: buildPreview(item.description),
    href: `/tasks?task=${encodeURIComponent(item.id)}`,
    meta: createMeta([
      item.status ?? "Görev",
      item.priority ?? null,
      formatDate(item.updated_at),
    ]),
    created_at: item.updated_at ?? null,
  }));
}

async function searchReports(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  query: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("id,title,summary,content,report_type,status,updated_at")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as SearchRow[]).map((item) => ({
    id: item.id,
    type: "report",
    title: item.title,
    description: buildPreview(item.summary || item.content),
    href: `/reports?report=${encodeURIComponent(item.id)}`,
    meta: createMeta([
      item.report_type ?? "Rapor",
      item.status ?? null,
      formatDate(item.updated_at),
    ]),
    created_at: item.updated_at ?? null,
  }));
}

async function searchCalendar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  query: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("planner_events")
    .select("id,title,description,status,start_at")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("start_at", { ascending: true })
    .limit(SEARCH_LIMIT);

  if (error) {
    if (isMissingTableError(error.message)) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as SearchRow[]).map((item) => ({
    id: item.id,
    type: "calendar",
    title: item.title,
    description: buildPreview(item.description),
    href: `/calendar?event=${encodeURIComponent(item.id)}`,
    meta: createMeta([
      item.status ?? "Plan",
      formatDate(item.start_at ?? item.updated_at ?? null),
    ]),
    created_at: item.start_at ?? item.updated_at ?? null,
  }));
}

function sortResults(results: SearchResult[]): SearchResult[] {
  return results.sort((left, right) => {
    const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightDate = right.created_at
      ? new Date(right.created_at).getTime()
      : 0;

    return rightDate - leftDate;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({
      success: true,
      results: [],
    });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Oturum yok.",
        },
        { status: 401 },
      );
    }

    const userId = data.user.id;
    const results = await Promise.all([
      searchNotes(supabase, userId, query),
      searchTasks(supabase, userId, query),
      searchReports(supabase, userId, query),
      searchCalendar(supabase, userId, query),
    ]);

    return NextResponse.json({
      success: true,
      results: sortResults(results.flat()),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Arama yapilamadi. Lütfen tekrar dene.",
      },
      { status: 500 },
    );
  }
}
