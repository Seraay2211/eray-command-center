"use server";

import { revalidatePath } from "next/cache";
import { createNote } from "@/features/notes/actions";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import type { AccountCenterData, ActionResult } from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function isMissingDataAreaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, user: data.user };
}

async function countOwnRows(
  supabase: SupabaseServerClient,
  table: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingDataAreaError(error)) return 0;
    throw error;
  }

  return count ?? 0;
}

async function getLastActivity(
  supabase: SupabaseServerClient,
  table: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .select("updated_at,created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingDataAreaError(error)) return null;
    throw error;
  }

  const row = data as
    | {
        created_at?: string | null;
        updated_at?: string | null;
      }
    | null;

  return row?.updated_at ?? row?.created_at ?? null;
}

export async function getAccountCenterData(): Promise<
  ActionResult<AccountCenterData>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const userId = user.id;
    const [
      noteCount,
      taskCount,
      financeCount,
      installmentCount,
      calendarCount,
      reportCount,
      lastNoteActivity,
      lastTaskActivity,
      lastFinanceActivity,
      lastCalendarActivity,
      lastReportActivity,
    ] = await Promise.all([
      countOwnRows(supabase, "notes", userId),
      countOwnRows(supabase, "tasks", userId),
      countOwnRows(supabase, "debts", userId),
      countOwnRows(supabase, "debt_installments", userId),
      countOwnRows(supabase, "planner_events", userId),
      countOwnRows(supabase, "reports", userId),
      getLastActivity(supabase, "notes", userId),
      getLastActivity(supabase, "tasks", userId),
      getLastActivity(supabase, "debts", userId),
      getLastActivity(supabase, "planner_events", userId),
      getLastActivity(supabase, "reports", userId),
    ]);

    return {
      data: {
        activity: {
          lastCalendarActivity,
          lastFinanceActivity,
          lastNoteActivity,
          lastReportActivity,
          lastTaskActivity,
        },
        counts: {
          calendarCount,
          financeCount,
          installmentCount,
          noteCount,
          reportCount,
          taskCount,
        },
      },
      error: null,
    };
  } catch {
    return {
      data: {
        activity: {
          lastCalendarActivity: null,
          lastFinanceActivity: null,
          lastNoteActivity: null,
          lastReportActivity: null,
          lastTaskActivity: null,
        },
        counts: {
          calendarCount: 0,
          financeCount: 0,
          installmentCount: 0,
          noteCount: 0,
          reportCount: 0,
          taskCount: 0,
        },
      },
      error: "Hesap verileri şu anda yüklenemiyor.",
    };
  }
}

export async function sendPasswordResetEmail(): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const email = user.email;

    if (!email) {
      throw new Error("E-posta adresi bulunamadı.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL("/reset-password", getAppUrl()).toString(),
    });

    if (error) throw error;
    return { data: null, error: null };
  } catch {
    return {
      data: null,
      error: "Şifre işlemi tamamlanamadı. Birazdan tekrar deneyebilirsin.",
    };
  }
}

export async function createFeedbackNote(): Promise<ActionResult<null>> {
  const today = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date());

  const result = await createNote({
    categoryId: null,
    content: "Sorun:\n\nBeklenen:\n\nEkran:\n\nNot:",
    isFavorite: false,
    isPinned: false,
    tags: ["geri-bildirim", "hesap"],
    title: `Geri Bildirim — ${today}`,
  });

  if (result.error) {
    return { data: null, error: "Geri bildirim notu oluşturulamadı." };
  }

  revalidatePath("/notes");
  return { data: null, error: null };
}

export async function createAccountDeletionRequestNote(): Promise<
  ActionResult<null>
> {
  const today = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date());

  const result = await createNote({
    categoryId: null,
    content: [
      "Bu kayıt yalnızca güvenli hesap silme talebi notudur.",
      "Gerçek silme işlemi otomatik olarak başlatılmadı.",
      "Devam etmeden önce verilerin dışa aktarılması önerilir.",
    ].join("\n"),
    isFavorite: false,
    isPinned: true,
    tags: ["hesap", "silme-talebi"],
    title: `Hesap Silme Talebi — ${today}`,
  });

  if (result.error) {
    return { data: null, error: "Hesap silme talebi notu oluşturulamadı." };
  }

  revalidatePath("/notes");
  return { data: null, error: null };
}
