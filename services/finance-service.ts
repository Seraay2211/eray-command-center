"use server";

import { revalidatePath } from "next/cache";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { generateFinanceAlerts } from "@/lib/notifications/finance-alerts";
import { createPlannerEvent } from "@/services/planner-service";
import { removeFinanceReceipt } from "@/services/finance-receipts-service";
import { createNotification } from "@/services/notifications-service";
import { createClient } from "@/lib/supabase/server";
import {
  addMonthsClamped,
  getInstallmentDisplayStatus,
} from "@/lib/finance/installments";
import { formatTRY } from "@/lib/utils/currency";
import type {
  ActionResult,
  CreateDebtInput,
  CreateDebtPaymentInput,
  Debt,
  DebtInstallment,
  DebtPayment,
  DebtPriority,
  DebtStatus,
  FinanceOcrResult,
  FinanceOcrStatus,
  FinanceDashboardSummary,
  FinanceStats,
  UpdateDebtInput,
} from "@/types";

const debtStatuses: DebtStatus[] = [
  "active",
  "overdue",
  "structured",
  "paid",
  "cancelled",
];
const debtPriorities: DebtPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const debtSelect =
  "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,is_installment,installment_amount,installment_start_date,installment_day,installment_note,notes,created_at,updated_at";
const advancedDebtSelect =
  "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,start_date,due_date,debt_type,category,reminder_days_before,installment_count,is_installment,installment_amount,installment_start_date,installment_day,installment_note,notes,created_at,updated_at";
const legacyDebtSelect =
  "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at";
const paymentSelect =
  "id,user_id,debt_id,installment_id,amount,payment_date,method,note,receipt_url,receipt_path,receipt_file_name,receipt_mime_type,ocr_status,ocr_result,created_at";
const legacyPaymentSelect =
  "id,user_id,debt_id,amount,payment_date,method,note,receipt_url,receipt_path,receipt_file_name,receipt_mime_type,ocr_status,ocr_result,created_at";
const installmentSelect =
  "id,user_id,debt_id,installment_no,due_date,expected_amount,paid_amount,status,paid_at,note,created_at,updated_at";

function isSchemaMissing(message: string): boolean {
  return (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  );
}

function isInstallmentSchemaMissing(message: string): boolean {
  return (
    message.includes("debt_installments") ||
    message.includes("installment_id") ||
    message.includes("is_installment") ||
    message.includes("installment_amount") ||
    message.includes("installment_start_date") ||
    message.includes("installment_day") ||
    message.includes("installment_note")
  );
}

function isAdvancedDebtSchemaMissing(message: string): boolean {
  return (
    message.includes("start_date") ||
    message.includes("debt_type") ||
    message.includes("reminder_days_before") ||
    message.includes("category")
  );
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("receipt_path") ||
    message.includes("receipt_url") ||
    message.includes("ocr_status")
  ) {
    return "Dekont özelliği şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.";
  }
  if (isAdvancedDebtSchemaMissing(message)) {
    return "Gelişmiş borç alanları henüz etkin değil. Kurulum tamamlandıktan sonra tekrar dene.";
  }
  if (isInstallmentSchemaMissing(message)) {
    return "Taksit sistemi henüz etkin değil. Kurulum tamamlandıktan sonra tekrar dene.";
  }
  if (isSchemaMissing(message)) {
    return "Finans alanı şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.";
  }
  if (message.toLowerCase().includes("jwt")) {
    return "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.";
  }
  if (message.includes("duplicate")) {
    return "Bu finans kaydı zaten mevcut.";
  }
  const safeMessages = [
    "Borç adı",
    "Toplam tutar",
    "Taksit",
    "Ödeme tutarı",
    "Borç tamamen",
    "Borç kaydı bulunamadı",
    "Ödeme kaydı bulunamadı",
    "Ödeme kaydı bulunan",
    "Toplam tutar kaydedilmiş",
    "Son ödeme tarihi",
    "Borç tutarı",
    "Taksit günü",
    "Başlangıç tarihi",
    "Borç türü",
    "Hatırlatma",
  ];
  return safeMessages.some((item) => message.startsWith(item))
    ? message
    : "Finans işlemi tamamlanamadı. Lütfen tekrar dene.";
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapDebt(raw: Record<string, unknown>): Debt {
  return {
    ...(raw as unknown as Debt),
    creditor: typeof raw.creditor === "string" ? raw.creditor : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    total_amount: toNumber(raw.total_amount),
    paid_amount: toNumber(raw.paid_amount),
    start_date:
      typeof raw.start_date === "string"
        ? raw.start_date
        : typeof raw.created_at === "string"
          ? raw.created_at.slice(0, 10)
          : null,
    debt_type: typeof raw.debt_type === "string" ? raw.debt_type : "other",
    category: typeof raw.category === "string" ? raw.category : null,
    reminder_days_before:
      raw.reminder_days_before === null ||
      raw.reminder_days_before === undefined
        ? 3
        : toNumber(raw.reminder_days_before),
    installment_count:
      raw.installment_count === null || raw.installment_count === undefined
        ? null
        : toNumber(raw.installment_count),
    is_installment: raw.is_installment === true,
    installment_amount:
      raw.installment_amount === null || raw.installment_amount === undefined
        ? null
        : toNumber(raw.installment_amount),
    installment_start_date:
      typeof raw.installment_start_date === "string"
        ? raw.installment_start_date
        : null,
    installment_day:
      raw.installment_day === null || raw.installment_day === undefined
        ? null
        : toNumber(raw.installment_day),
    installment_note:
      typeof raw.installment_note === "string" ? raw.installment_note : "",
  };
}

