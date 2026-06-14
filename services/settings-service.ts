"use server";

import { revalidatePath } from "next/cache";
import { createDefaultUserSettings } from "@/lib/settings/defaults";
import { APP_THEME_IDS } from "@/lib/settings/themes";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  AiActionKey,
  AiProvider,
  AppDensity,
  AppFontFamily,
  AppLanguage,
  AppTheme,
  DashboardLayout,
  DefaultLandingPage,
  SidebarMode,
  TaskPriority,
  TaskStatus,
  UpdateUserSettingsInput,
  UserDataExport,
  UserSettings,
} from "@/types";

const languages: AppLanguage[] = ["tr", "en"];
const densities: AppDensity[] = ["comfortable", "compact"];
const sidebarModes: SidebarMode[] = ["expanded", "collapsed"];
const fontFamilies: AppFontFamily[] = ["inter", "geist", "system"];
const landingPages: DefaultLandingPage[] = [
  "dashboard",
  "today",
  "notes",
  "finance",
  "tasks",
];
const dashboardLayouts: DashboardLayout[] = ["default", "focus", "compact"];
const taskStatuses: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high", "critical"];
const aiProviders: AiProvider[] = ["gemini", "demo"];
const aiActions: AiActionKey[] = [
  "summarize",
  "shorten",
  "premium",
  "manager_report",
];

function isMissingTableError(message: string): boolean {
  return (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  );
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (isMissingTableError(message)) {
    return "Ayarlar veritabanı henüz hazır değil. database/phase-8-settings.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }

  if (
    message.includes("show_dashboard_calendar") ||
    message.includes("user_settings_app_theme_check")
  ) {
    return "Faz 9 ayar guncellemesi eksik. database/phase-9-calendar.sql dosyasini Supabase SQL Editor icinde calistirin.";
  }

  if (
    message.includes("font_family") ||
    message.includes("default_landing_page") ||
    message.includes("notifications_enabled") ||
    message.includes("critical_debt_threshold") ||
    message.includes("onboarding_completed")
  ) {
    return "Faz 18 ayar güncellemesi eksik. database/phase-18-settings-center.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum bulunamadı. Lütfen tekrar giriş yap.";
  }

  return message || "Ayarlar yüklenemedi.";
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, user: data.user };
}

function sanitizeInput(
  input: UpdateUserSettingsInput,
): UpdateUserSettingsInput {
  const values: UpdateUserSettingsInput = {};

  if (input.display_name !== undefined) {
    const name = input.display_name?.trim() || null;
    if (name && name.length > 80) {
      throw new Error("Görünen ad en fazla 80 karakter olabilir.");
    }
    values.display_name = name;
  }
  if (
    input.app_theme !== undefined &&
    APP_THEME_IDS.includes(input.app_theme)
  ) {
    values.app_theme = input.app_theme as AppTheme;
  }
  if (input.language !== undefined && languages.includes(input.language)) {
    values.language = input.language;
  }
  if (input.density !== undefined && densities.includes(input.density)) {
    values.density = input.density;
  }
  if (
    input.sidebar_mode !== undefined &&
    sidebarModes.includes(input.sidebar_mode)
  ) {
    values.sidebar_mode = input.sidebar_mode;
  }
  if (
    input.font_family !== undefined &&
    fontFamilies.includes(input.font_family)
  ) {
    values.font_family = input.font_family;
  }
  if (
    input.default_landing_page !== undefined &&
    landingPages.includes(input.default_landing_page)
  ) {
    values.default_landing_page = input.default_landing_page;
  }
  if (input.default_currency === "TRY") {
    values.default_currency = "TRY";
  }
  if (input.critical_debt_threshold !== undefined) {
    const threshold = Number(input.critical_debt_threshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new Error("Kritik borç eşiği geçerli bir tutar olmalıdır.");
    }
    values.critical_debt_threshold = Math.round(threshold * 100) / 100;
  }
  if (
    input.dashboard_layout !== undefined &&
    dashboardLayouts.includes(input.dashboard_layout)
  ) {
    values.dashboard_layout = input.dashboard_layout;
  }
  if (input.default_note_category_id !== undefined) {
    values.default_note_category_id =
      input.default_note_category_id?.trim() || null;
  }
  if (
    input.default_task_status !== undefined &&
    taskStatuses.includes(input.default_task_status)
  ) {
    values.default_task_status = input.default_task_status;
  }
  if (
    input.default_task_priority !== undefined &&
    taskPriorities.includes(input.default_task_priority)
  ) {
    values.default_task_priority = input.default_task_priority;
  }
  if (
    input.ai_provider !== undefined &&
    aiProviders.includes(input.ai_provider)
  ) {
    values.ai_provider = input.ai_provider;
  }
  if (
    input.ai_default_action !== undefined &&
    aiActions.includes(input.ai_default_action)
  ) {
    values.ai_default_action = input.ai_default_action;
  }

  const booleanKeys = [
    "ai_save_history",
    "ai_sensitive_warning",
    "show_dashboard_notes",
    "show_dashboard_tasks",
    "show_dashboard_reports",
    "show_dashboard_ai",
    "show_dashboard_calendar",
    "confirm_before_delete",
    "compact_cards",
    "reduce_motion",
    "notifications_enabled",
    "finance_alerts_enabled",
    "task_alerts_enabled",
    "calendar_alerts_enabled",
    "highlight_critical_alerts",
    "highlight_overdue_debts",
    "show_ai_summaries",
    "show_finance_ai_warning",
    "short_ai_response_mode",
    "onboarding_completed",
  ] as const;

  booleanKeys.forEach((key) => {
    if (input[key] !== undefined) values[key] = Boolean(input[key]);
  });

  return values;
}

