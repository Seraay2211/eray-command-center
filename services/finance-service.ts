"use server";

import { revalidatePath } from "next/cache";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { generateFinanceAlerts } from "@/lib/notifications/finance-alerts";
import { createPlannerEvent } from "@/services/planner-service";
import { removeFinanceReceipt } from "@/services/finance-receipts-service";
import { createNotification } from "@/services/notifications-service";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/utils/currency";
import type {
  ActionResult,
  CreateDebtInput,
  CreateDebtPaymentInput,
  Debt,
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
  "id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at";
const paymentSelect =
  "id,user_id,debt_id,amount,payment_date,method,note,receipt_url,receipt_path,receipt_file_name,receipt_mime_type,ocr_status,ocr_result,created_at";

function isSchemaMissing(message: string): boolean {
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

  if (
    message.includes("receipt_path") ||
    message.includes("receipt_url") ||
    message.includes("ocr_status")
  ) {
    return "Dekont altyapısı henüz hazır değil. database/phase-15.3-finance-receipts.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }
  if (isSchemaMissing(message)) {
    return "Finans veritabanı henüz hazır değil. database/phase-15-finance.sql dosyasını Supabase SQL Editor içinde çalıştırın.";
  }
  if (message.toLowerCase().includes("jwt")) {
    return "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.";
  }
  if (message.includes("duplicate")) {
    return "Bu finans kaydı zaten mevcut.";
  }
  return message || "Finans işlemi tamamlanamadı.";
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
    installment_count:
      raw.installment_count === null ? null : toNumber(raw.installment_count),
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
  if (input.due_date !== undefined) {
    values.due_date = input.due_date?.trim() || null;
  }
  if (input.installment_count !== undefined) {
    const count =
      input.installment_count === null ? null : Number(input.installment_count);
    if (count !== null && (!Number.isInteger(count) || count <= 0)) {
      throw new Error("Taksit sayısı pozitif bir tam sayı olmalıdır.");
    }
    values.installment_count = count;
  }

  return values;
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
  const { data, error } = await supabase
    .from("debts")
    .select(debtSelect)
    .eq("id", debtId)
    .eq("user_id", userId)
    .maybeSingle();
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
    const { data, error } = await supabase
      .from("debts")
      .select(debtSelect)
      .eq("user_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
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
    const { data, error } = await supabase
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
    if (error) throw error;
    const debt = await fetchDebtById(supabase, userId, data.id);
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
    if (current.paid_amount >= total && current.status !== "cancelled") {
      values.status = "paid";
    } else if (values.status === "paid" && current.paid_amount < total) {
      throw new Error("Borç tamamen ödenmeden durum 'Ödendi' yapılamaz.");
    }
    const { data, error } = await supabase
      .from("debts")
      .update(values)
      .eq("id", debtId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Borç kaydı bulunamadı veya düzenleme yetkiniz yok.");
    const debt = await fetchDebtById(supabase, userId, debtId);
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
    const { data, error } = await supabase
      .from("debt_payments")
      .select(paymentSelect)
      .eq("user_id", userId)
      .eq("debt_id", debtId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data: (data ?? []).map(mapPayment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createDebtPayment(
  input: CreateDebtPaymentInput,
): Promise<ActionResult<{ debt: Debt; payment: DebtPayment }>> {
  try {
    const amount = toNumber(input.amount);
    if (amount <= 0) throw new Error("Ödeme tutarı sıfırdan büyük olmalıdır.");
    const { supabase, userId } = await getContext();
    const previousDebt = await fetchDebtById(supabase, userId, input.debt_id);
    const { data, error } = await supabase
      .from("debt_payments")
      .insert({
        user_id: userId,
        debt_id: input.debt_id,
        amount,
        payment_date: input.payment_date || getIstanbulDateKey(),
        method: input.method?.trim() ?? "",
        note: input.note?.trim() ?? "",
      })
      .select(paymentSelect)
      .single();
    if (error) throw error;
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
    return { data: { debt, payment: mapPayment(data) }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteDebtPayment(
  paymentId: string,
): Promise<ActionResult<{ debt: Debt; id: string; warning?: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data: payment, error: readError } = await supabase
      .from("debt_payments")
      .select("id,debt_id,amount,receipt_path")
      .eq("id", paymentId)
      .eq("user_id", userId)
      .maybeSingle();
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
    return { data: { debt, id: paymentId, warning }, error: null };
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
  };
}

export async function getFinanceStats(): Promise<ActionResult<FinanceStats>> {
  const debts = await getDebts(50);
  return debts.error || !debts.data
    ? { data: null, error: debts.error }
    : { data: calculateStats(debts.data), error: null };
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
    const { data, error } = await supabase
      .from("debt_payments")
      .select(paymentSelect)
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
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
    const [debtsResult, paymentsResult] = await Promise.all([
      supabase.from("debts").select(debtSelect).eq("user_id", userId),
      supabase
        .from("debt_payments")
        .select(paymentSelect)
        .eq("user_id", userId),
    ]);
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
  const [debtsResult, paymentsResult] = await Promise.all([
    getDebts(50),
    getRecentPayments(1),
  ]);
  if (debtsResult.error || !debtsResult.data) {
    return {
      available: false,
      remainingDebt: 0,
      dueThisMonth: 0,
      dueThisWeekCount: 0,
      criticalCount: 0,
      overdueCount: 0,
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
  return {
    available: true,
    remainingDebt: stats.remainingDebt,
    dueThisMonth: stats.dueThisMonth,
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
