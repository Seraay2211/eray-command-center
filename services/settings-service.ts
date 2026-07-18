"use server";

import { revalidatePath } from "next/cache";
import { normalizeAppearancePreferences } from "@/lib/settings/appearance-preferences";
import { normalizeDashboardPreferences } from "@/lib/settings/dashboard-preferences";
import { createDefaultUserSettings } from "@/lib/settings/defaults";
import {
  APP_THEME_IDS,
  isNewThemeId,
} from "@/lib/settings/themes";
import { createClient } from "@/lib/supabase/server";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/tasks";
import { formatTRY } from "@/lib/utils/currency";
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

interface NotesExportData {
  exported_at: string;
  notes: ExportNote[];
  text: string;
}

interface TasksExportData {
  exported_at: string;
  csv: string;
  tasks: ExportTask[];
}

interface FinanceExportData {
  exported_at: string;
  csv: string;
  debts: ExportDebt[];
  payments: ExportPayment[];
  installments: ExportInstallment[];
}

interface ExportNote {
  id: string;
  baslik: string;
  icerik: string;
  kategori: string;
  etiketler: string;
  olusturma_tarihi: string;
  guncelleme_tarihi: string;
  sabit: string;
  favori: string;
  arsiv: string;
}

interface ExportTask {
  id: string;
  gorev: string;
  aciklama: string;
  durum: string;
  oncelik: string;
  tarih: string;
  tamamlanma: string;
  kategori: string;
  etiket: string;
  arsiv: string;
}

interface ExportDebt {
  id: string;
  borc_adi: string;
  kurum_kisi: string;
  toplam_tutar: string;
  odenen: string;
  kalan: string;
  son_odeme_tarihi: string;
  taksitli_mi: string;
  taksit_tutari: string;
  sonraki_taksit: string;
  durum: string;
  oncelik: string;
  not: string;
  odeme_gecmisi: string;
}

interface ExportPayment {
  id: string;
  debt_id: string;
  tutar: string;
  odeme_tarihi: string;
  yontem: string;
  not: string;
}

interface ExportInstallment {
  id: string;
  debt_id: string;
  taksit_no: number;
  son_odeme_tarihi: string;
  beklenen_tutar: string;
  odenen_tutar: string;
  durum: string;
}

interface RawExportNote {
  id: string;
  title: string | null;
  content: string | null;
  status?: string | null;
  is_pinned?: boolean | null;
  is_favorite?: boolean | null;
  archived_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
  category?: { name?: string | null } | Array<{ name?: string | null }> | null;
  note_tags?:
    | Array<{
        tag?: { name?: string | null } | Array<{ name?: string | null }> | null;
      }>
    | null;
}

interface RawExportTask {
  id: string;
  title: string | null;
  description: string | null;
  status: keyof typeof TASK_STATUS_LABELS | null;
  priority: keyof typeof TASK_PRIORITY_LABELS | null;
  due_date: string | null;
  completed_at: string | null;
  archived_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: { name?: string | null } | Array<{ name?: string | null }> | null;
}

interface RawExportDebt {
  id: string;
  title: string | null;
  creditor: string | null;
  total_amount: number | string | null;
  paid_amount: number | string | null;
  status: keyof typeof debtStatusLabels | null;
  priority: keyof typeof debtPriorityLabels | null;
  due_date: string | null;
  is_installment?: boolean | null;
  installment_amount?: number | string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RawExportPayment {
  id: string;
  debt_id: string;
  amount: number | string | null;
  payment_date: string | null;
  method: string | null;
  note: string | null;
  created_at?: string | null;
}

interface RawExportInstallment {
  id: string;
  debt_id: string;
  installment_no: number | string | null;
  due_date: string | null;
  expected_amount: number | string | null;
  paid_amount: number | string | null;
  status: string | null;
}

const languages: AppLanguage[] = ["tr", "en"];
const densities: AppDensity[] = ["comfortable", "balanced", "compact"];
const sidebarModes: SidebarMode[] = ["expanded", "collapsed"];
const fontFamilies: AppFontFamily[] = [
  "system",
  "inter",
  "geist",
  "manrope",
  "jakarta",
  "nunito",
  "roboto",
  "ibm-plex",
  "outfit",
  "space-grotesk",
];
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

const debtStatusLabels = {
  active: "Aktif",
  overdue: "Gecikmiş",
  structured: "Yapılandırıldı",
  paid: "Kapandı",
  cancelled: "İptal",
} as const;

const debtPriorityLabels = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
} as const;

