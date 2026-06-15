import { NextResponse } from "next/server";
import { resolveAiProvider } from "@/lib/ai/config";
import { analyzeFinanceData } from "@/lib/ai/finance-analysis";
import {
  buildDemoFinanceSummary,
  type FinanceAiMode,
} from "@/lib/ai/finance-prompts";
import { generateFinanceSummaryWithGemini } from "@/lib/ai/providers/finance-gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import { createClient } from "@/lib/supabase/server";
import type { Debt, DebtInstallment, DebtPayment } from "@/types";

export const runtime = "nodejs";

const modes: FinanceAiMode[] = [
  "payment_plan",
  "risk_analysis",
  "monthly_summary",
  "thirty_day_plan",
  "manager_summary",
];

function isInstallmentSchemaMissing(message: string): boolean {
  return (
    message.includes("debt_installments") ||
    message.includes("installment_id") ||
    message.includes("is_installment") ||
    message.includes("installment_amount") ||
    message.includes("installment_start_date") ||
    message.includes("installment_day") ||
    message.includes("installment_note") ||
    message.includes("schema cache")
  );
}

function numericDebt(raw: Record<string, unknown>): Debt {
  return {
    ...(raw as unknown as Debt),
    total_amount: Number(raw.total_amount) || 0,
    paid_amount: Number(raw.paid_amount) || 0,
    is_installment: raw.is_installment === true,
    installment_amount: Number(raw.installment_amount) || null,
    installment_start_date:
      typeof raw.installment_start_date === "string"
        ? raw.installment_start_date
        : null,
    installment_day: Number(raw.installment_day) || null,
    installment_note:
      typeof raw.installment_note === "string" ? raw.installment_note : "",
  };
}

function numericPayment(raw: Record<string, unknown>): DebtPayment {
  return {
    ...(raw as unknown as DebtPayment),
    amount: Number(raw.amount) || 0,
    installment_id:
      typeof raw.installment_id === "string" ? raw.installment_id : null,
  };
}

function numericInstallment(
  raw: Record<string, unknown>,
): DebtInstallment {
  return {
    ...(raw as unknown as DebtInstallment),
    installment_no: Number(raw.installment_no) || 0,
    expected_amount: Number(raw.expected_amount) || 0,
    paid_amount: Number(raw.paid_amount) || 0,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { mode?: unknown };
    const mode = typeof body.mode === "string" ? body.mode : "";
    if (!modes.includes(mode as FinanceAiMode)) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir finans analizi seçilmedi." },
        { status: 400 },
      );
    }

    const [debtsResult, paymentsResult, installmentsResult] = await Promise.all([
      supabase
        .from("debts")
        .select("id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,is_installment,installment_amount,installment_start_date,installment_day,installment_note,notes,created_at,updated_at")
        .eq("user_id", authData.user.id)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(50),
      supabase
        .from("debt_payments")
        .select("id,user_id,debt_id,installment_id,amount,payment_date,method,note,created_at")
        .eq("user_id", authData.user.id)
        .order("payment_date", { ascending: false })
        .limit(30),
      supabase
        .from("debt_installments")
        .select("id,user_id,debt_id,installment_no,due_date,expected_amount,paid_amount,status,paid_at,note,created_at,updated_at")
        .eq("user_id", authData.user.id)
        .order("due_date", { ascending: true })
        .limit(200),
    ]);

    let debtRows = (debtsResult.data ?? []) as unknown as Record<
      string,
      unknown
    >[];
    if (debtsResult.error) {
      if (!isInstallmentSchemaMissing(debtsResult.error.message)) {
        throw debtsResult.error;
      }
      const fallback = await supabase
        .from("debts")
        .select("id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at")
        .eq("user_id", authData.user.id)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(50);
      if (fallback.error) throw fallback.error;
      debtRows = (fallback.data ?? []) as unknown as Record<string, unknown>[];
    }

    let paymentRows = (paymentsResult.data ?? []) as unknown as Record<
      string,
      unknown
    >[];
    if (paymentsResult.error) {
      if (!isInstallmentSchemaMissing(paymentsResult.error.message)) {
        throw paymentsResult.error;
      }
      const fallback = await supabase
        .from("debt_payments")
        .select("id,user_id,debt_id,amount,payment_date,method,note,created_at")
        .eq("user_id", authData.user.id)
        .order("payment_date", { ascending: false })
        .limit(30);
      if (fallback.error) throw fallback.error;
      paymentRows = (fallback.data ?? []) as unknown as Record<
        string,
        unknown
      >[];
    }

    if (
      installmentsResult.error &&
      !isInstallmentSchemaMissing(installmentsResult.error.message)
    ) {
      throw installmentsResult.error;
    }

    const debts = debtRows.map(numericDebt);
    const payments = paymentRows.map(numericPayment);
    const installments = installmentsResult.error
      ? []
      : (installmentsResult.data ?? []).map(numericInstallment);
    const input = {
      mode: mode as FinanceAiMode,
      debts,
      payments,
      installments,
      analysis: analyzeFinanceData({ debts, installments, payments }),
    };
    let provider = resolveAiProvider();
    let output: string;

    if (provider === "gemini") {
      try {
        output = await generateFinanceSummaryWithGemini(input);
      } catch {
        provider = "demo";
        output = buildDemoFinanceSummary(input);
      }
    } else {
      output = buildDemoFinanceSummary(input);
    }

    return NextResponse.json({
      success: true,
      provider,
      output: formatAiOutputForDisplay(output),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Finans özeti oluşturulamadı. Lütfen tekrar dene.",
      },
      { status: 500 },
    );
  }
}