function mapPayment(raw: Record<string, unknown>): DebtPayment {
  const ocrStatus: FinanceOcrStatus =
    raw.ocr_status === "processing" ||
    raw.ocr_status === "success" ||
    raw.ocr_status === "failed"
      ? raw.ocr_status
      : "idle";

  return {
    ...(raw as unknown as DebtPayment),
    installment_id:
      typeof raw.installment_id === "string" ? raw.installment_id : null,
    amount: toNumber(raw.amount),
    method: typeof raw.method === "string" ? raw.method : "",
    note: typeof raw.note === "string" ? raw.note : "",
    receipt_url:
      typeof raw.receipt_url === "string" ? raw.receipt_url : null,
    receipt_path:
      typeof raw.receipt_path === "string" ? raw.receipt_path : null,
    receipt_file_name:
      typeof raw.receipt_file_name === "string"
        ? raw.receipt_file_name
        : null,
    receipt_mime_type:
      typeof raw.receipt_mime_type === "string"
        ? raw.receipt_mime_type
        : null,
    ocr_status: ocrStatus,
    ocr_result:
      raw.ocr_result && typeof raw.ocr_result === "object"
        ? (raw.ocr_result as FinanceOcrResult)
        : null,
  };
}

function mapInstallment(raw: Record<string, unknown>): DebtInstallment {
  const installment = {
    ...(raw as unknown as DebtInstallment),
    installment_no: toNumber(raw.installment_no),
    expected_amount: toNumber(raw.expected_amount),
    paid_amount: toNumber(raw.paid_amount),
    note: typeof raw.note === "string" ? raw.note : "",
    paid_at: typeof raw.paid_at === "string" ? raw.paid_at : null,
  };

  return {
    ...installment,
    status: getInstallmentDisplayStatus(installment),
  };
}

async function getContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Oturum doğrulanamadı. Lütfen yeniden giriş yapın.");
  }
  return { supabase, userId: data.user.id };
}

function validateDebtInput(
  input: CreateDebtInput | UpdateDebtInput,
  requireTitle: boolean,
): UpdateDebtInput {
  const values: UpdateDebtInput = {};

  if (requireTitle || input.title !== undefined) {
    const title = input.title?.trim() ?? "";
    if (!title) throw new Error("Borç adı zorunludur.");
    if (title.length > 200) {
      throw new Error("Borç adı en fazla 200 karakter olabilir.");
    }
    values.title = title;
  }
  if (input.creditor !== undefined) values.creditor = input.creditor?.trim() ?? "";
  if (input.notes !== undefined) values.notes = input.notes?.trim() ?? "";
  if (input.currency !== undefined) {
    values.currency = input.currency.trim().toUpperCase().slice(0, 6) || "TRY";
  }
  if (input.total_amount !== undefined) {
    const amount = toNumber(input.total_amount);
    if (amount <= 0) throw new Error("Toplam tutar sıfırdan büyük olmalıdır.");
    values.total_amount = amount;
  }
  if (input.status !== undefined) {
    if (!debtStatuses.includes(input.status)) throw new Error("Geçersiz borç durumu.");
    values.status = input.status;
  }
  if (input.priority !== undefined) {
    if (!debtPriorities.includes(input.priority)) {
      throw new Error("Geçersiz borç önceliği.");
    }
    values.priority = input.priority;
  }
  if (input.start_date !== undefined) {
    values.start_date = input.start_date?.trim() || null;
  }
  if (input.due_date !== undefined) {
    values.due_date = input.due_date?.trim() || null;
  }
  if (input.debt_type !== undefined) {
    const debtType = input.debt_type.trim().slice(0, 60);
    if (!debtType) throw new Error("Borç türü zorunludur.");
    values.debt_type = debtType;
  }
  if (input.category !== undefined) {
    values.category = input.category?.trim().slice(0, 80) || null;
  }
  if (input.reminder_days_before !== undefined) {
    const reminderDays = Number(input.reminder_days_before);
    if (![0, 1, 3, 7].includes(reminderDays)) {
      throw new Error("Hatırlatma aralığı geçersiz.");
    }
    values.reminder_days_before = reminderDays;
  }
  if (input.installment_count !== undefined) {
    const count =
      input.installment_count === null ? null : Number(input.installment_count);
    if (count !== null && (!Number.isInteger(count) || count <= 0)) {
      throw new Error("Taksit sayısı pozitif bir tam sayı olmalıdır.");
    }
    values.installment_count = count;
  }
  if (input.is_installment !== undefined) {
    values.is_installment = Boolean(input.is_installment);
  }
  if (input.installment_amount !== undefined) {
    const amount =
      input.installment_amount === null
        ? null
        : toNumber(input.installment_amount);
    if (amount !== null && amount <= 0) {
      throw new Error("Taksit tutarı sıfırdan büyük olmalıdır.");
    }
    values.installment_amount = amount;
  }
  if (input.installment_start_date !== undefined) {
    values.installment_start_date =
      input.installment_start_date?.trim() || null;
  }
  if (input.installment_day !== undefined) {
    const day =
      input.installment_day === null ? null : Number(input.installment_day);
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) {
      throw new Error("Taksit ödeme günü 1 ile 31 arasında olmalıdır.");
    }
    values.installment_day = day;
  }
  if (input.installment_note !== undefined) {
    values.installment_note = input.installment_note?.trim() ?? "";
  }

  if (values.is_installment) {
    const count = values.installment_count;
    if (!count) throw new Error("Taksit sayısı zorunludur.");
    const totalAmount = values.total_amount;
    const installmentAmount =
      values.installment_amount ??
      (totalAmount ? Number((totalAmount / count).toFixed(2)) : null);
    if (!installmentAmount || installmentAmount <= 0) {
      throw new Error("Taksit tutarı zorunludur.");
    }
    values.installment_amount = installmentAmount;
    if (!values.installment_start_date) {
      values.installment_start_date = values.due_date ?? getIstanbulDateKey();
    }
    values.installment_day =
      values.installment_day ??
      Number(values.installment_start_date.slice(8, 10));
  }

  if (requireTitle) {
    if (!values.start_date) throw new Error("Başlangıç tarihi zorunludur.");
    if (!values.due_date) throw new Error("Son ödeme tarihi zorunludur.");
    if (!values.debt_type) throw new Error("Borç türü zorunludur.");
  }
  if (
    values.start_date &&
    values.due_date &&
    values.due_date < values.start_date
  ) {
    throw new Error("Son ödeme tarihi başlangıç tarihinden önce olamaz.");
  }

  return values;
}