const installmentStatusLabels: Record<string, string> = {
  pending: "Bekliyor",
  partial: "Kısmi Ödendi",
  paid: "Ödendi",
  overdue: "Gecikmiş",
};

const notesExportSelect = `
  id,
  title,
  content,
  status,
  is_pinned,
  is_favorite,
  archived_at,
  created_at,
  updated_at,
  category:categories (
    name
  ),
  note_tags (
    tag:tags (
      name
    )
  )
`;

const tasksExportSelect = `
  id,
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
    name
  )
`;

const debtsExportSelect =
  "id,title,creditor,total_amount,paid_amount,status,priority,due_date,is_installment,installment_amount,notes,created_at,updated_at";
const legacyDebtsExportSelect =
  "id,title,creditor,total_amount,paid_amount,status,priority,due_date,notes,created_at,updated_at";
const paymentsExportSelect =
  "id,debt_id,amount,payment_date,method,note,created_at";
const installmentsExportSelect =
  "id,debt_id,installment_no,due_date,expected_amount,paid_amount,status";

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
    return "Ayarlar alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("show_dashboard_calendar") ||
    message.includes("user_settings_app_theme_check")
  ) {
    return "Ayarlar alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("appearance_preferences") ||
    message.includes("dashboard_preferences") ||
    message.includes("user_settings_density_check") ||
    message.includes("user_settings_font_family_check")
  ) {
    return "Görünüm Merkezi şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("font_family") ||
    message.includes("default_landing_page") ||
    message.includes("notifications_enabled") ||
    message.includes("critical_debt_threshold") ||
    message.includes("onboarding_completed")
  ) {
    return "Ayarlar alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (message.toLowerCase().includes("jwt")) {
    return "Oturum bulunamadı. Lütfen tekrar giriş yap.";
  }

  return message || "Ayarlar yüklenemedi.";
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function yesNo(value: boolean): string {
  return value ? "Evet" : "Hayır";
}

function getRelationName(
  value: { name?: string | null } | Array<{ name?: string | null }> | null | undefined,
): string {
  const item = Array.isArray(value) ? value[0] : value;
  return cleanText(item?.name) || "Kategorisiz";
}

function getNoteTags(note: RawExportNote): string {
  return (
    note.note_tags
      ?.flatMap(({ tag }) => {
        const items = Array.isArray(tag) ? tag : tag ? [tag] : [];
        return items.map((item) => cleanText(item.name)).filter(Boolean);
      })
      .join(", ") ?? ""
  );
}

