import { NextResponse } from "next/server";
import { resolveAiProvider } from "@/lib/ai/config";
import {
  buildDemoFinanceSummary,
  type FinanceAiMode,
} from "@/lib/ai/finance-prompts";
import { generateFinanceSummaryWithGemini } from "@/lib/ai/providers/finance-gemini";
import { createClient } from "@/lib/supabase/server";
import type { Debt, DebtPayment } from "@/types";

export const runtime = "nodejs";

const modes: FinanceAiMode[] = [
  "payment_plan",
  "risk_analysis",
  "monthly_summary",
  "manager_summary",
];

function numericDebt(raw: Record<string, unknown>): Debt {
  return {
    ...(raw as unknown as Debt),
    total_amount: Number(raw.total_amount) || 0,
    paid_amount: Number(raw.paid_amount) || 0,
  };
}

function numericPayment(raw: Record<string, unknown>): DebtPayment {
  return {
    ...(raw as unknown as DebtPayment),
    amount: Number(raw.amount) || 0,
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

    const [debtsResult, paymentsResult] = await Promise.all([
      supabase
        .from("debts")
        .select("id,user_id,title,creditor,total_amount,paid_amount,currency,status,priority,due_date,installment_count,notes,created_at,updated_at")
        .eq("user_id", authData.user.id)
        .neq("status", "cancelled")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(50),
      supabase
        .from("debt_payments")
        .select("id,user_id,debt_id,amount,payment_date,method,note,created_at")
        .eq("user_id", authData.user.id)
        .order("payment_date", { ascending: false })
        .limit(30),
    ]);
    if (debtsResult.error) throw debtsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    const input = {
      mode: mode as FinanceAiMode,
      debts: (debtsResult.data ?? []).map(numericDebt),
      payments: (paymentsResult.data ?? []).map(numericPayment),
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

    return NextResponse.json({ success: true, provider, output });
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