function normalizeSettings(
  userId: string,
  value: Partial<UserSettings> | null,
): UserSettings {
  const defaults = createDefaultUserSettings(userId);
  const threshold = Number(value?.critical_debt_threshold);
  return {
    ...defaults,
    ...value,
    user_id: value?.user_id ?? userId,
    critical_debt_threshold: Number.isFinite(threshold)
      ? threshold
      : defaults.critical_debt_threshold,
  };
}

async function readSettings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data
    ? normalizeSettings(userId, data as Partial<UserSettings>)
    : null;
}

export async function getUserSettings(): Promise<ActionResult<UserSettings>> {
  let userId = "";

  try {
    const context = await getAuthenticatedContext();
    userId = context.user.id;
    const settings = await readSettings(context.supabase, userId);

    return {
      data: settings ?? createDefaultUserSettings(userId),
      error: null,
    };
  } catch (error) {
    return {
      data: createDefaultUserSettings(userId),
      error: getErrorMessage(error),
    };
  }
}

export async function getOrCreateUserSettings(): Promise<
  ActionResult<UserSettings>
> {
  let userId = "";

  try {
    const { supabase, user } = await getAuthenticatedContext();
    userId = user.id;
    const existing = await readSettings(supabase, userId);
    if (existing) return { data: existing, error: null };

    const { data, error } = await supabase
      .from("user_settings")
      .insert({ user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return {
      data: normalizeSettings(userId, data as Partial<UserSettings>),
      error: null,
    };
  } catch (error) {
    return {
      data: createDefaultUserSettings(userId),
      error: getErrorMessage(error),
    };
  }
}

export async function updateUserSettings(
  input: UpdateUserSettingsInput,
): Promise<ActionResult<UserSettings>> {
  try {
    const values = sanitizeInput(input);
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          ...values,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath("/", "layout");
    return {
      data: normalizeSettings(user.id, data as Partial<UserSettings>),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function resetUserSettings(): Promise<
  ActionResult<UserSettings>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const defaults = createDefaultUserSettings(user.id);
    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...resetValues
    } = defaults;
    void _id;
    void _createdAt;
    void _updatedAt;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(resetValues, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath("/", "layout");
    return {
      data: normalizeSettings(user.id, data as Partial<UserSettings>),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportUserData(): Promise<
  ActionResult<UserDataExport>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const settings = await readSettings(supabase, user.id);

    async function readTable(
      table:
        | "notes"
        | "tasks"
        | "reports"
        | "debts"
        | "debt_payments",
    ) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error && !isMissingTableError(error.message)) throw error;
      return data ?? [];
    }

    const [notes, tasks, reports, debts, debtPayments] = await Promise.all([
      readTable("notes"),
      readTable("tasks"),
      readTable("reports"),
      readTable("debts"),
      readTable("debt_payments"),
    ]);

    return {
      data: {
        exported_at: new Date().toISOString(),
        version: "1.0.0",
        settings: settings ?? createDefaultUserSettings(user.id),
        notes,
        tasks,
        reports,
        debts,
        debt_payments: debtPayments,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportNotesData(): Promise<
  ActionResult<{ exported_at: string; notes: unknown[] }>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return {
      data: { exported_at: new Date().toISOString(), notes: data ?? [] },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportFinanceData(): Promise<
  ActionResult<{
    exported_at: string;
    debts: unknown[];
    debt_payments: unknown[];
  }>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const [debtsResult, paymentsResult] = await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("debt_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (debtsResult.error) throw debtsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    return {
      data: {
        exported_at: new Date().toISOString(),
        debts: debtsResult.data ?? [],
        debt_payments: paymentsResult.data ?? [],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