function stripUserFields<T extends Record<string, unknown>>(row: T) {
  const { user_id: _userId, ...rest } = row;
  void _userId;
  return rest;
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[;"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [
    headers.map(escapeCsv).join(";"),
    ...rows.map((row) => row.map(escapeCsv).join(";")),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

function buildNotesText(notes: ExportNote[]): string {
  const lines = [
    "ERAY COMMAND CENTER - NOT YEDEĞİ",
    `Dışa aktarma: ${new Date().toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
    })}`,
    "",
  ];

  notes.forEach((note, index) => {
    lines.push(`${index + 1}. ${note.baslik || "Başlıksız Not"}`);
    lines.push(`Kategori: ${note.kategori}`);
    if (note.etiketler) lines.push(`Etiketler: ${note.etiketler}`);
    lines.push(`Oluşturma: ${note.olusturma_tarihi}`);
    lines.push("");
    lines.push(note.icerik || "İçerik yok.");
    lines.push("");
    lines.push("-----");
    lines.push("");
  });

  return lines.join("\n");
}

function mapExportNote(note: RawExportNote): ExportNote {
  return {
    id: note.id,
    baslik: cleanText(note.title) || "Başlıksız Not",
    icerik: cleanText(note.content),
    kategori: getRelationName(note.category),
    etiketler: getNoteTags(note),
    olusturma_tarihi: note.created_at ?? "",
    guncelleme_tarihi: note.updated_at ?? "",
    sabit: yesNo(Boolean(note.is_pinned)),
    favori: yesNo(Boolean(note.is_favorite)),
    arsiv: yesNo(Boolean(note.archived_at)),
  };
}

function mapExportTask(task: RawExportTask): ExportTask {
  const status = task.status
    ? TASK_STATUS_LABELS[task.status] ?? task.status
    : "";
  const priority = task.priority
    ? TASK_PRIORITY_LABELS[task.priority] ?? task.priority
    : "";

  return {
    id: task.id,
    gorev: cleanText(task.title) || "Başlıksız Görev",
    aciklama: cleanText(task.description),
    durum: status,
    oncelik: priority,
    tarih: task.due_date ?? "",
    tamamlanma: task.completed_at ?? "",
    kategori: getRelationName(task.category),
    etiket: "",
    arsiv: yesNo(Boolean(task.archived_at)),
  };
}

function mapExportPayment(payment: RawExportPayment): ExportPayment {
  return {
    id: payment.id,
    debt_id: payment.debt_id,
    tutar: formatTRY(payment.amount),
    odeme_tarihi: payment.payment_date ?? "",
    yontem: cleanText(payment.method),
    not: cleanText(payment.note),
  };
}

function mapExportInstallment(
  installment: RawExportInstallment,
): ExportInstallment {
  return {
    id: installment.id,
    debt_id: installment.debt_id,
    taksit_no: Number(installment.installment_no) || 0,
    son_odeme_tarihi: installment.due_date ?? "",
    beklenen_tutar: formatTRY(installment.expected_amount),
    odenen_tutar: formatTRY(installment.paid_amount),
    durum:
      installmentStatusLabels[installment.status ?? ""] ??
      cleanText(installment.status),
  };
}

function mapExportDebt(
  debt: RawExportDebt,
  payments: ExportPayment[],
  installments: ExportInstallment[],
): ExportDebt {
  const total = toNumber(debt.total_amount);
  const paid = toNumber(debt.paid_amount);
  const remaining = Math.max(total - paid, 0);
  const debtPayments = payments.filter((payment) => payment.debt_id === debt.id);
  const debtInstallments = installments
    .filter((installment) => installment.debt_id === debt.id)
    .sort((left, right) => left.taksit_no - right.taksit_no);
  const nextInstallment = debtInstallments.find(
    (installment) => installment.durum !== "Ödendi",
  );

  return {
    id: debt.id,
    borc_adi: cleanText(debt.title) || "Başlıksız Borç",
    kurum_kisi: cleanText(debt.creditor),
    toplam_tutar: formatTRY(total),
    odenen: formatTRY(paid),
    kalan: formatTRY(remaining),
    son_odeme_tarihi: debt.due_date ?? "",
    taksitli_mi: yesNo(Boolean(debt.is_installment) || debtInstallments.length > 0),
    taksit_tutari: debt.installment_amount
      ? formatTRY(debt.installment_amount)
      : "",
    sonraki_taksit: nextInstallment
      ? `${nextInstallment.taksit_no}. taksit - ${nextInstallment.son_odeme_tarihi}`
      : "",
    durum: debt.status
      ? debtStatusLabels[debt.status] ?? debt.status
      : "",
    oncelik: debt.priority
      ? debtPriorityLabels[debt.priority] ?? debt.priority
      : "",
    not: cleanText(debt.notes),
    odeme_gecmisi: debtPayments
      .map((payment) => `${payment.odeme_tarihi}: ${payment.tutar}`)
      .join(" | "),
  };
}

function buildTasksCsv(tasks: ExportTask[]): string {
  return buildCsv(
    [
      "Görev",
      "Açıklama",
      "Durum",
      "Öncelik",
      "Tarih",
      "Tamamlanma",
      "Kategori",
      "Etiket",
      "Arşiv",
    ],
    tasks.map((task) => [
      task.gorev,
      task.aciklama,
      task.durum,
      task.oncelik,
      task.tarih,
      task.tamamlanma,
      task.kategori,
      task.etiket,
      task.arsiv,
    ]),
  );
}

function buildFinanceCsv(debts: ExportDebt[]): string {
  return buildCsv(
    [
      "Borç Adı",
      "Kurum/Kişi",
      "Toplam Tutar",
      "Ödenen",
      "Kalan",
      "Son Ödeme Tarihi",
      "Taksitli mi",
      "Taksit Tutarı",
      "Sonraki Taksit",
      "Durum",
      "Öncelik",
      "Not",
      "Ödeme Geçmişi",
    ],
    debts.map((debt) => [
      debt.borc_adi,
      debt.kurum_kisi,
      debt.toplam_tutar,
      debt.odenen,
      debt.kalan,
      debt.son_odeme_tarihi,
      debt.taksitli_mi,
      debt.taksit_tutari,
      debt.sonraki_taksit,
      debt.durum,
      debt.oncelik,
      debt.not,
      debt.odeme_gecmisi,
    ]),
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
  if (input.appearance_preferences !== undefined) {
    values.appearance_preferences = normalizeAppearancePreferences(
      input.appearance_preferences,
    );
  }
  if (input.dashboard_preferences !== undefined) {
    values.dashboard_preferences = normalizeDashboardPreferences(
      input.dashboard_preferences,
    );
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
    font_family:
      value?.font_family === "geist"
        ? "system"
        : value?.font_family ?? defaults.font_family,
    appearance_preferences: normalizeAppearancePreferences(
      value?.appearance_preferences,
    ),
    dashboard_preferences: normalizeDashboardPreferences(
      value?.dashboard_preferences,
    ),
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

    if (
      error &&
      values.app_theme &&
      isNewThemeId(values.app_theme) &&
      error.message.includes("user_settings_app_theme_check")
    ) {
      const current =
        (await readSettings(supabase, user.id)) ??
        createDefaultUserSettings(user.id);

      return {
        data: {
          ...current,
          app_theme: values.app_theme,
        },
        error: null,
      };
    }

    if (
      error &&
      values.font_family &&
      ["ibm-plex", "outfit", "space-grotesk"].includes(values.font_family) &&
      error.message.includes("user_settings_font_family_check")
    ) {
      const current =
        (await readSettings(supabase, user.id)) ??
        createDefaultUserSettings(user.id);

      return {
        data: {
          ...current,
          font_family: values.font_family,
        },
        error: null,
      };
    }

    if (error) throw error;
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

    async function readTable(table: string, select = "*") {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error && !isMissingTableError(error.message)) throw error;
      return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
        stripUserFields,
      );
    }

    async function readInstallments() {
      const { data, error } = await supabase
        .from("debt_installments")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error && !isMissingTableError(error.message)) return [];
      return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
        stripUserFields,
      );
    }

    const [
      notes,
      tasks,
      reports,
      debts,
      debtPayments,
      installments,
      plannerEvents,
      templates,
      categories,
      tags,
    ] = await Promise.all([
      readTable(
        "notes",
        "id,category_id,title,content,status,is_pinned,is_favorite,archived_at,created_at,updated_at",
      ),
      readTable(
        "tasks",
        "id,category_id,title,description,status,priority,due_date,completed_at,archived_at,created_at,updated_at",
      ),
      readTable(
        "reports",
        "id,title,content,report_type,status,source_date,period_start,period_end,summary,ai_generated,created_at,updated_at",
      ),
      readTable(
        "debts",
        "id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,is_installment,installment_amount,installment_count,installment_start_date,installment_day,installment_note,notes,created_at,updated_at",
      ),
      readTable(
        "debt_payments",
        "id,debt_id,installment_id,amount,payment_date,method,note,created_at",
      ),
      readInstallments(),
      readTable(
        "planner_events",
        "id,task_id,note_id,title,description,event_type,status,priority,start_at,end_at,all_day,color,created_at,updated_at",
      ),
      readTable(
        "templates",
        "id,name,description,template_type,content,variables,category_id,is_system,is_favorite,created_at,updated_at",
      ),
      readTable("categories", "id,name,slug,color,created_at"),
      readTable("tags", "id,name,color,created_at"),
    ]);

    const safeSettings = settings ?? createDefaultUserSettings(user.id);
    const {
      id: _settingsId,
      user_id: _settingsUserId,
      ...settingsForExport
    } = safeSettings;
    void _settingsId;
    void _settingsUserId;

    return {
      data: {
        exported_at: new Date().toISOString(),
        app_name: "Eray Command Center",
        version: "1.0.0",
        settings: settingsForExport,
        notes,
        tasks,
        finance: {
          debts,
          payments: debtPayments,
          installments,
        },
        calendar: plannerEvents,
        reports,
        templates,
        taxonomy: {
          categories,
          tags,
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportNotesData(): Promise<
  ActionResult<NotesExportData>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("notes")
      .select(notesExportSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const notes = ((data ?? []) as RawExportNote[]).map(mapExportNote);
    return {
      data: {
        exported_at: new Date().toISOString(),
        notes,
        text: buildNotesText(notes),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportTasksData(): Promise<ActionResult<TasksExportData>> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("tasks")
      .select(tasksExportSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const tasks = ((data ?? []) as RawExportTask[]).map(mapExportTask);
    return {
      data: {
        exported_at: new Date().toISOString(),
        csv: buildTasksCsv(tasks),
        tasks,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function exportFinanceData(): Promise<
  ActionResult<FinanceExportData>
> {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    const [
      initialDebtsResult,
      paymentsResult,
      initialInstallmentsResult,
    ] = await Promise.all([
      supabase
        .from("debts")
        .select(debtsExportSelect)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("debt_payments")
        .select(paymentsExportSelect)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("debt_installments")
        .select(installmentsExportSelect)
        .eq("user_id", user.id)
        .order("due_date", { ascending: true }),
    ]);
    let debtsResult = initialDebtsResult;
    const installmentsResult = initialInstallmentsResult;

    if (
      debtsResult.error &&
      debtsResult.error.message.includes("is_installment")
    ) {
      const legacyResult = await supabase
        .from("debts")
        .select(legacyDebtsExportSelect)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      debtsResult = legacyResult as unknown as typeof debtsResult;
    }
    if (debtsResult.error) throw debtsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    const rawInstallments = installmentsResult.error
      ? []
      : (installmentsResult.data ?? []);

    const payments = ((paymentsResult.data ?? []) as RawExportPayment[]).map(
      mapExportPayment,
    );
    const installments = (rawInstallments as RawExportInstallment[]).map(
      mapExportInstallment,
    );
    const debts = ((debtsResult.data ?? []) as RawExportDebt[]).map((debt) =>
      mapExportDebt(debt, payments, installments),
    );

    return {
      data: {
        exported_at: new Date().toISOString(),
        csv: buildFinanceCsv(debts),
        debts,
        payments,
        installments,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