async function syncInstallmentSchedule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  debt: Debt,
) {
  const { data: existingRows, error: existingError } = await supabase
    .from("debt_installments")
    .select(installmentSelect)
    .eq("user_id", userId)
    .eq("debt_id", debt.id)
    .order("installment_no", { ascending: true });
  if (existingError) throw existingError;

  const existing = (existingRows ?? []).map(mapInstallment);
  if (
    !debt.is_installment ||
    !debt.installment_count ||
    !debt.installment_amount ||
    !debt.installment_start_date
  ) {
    const { error } = await supabase
      .from("debt_installments")
      .delete()
      .eq("user_id", userId)
      .eq("debt_id", debt.id)
      .eq("paid_amount", 0);
    if (error) throw error;
    return;
  }

  const today = getIstanbulDateKey();
  const existingByNumber = new Map(
    existing.map((item) => [item.installment_no, item]),
  );
  const rows = Array.from(
    { length: debt.installment_count },
    (_, index) => {
      const installmentNo = index + 1;
      const current = existingByNumber.get(installmentNo);
      if (current && current.paid_amount > 0) return null;
      const dueDate =
        index === 0
          ? debt.installment_start_date!
          : addMonthsClamped(
              debt.installment_start_date!,
              index,
              debt.installment_day,
            );
      return {
        user_id: userId,
        debt_id: debt.id,
        installment_no: installmentNo,
        due_date: dueDate,
        expected_amount: debt.installment_amount,
        paid_amount: 0,
        status: dueDate < today ? "overdue" : "pending",
        paid_at: null,
        note: debt.installment_note ?? "",
      };
    },
  ).filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("debt_installments")
      .upsert(rows, { onConflict: "debt_id,installment_no" });
    if (error) throw error;
  }

  const { error: deleteError } = await supabase
    .from("debt_installments")
    .delete()
    .eq("user_id", userId)
    .eq("debt_id", debt.id)
    .eq("paid_amount", 0)
    .gt("installment_no", debt.installment_count);
  if (deleteError) throw deleteError;
}

async function assertInstallmentPlanChangeIsSafe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  debtId: string,
  current: Debt,
  values: UpdateDebtInput,
) {
  if (!current.is_installment) return;

  const nextIsInstallment = values.is_installment ?? current.is_installment;
  const nextCount = values.installment_count ?? current.installment_count;
  if (nextIsInstallment && nextCount === current.installment_count) return;

  const { data, error } = await supabase
    .from("debt_installments")
    .select("installment_no")
    .eq("user_id", userId)
    .eq("debt_id", debtId)
    .gt("paid_amount", 0)
    .order("installment_no", { ascending: false });
  if (error) throw error;
  if (!data?.length) return;

  if (!nextIsInstallment) {
    throw new Error(
      "Ödeme kaydı bulunan bir taksit planı kapatılamaz.",
    );
  }

  const highestPaidInstallment = Number(data[0].installment_no) || 0;
  if (!nextCount || nextCount < highestPaidInstallment) {
    throw new Error(
      `Taksit sayısı, ödeme kaydı bulunan ${highestPaidInstallment}. taksitten düşük olamaz.`,
    );
  }
}

function revalidateFinanceViews() {
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

async function notifyFinanceEvent(
  input: Parameters<typeof createNotification>[0],
) {
  try {
    await createNotification(input);
  } catch {
    // Notification delivery is secondary to the finance operation.
  }
}

async function refreshFinanceAlerts(debts?: Debt[]) {
  try {
    await generateFinanceAlerts(debts);
  } catch {
    // Alert generation must never block finance mutations.
  }
}

async function fetchDebtById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  debtId: string,
): Promise<Debt> {
  let { data, error } = await supabase
    .from("debts")
    .select(advancedDebtSelect)
    .eq("id", debtId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error && isAdvancedDebtSchemaMissing(error.message)) {
    const currentSchemaResult = await supabase
      .from("debts")
      .select(debtSelect)
      .eq("id", debtId)
      .eq("user_id", userId)
      .maybeSingle();
    data = currentSchemaResult.data as typeof data;
    error = currentSchemaResult.error;
  }
  if (error && isInstallmentSchemaMissing(error.message)) {
    const legacyResult = await supabase
      .from("debts")
      .select(legacyDebtSelect)
      .eq("id", debtId)
      .eq("user_id", userId)
      .maybeSingle();
    data = legacyResult.data as typeof data;
    error = legacyResult.error;
  }
  if (error) throw error;
  if (!data) throw new Error("Borç kaydı bulunamadı veya erişim yetkiniz yok.");
  return mapDebt(data);
}

export async function getDebts(
  limitValue = 50,
): Promise<ActionResult<Debt[]>> {
  try {
    const limit = Math.min(Math.max(limitValue, 1), 50);
    const { supabase, userId } = await getContext();
    let { data, error } = await supabase
      .from("debts")
      .select(advancedDebtSelect)
      .eq("user_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error && isAdvancedDebtSchemaMissing(error.message)) {
      const currentSchemaResult = await supabase
        .from("debts")
        .select(debtSelect)
        .eq("user_id", userId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      data = currentSchemaResult.data as typeof data;
      error = currentSchemaResult.error;
    }
    if (error && isInstallmentSchemaMissing(error.message)) {
      const legacyResult = await supabase
        .from("debts")
        .select(legacyDebtSelect)
        .eq("user_id", userId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    return { data: (data ?? []).map(mapDebt), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDebtById(
  debtId: string,
): Promise<ActionResult<Debt>> {
  try {
    const { supabase, userId } = await getContext();
    return { data: await fetchDebtById(supabase, userId, debtId), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDebt(
  input: CreateDebtInput,
): Promise<ActionResult<Debt>> {
  try {
    const values = validateDebtInput(input, true);
    const { supabase, userId } = await getContext();
    const insertValues = {
      user_id: userId,
      title: values.title,
      creditor: values.creditor ?? "",
      total_amount: values.total_amount,
      currency: values.currency ?? "TRY",
      status: values.status ?? "active",
      priority: values.priority ?? "medium",
      start_date: values.start_date,
      due_date: values.due_date ?? null,
      debt_type: values.debt_type ?? "other",
      category: values.category ?? null,
      reminder_days_before: values.reminder_days_before ?? 3,
      installment_count: values.installment_count ?? null,
      is_installment: values.is_installment ?? false,
      installment_amount: values.installment_amount ?? null,
      installment_start_date: values.installment_start_date ?? null,
      installment_day: values.installment_day ?? null,
      installment_note: values.installment_note ?? "",
      notes: values.notes ?? "",
    };
    let { data, error } = await supabase
      .from("debts")
      .insert(insertValues)
      .select("id")
      .single();
    if (
      error &&
      isInstallmentSchemaMissing(error.message) &&
      !values.is_installment
    ) {
      const legacyResult = await supabase
        .from("debts")
        .insert({
          user_id: userId,
          title: values.title,
          creditor: values.creditor ?? "",
          total_amount: values.total_amount,
          currency: values.currency ?? "TRY",
          status: values.status ?? "active",
          priority: values.priority ?? "medium",
          due_date: values.due_date ?? null,
          installment_count: values.installment_count ?? null,
          notes: values.notes ?? "",
        })
        .select("id")
        .single();
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    if (!data) throw new Error("Borç kaydı oluşturulamadı.");
    let debt = await fetchDebtById(supabase, userId, data.id);
    if (debt.is_installment) {
      try {
        await syncInstallmentSchedule(supabase, userId, debt);
      } catch (scheduleError) {
        await supabase
          .from("debts")
          .delete()
          .eq("id", debt.id)
          .eq("user_id", userId);
        throw scheduleError;
      }
      debt = await fetchDebtById(supabase, userId, debt.id);
    }
    await refreshFinanceAlerts([debt]);
    revalidateFinanceViews();
    return { data: debt, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateDebt(
  debtId: string,
  input: UpdateDebtInput,
): Promise<ActionResult<Debt>> {
  try {
    const values = validateDebtInput(input, false);
    const { supabase, userId } = await getContext();
    const current = await fetchDebtById(supabase, userId, debtId);
    const total = values.total_amount ?? current.total_amount;
    if (total < current.paid_amount) {
      throw new Error(
        "Toplam tutar kaydedilmiş ödemelerden düşük olamaz.",
      );
    }
    const nextStartDate = values.start_date ?? current.start_date;
    const nextDueDate = values.due_date ?? current.due_date;
    if (nextStartDate && nextDueDate && nextDueDate < nextStartDate) {
      throw new Error("Son ödeme tarihi başlangıç tarihinden önce olamaz.");
    }
    await assertInstallmentPlanChangeIsSafe(
      supabase,
      userId,
      debtId,
      current,
      values,
    );
    if (current.paid_amount >= total && current.status !== "cancelled") {
      values.status = "paid";
    } else if (values.status === "paid" && current.paid_amount < total) {
      throw new Error("Borç tamamen ödenmeden durum 'Ödendi' yapılamaz.");
    }
    let { data, error } = await supabase
      .from("debts")
      .update(values)
      .eq("id", debtId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (
      error &&
      isInstallmentSchemaMissing(error.message) &&
      !values.is_installment
    ) {
      const legacyValues = Object.fromEntries(
        Object.entries(values).filter(
          ([key]) =>
            ![
              "is_installment",
              "installment_amount",
              "installment_start_date",
              "installment_day",
              "installment_note",
            ].includes(key),
        ),
      ) as UpdateDebtInput;
      const legacyResult = await supabase
        .from("debts")
        .update(legacyValues)
        .eq("id", debtId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    if (!data) throw new Error("Borç kaydı bulunamadı veya düzenleme yetkiniz yok.");
    let debt = await fetchDebtById(supabase, userId, debtId);
    if (
      debt.is_installment ||
      current.is_installment ||
      values.is_installment === false
    ) {
      await syncInstallmentSchedule(supabase, userId, debt);
      debt = await fetchDebtById(supabase, userId, debtId);
    }
    if (current.status !== "paid" && debt.status === "paid") {
      await notifyFinanceEvent({
        type: "finance_debt_paid",
        title: "Borç kapandı",
        message: `${debt.title} borcu tamamen ödendi ve kapandı.`,
        source: "finance",
        source_id: debt.id,
        priority: "low",
        action_url: `/finance?debt=${encodeURIComponent(debt.id)}`,
        metadata: { trigger: "debt_updated" },
      });
    }
    await refreshFinanceAlerts([debt]);
    revalidateFinanceViews();
    return { data: debt, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteDebt(
  debtId: string,
): Promise<ActionResult<{ id: string; warning?: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data: paymentReceipts, error: receiptReadError } = await supabase
      .from("debt_payments")
      .select("receipt_path")
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .not("receipt_path", "is", null);
    if (receiptReadError) throw receiptReadError;
    const { data, error } = await supabase
      .from("debts")
      .delete()
      .eq("id", debtId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Borç kaydı bulunamadı veya silme yetkiniz yok.");
    let warning: string | undefined;
    for (const payment of paymentReceipts ?? []) {
      if (!payment.receipt_path) continue;
      try {
        await removeFinanceReceipt(supabase, payment.receipt_path);
      } catch {
        warning =
          "Borç kaydı silindi ancak bazı dekont dosyaları depodan kaldırılamadı.";
      }
    }
    revalidateFinanceViews();
    return { data: { id: debtId, warning }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDebtPayments(
  debtId: string,
): Promise<ActionResult<DebtPayment[]>> {
  try {
    const { supabase, userId } = await getContext();
    await fetchDebtById(supabase, userId, debtId);
    let { data, error } = await supabase
      .from("debt_payments")
      .select(paymentSelect)
      .eq("user_id", userId)
      .eq("debt_id", debtId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error && isInstallmentSchemaMissing(error.message)) {
      const legacyResult = await supabase
        .from("debt_payments")
        .select(legacyPaymentSelect)
        .eq("user_id", userId)
        .eq("debt_id", debtId)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false });
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    return { data: (data ?? []).map(mapPayment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getFinanceInstallments(
  limitValue = 200,
): Promise<ActionResult<DebtInstallment[]>> {
  try {
    const limit = Math.min(Math.max(limitValue, 1), 300);
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("debt_installments")
      .select(installmentSelect)
      .eq("user_id", userId)
      .order("due_date", { ascending: true })
      .order("installment_no", { ascending: true })
      .limit(limit);
    if (error) {
      if (isInstallmentSchemaMissing(error.message) || isSchemaMissing(error.message)) {
        return { data: [], error: null };
      }
      throw error;
    }
    return { data: (data ?? []).map(mapInstallment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDebtInstallments(
  debtId: string,
): Promise<ActionResult<DebtInstallment[]>> {
  try {
    const { supabase, userId } = await getContext();
    await fetchDebtById(supabase, userId, debtId);
    const { data, error } = await supabase
      .from("debt_installments")
      .select(installmentSelect)
      .eq("user_id", userId)
      .eq("debt_id", debtId)
      .order("installment_no", { ascending: true });
    if (error) {
      if (isInstallmentSchemaMissing(error.message) || isSchemaMissing(error.message)) {
        return { data: [], error: null };
      }
      throw error;
    }
    return { data: (data ?? []).map(mapInstallment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDebtPayment(
  input: CreateDebtPaymentInput,
): Promise<
  ActionResult<{
    debt: Debt;
    installment: DebtInstallment | null;
    payment: DebtPayment;
  }>
> {
  try {
    const amount = toNumber(input.amount);
    if (amount <= 0) throw new Error("Ödeme tutarı sıfırdan büyük olmalıdır.");
    const { supabase, userId } = await getContext();
    const previousDebt = await fetchDebtById(supabase, userId, input.debt_id);
    const remainingDebt = Math.max(
      previousDebt.total_amount - previousDebt.paid_amount,
      0,
    );
    if (amount > remainingDebt + 0.005) {
      throw new Error("Ödeme tutarı kalan borç tutarını aşamaz.");
    }
    if (input.installment_id) {
      const { data: installment, error: installmentError } = await supabase
        .from("debt_installments")
        .select("id")
        .eq("id", input.installment_id)
        .eq("debt_id", input.debt_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (installmentError) throw installmentError;
      if (!installment) throw new Error("Taksit kaydı bulunamadı.");
    }
    let { data, error } = await supabase
      .from("debt_payments")
      .insert({
        user_id: userId,
        debt_id: input.debt_id,
        installment_id: input.installment_id ?? null,
        amount,
        payment_date: input.payment_date || getIstanbulDateKey(),
        method: input.method?.trim() ?? "",
        note: input.note?.trim() ?? "",
      })
      .select(paymentSelect)
      .single();
    if (
      error &&
      isInstallmentSchemaMissing(error.message) &&
      !input.installment_id
    ) {
      const legacyResult = await supabase
        .from("debt_payments")
        .insert({
          user_id: userId,
          debt_id: input.debt_id,
          amount,
          payment_date: input.payment_date || getIstanbulDateKey(),
          method: input.method?.trim() ?? "",
          note: input.note?.trim() ?? "",
        })
        .select(legacyPaymentSelect)
        .single();
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    if (!data) throw new Error("Ödeme kaydı oluşturulamadı.");
    const debt = await fetchDebtById(supabase, userId, input.debt_id);
    await notifyFinanceEvent({
      type: "finance_payment_added",
      title: "Ödeme kaydedildi",
      message: `${debt.title} için ${formatTRY(amount)} ödeme kaydedildi.`,
      source: "finance",
      source_id: debt.id,
      priority: "medium",
      action_url: `/finance?debt=${encodeURIComponent(debt.id)}`,
      metadata: { payment_id: data.id },
    });
    if (previousDebt.status !== "paid" && debt.status === "paid") {
      await notifyFinanceEvent({
        type: "finance_debt_paid",
        title: "Borç kapandı",
        message: `${debt.title} borcu tamamen ödendi ve kapandı.`,
        source: "finance",
        source_id: debt.id,
        priority: "low",
        action_url: `/finance?debt=${encodeURIComponent(debt.id)}`,
        metadata: { payment_id: data.id },
      });
    }
    await refreshFinanceAlerts([debt]);
    revalidateFinanceViews();
    let installment: DebtInstallment | null = null;
    if (input.installment_id) {
      const { data: installmentData, error: installmentError } = await supabase
        .from("debt_installments")
        .select(installmentSelect)
        .eq("id", input.installment_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (installmentError) throw installmentError;
      installment = installmentData ? mapInstallment(installmentData) : null;
    }
    return {
      data: { debt, installment, payment: mapPayment(data) },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteDebtPayment(
  paymentId: string,
): Promise<
  ActionResult<{
    debt: Debt;
    id: string;
    installment: DebtInstallment | null;
    warning?: string;
  }>
> {
  try {
    const { supabase, userId } = await getContext();
    let { data: payment, error: readError } = await supabase
      .from("debt_payments")
      .select("id,debt_id,installment_id,amount,receipt_path")
      .eq("id", paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError && isInstallmentSchemaMissing(readError.message)) {
      const legacyResult = await supabase
        .from("debt_payments")
        .select("id,debt_id,amount,receipt_path")
        .eq("id", paymentId)
        .eq("user_id", userId)
        .maybeSingle();
      payment = legacyResult.data as typeof payment;
      readError = legacyResult.error;
    }
    if (readError) throw readError;
    if (!payment) throw new Error("Ödeme kaydı bulunamadı.");
    const currentDebt = await fetchDebtById(
      supabase,
      userId,
      payment.debt_id,
    );
    const { error } = await supabase
      .from("debt_payments")
      .delete()
      .eq("id", paymentId)
      .eq("user_id", userId);
    if (error) throw error;
    const debt = await fetchDebtById(supabase, userId, payment.debt_id);
    let installment: DebtInstallment | null = null;
    if ("installment_id" in payment && payment.installment_id) {
      const { data: installmentData, error: installmentError } = await supabase
        .from("debt_installments")
        .select(installmentSelect)
        .eq("id", payment.installment_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (installmentError) throw installmentError;
      installment = installmentData ? mapInstallment(installmentData) : null;
    }
    let warning: string | undefined;
    if (payment.receipt_path) {
      try {
        await removeFinanceReceipt(supabase, payment.receipt_path);
      } catch {
        warning =
          "Ödeme silindi ancak dekont dosyası depodan kaldırılamadı.";
      }
    }
    await notifyFinanceEvent({
      type: "finance_payment_deleted",
      title: "Ödeme silindi",
      message: `${currentDebt.title} için ${formatTRY(payment.amount)} ödeme kaydı silindi.`,
      source: "finance",
      source_id: currentDebt.id,
      priority: "medium",
      action_url: `/finance?debt=${encodeURIComponent(currentDebt.id)}`,
      metadata: { payment_id: payment.id },
    });
    await refreshFinanceAlerts([debt]);
    revalidateFinanceViews();
    return {
      data: { debt, id: paymentId, installment, warning },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

function calculateStats(debts: Debt[]): FinanceStats {
  const today = getIstanbulDateKey();
  const currentMonth = today.slice(0, 7);
  const active = debts.filter(
    (debt) => debt.status !== "cancelled" && debt.status !== "paid",
  );
  const remaining = (debt: Debt) =>
    Math.max(debt.total_amount - debt.paid_amount, 0);

  return {
    totalDebt: debts
      .filter((debt) => debt.status !== "cancelled")
      .reduce((sum, debt) => sum + debt.total_amount, 0),
    totalPaid: debts
      .filter((debt) => debt.status !== "cancelled")
      .reduce((sum, debt) => sum + debt.paid_amount, 0),
    remainingDebt: active.reduce((sum, debt) => sum + remaining(debt), 0),
    dueThisMonth: active
      .filter((debt) => {
        if (!debt.due_date) return false;
        return debt.due_date?.startsWith(currentMonth);
      })
      .reduce((sum, debt) => sum + remaining(debt), 0),
    criticalCount: active.filter((debt) => debt.priority === "critical").length,
    overdueCount: active.filter(
      (debt) =>
        debt.status === "overdue" ||
        Boolean(debt.due_date && debt.due_date < today),
    ).length,
    dueTodayInstallmentCount: 0,
    dueSoonInstallmentCount: 0,
    overdueInstallmentCount: 0,
    monthlyInstallmentBurden: 0,
  };
}

export async function getFinanceStats(): Promise<ActionResult<FinanceStats>> {
  const [debts, installments] = await Promise.all([
    getDebts(50),
    getFinanceInstallments(300),
  ]);
  return debts.error || !debts.data
    ? { data: null, error: debts.error }
    : {
        data: (() => {
          const stats = calculateStats(debts.data);
          const today = getIstanbulDateKey();
          const sevenDaysLater = getIstanbulDateKey(
            new Date(
              new Date(`${today}T12:00:00+03:00`).getTime() + 7 * 86400000,
            ),
          );
          const currentMonth = today.slice(0, 7);
          const openInstallments = (installments.data ?? []).filter(
            (item) => getInstallmentDisplayStatus(item) !== "paid",
          );
          return {
            ...stats,
            dueThisMonth: [
              ...debts.data
                .filter(
                  (debt) =>
                    !debt.is_installment &&
                    debt.due_date?.startsWith(currentMonth) &&
                    debt.status !== "paid" &&
                    debt.status !== "cancelled",
                )
                .map((debt) =>
                  Math.max(debt.total_amount - debt.paid_amount, 0),
                ),
              ...openInstallments
                .filter((item) => item.due_date.startsWith(currentMonth))
                .map((item) =>
                  Math.max(item.expected_amount - item.paid_amount, 0),
                ),
            ].reduce((sum, amount) => sum + amount, 0),
            dueTodayInstallmentCount: openInstallments.filter(
              (item) => item.due_date === today,
            ).length,
            dueSoonInstallmentCount: openInstallments.filter(
              (item) =>
                item.due_date > today && item.due_date <= sevenDaysLater,
            ).length,
            overdueInstallmentCount: openInstallments.filter(
              (item) => item.due_date < today,
            ).length,
            monthlyInstallmentBurden: openInstallments
              .filter((item) => item.due_date.startsWith(currentMonth))
              .reduce(
                (sum, item) =>
                  sum + Math.max(item.expected_amount - item.paid_amount, 0),
                0,
              ),
          };
        })(),
        error: null,
      };
}

export async function getCriticalDebts(): Promise<ActionResult<Debt[]>> {
  const debts = await getDebts(50);
  return debts.error || !debts.data
    ? { data: null, error: debts.error }
    : {
        data: debts.data
          .filter(
            (debt) =>
              debt.status !== "paid" &&
              debt.status !== "cancelled" &&
              (debt.priority === "critical" || debt.status === "overdue"),
          )
          .slice(0, 10),
        error: null,
      };
}

export async function getUpcomingDebts(
  limitValue = 5,
): Promise<ActionResult<Debt[]>> {
  const debts = await getDebts(50);
  return debts.error || !debts.data
    ? { data: null, error: debts.error }
    : {
        data: debts.data
          .filter(
            (debt) =>
              debt.due_date &&
              debt.status !== "paid" &&
              debt.status !== "cancelled",
          )
          .sort((first, second) =>
            (first.due_date ?? "").localeCompare(second.due_date ?? ""),
          )
          .slice(0, Math.min(Math.max(limitValue, 1), 10)),
        error: null,
      };
}

export async function getRecentPayments(
  limitValue = 8,
): Promise<ActionResult<DebtPayment[]>> {
  try {
    const limit = Math.min(Math.max(limitValue, 1), 20);
    const { supabase, userId } = await getContext();
    let { data, error } = await supabase
      .from("debt_payments")
      .select(paymentSelect)
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error && isInstallmentSchemaMissing(error.message)) {
      const legacyResult = await supabase
        .from("debt_payments")
        .select(legacyPaymentSelect)
        .eq("user_id", userId)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      data = legacyResult.data as typeof data;
      error = legacyResult.error;
    }
    if (error) throw error;
    return { data: (data ?? []).map(mapPayment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getFinanceExportData(): Promise<
  ActionResult<{ debts: Debt[]; payments: DebtPayment[]; generated_at: string }>
> {
  try {
    const { supabase, userId } = await getContext();
    let [debtsResult, paymentsResult] = await Promise.all([
      supabase.from("debts").select(debtSelect).eq("user_id", userId),
      supabase
        .from("debt_payments")
        .select(paymentSelect)
        .eq("user_id", userId),
    ]);
    if (
      debtsResult.error &&
      isInstallmentSchemaMissing(debtsResult.error.message)
    ) {
      debtsResult = (await supabase
        .from("debts")
        .select(legacyDebtSelect)
        .eq("user_id", userId)) as typeof debtsResult;
    }
    if (
      paymentsResult.error &&
      isInstallmentSchemaMissing(paymentsResult.error.message)
    ) {
      paymentsResult = (await supabase
        .from("debt_payments")
        .select(legacyPaymentSelect)
        .eq("user_id", userId)) as typeof paymentsResult;
    }
    if (debtsResult.error) throw debtsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    return {
      data: {
        debts: (debtsResult.data ?? []).map(mapDebt),
        payments: (paymentsResult.data ?? []).map(mapPayment),
        generated_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDebtReminder(
  debtId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const debtResult = await getDebtById(debtId);
    if (debtResult.error || !debtResult.data) {
      return { data: null, error: debtResult.error };
    }
    const debt = debtResult.data;
    if (!debt.due_date) {
      return { data: null, error: "Takvim hatırlatması için son ödeme tarihi gerekli." };
    }
    const result = await createPlannerEvent({
      title: `Ödeme: ${debt.title}`,
      description: `${debt.creditor || "Alacaklı belirtilmedi"} · Kalan ${Math.max(
        debt.total_amount - debt.paid_amount,
        0,
      )} ${debt.currency}`,
      event_type: "reminder",
      priority: debt.priority,
      start_at: `${debt.due_date}T09:00:00+03:00`,
      all_day: true,
    });
    return result.error || !result.data
      ? { data: null, error: result.error }
      : { data: { id: result.data.id }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDashboardFinanceSummary(): Promise<FinanceDashboardSummary> {
  const [debtsResult, paymentsResult, installmentsResult] = await Promise.all([
    getDebts(50),
    getRecentPayments(1),
    getFinanceInstallments(100),
  ]);
  if (debtsResult.error || !debtsResult.data) {
    return {
      available: false,
      remainingDebt: 0,
      dueThisMonth: 0,
      dueThisWeekCount: 0,
      criticalCount: 0,
      overdueCount: 0,
      installmentsAvailable: false,
      dueTodayInstallmentCount: 0,
      overdueInstallmentCount: 0,
      upcomingInstallments: [],
      lastPayment: null,
      upcomingDebts: [],
    };
  }
  const stats = calculateStats(debtsResult.data);
  const lastPayment = paymentsResult.data?.[0] ?? null;
  const today = getIstanbulDateKey();
  const weekEnd = getIstanbulDateKey(
    new Date(new Date(`${today}T12:00:00+03:00`).getTime() + 7 * 86400000),
  );
  const upcoming = debtsResult.data
    .filter(
      (debt) =>
        debt.due_date &&
        debt.status !== "paid" &&
        debt.status !== "cancelled",
    )
    .sort((first, second) =>
      (first.due_date ?? "").localeCompare(second.due_date ?? ""),
    )
    .slice(0, 3);
  const debtById = new Map(debtsResult.data.map((debt) => [debt.id, debt]));
  const openInstallments = (installmentsResult.data ?? [])
    .filter((item) => getInstallmentDisplayStatus(item) !== "paid")
    .sort((first, second) => first.due_date.localeCompare(second.due_date));
  const installmentDebtIds = new Set(
    openInstallments.map((item) => item.debt_id),
  );
  const dueThisMonth =
    debtsResult.data
      .filter(
        (debt) =>
          !installmentDebtIds.has(debt.id) &&
          debt.due_date?.startsWith(today.slice(0, 7)) &&
          debt.status !== "paid" &&
          debt.status !== "cancelled",
      )
      .reduce(
        (sum, debt) =>
          sum + Math.max(debt.total_amount - debt.paid_amount, 0),
        0,
      ) +
    openInstallments
      .filter((item) => item.due_date.startsWith(today.slice(0, 7)))
      .reduce(
        (sum, item) =>
          sum + Math.max(item.expected_amount - item.paid_amount, 0),
        0,
      );
  return {
    available: true,
    remainingDebt: stats.remainingDebt,
    dueThisMonth,
    dueThisWeekCount: debtsResult.data.filter(
      (debt) =>
        debt.due_date &&
        debt.due_date >= today &&
        debt.due_date < weekEnd &&
        debt.status !== "paid" &&
        debt.status !== "cancelled",
    ).length,
    criticalCount: stats.criticalCount,
    overdueCount: stats.overdueCount,
    installmentsAvailable: Boolean(installmentsResult.data),
    dueTodayInstallmentCount: openInstallments.filter(
      (item) => item.due_date === today,
    ).length,
    overdueInstallmentCount: openInstallments.filter(
      (item) => item.due_date < today,
    ).length,
    upcomingInstallments: openInstallments
      .filter((item) => item.due_date <= weekEnd)
      .slice(0, 5)
      .map((item) => {
        const debt = debtById.get(item.debt_id);
        return {
          id: item.id,
          debtId: item.debt_id,
          debtTitle: debt?.title ?? "Borç kaydı",
          creditor: debt?.creditor ?? "",
          installmentNo: item.installment_no,
          dueDate: item.due_date,
          expectedAmount: item.expected_amount,
          paidAmount: item.paid_amount,
          status: getInstallmentDisplayStatus(item),
        };
      }),
    lastPayment: lastPayment
      ? {
          amount: lastPayment.amount,
          date: lastPayment.payment_date,
          method: lastPayment.method,
        }
      : null,
    upcomingDebts: upcoming.map((debt) => ({
      id: debt.id,
      title: debt.title,
      remainingAmount: Math.max(debt.total_amount - debt.paid_amount, 0),
      currency: debt.currency,
      dueDate: debt.due_date,
    })),
  };
}
