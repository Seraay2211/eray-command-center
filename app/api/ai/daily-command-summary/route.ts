import { NextResponse } from "next/server";
import { hasGeminiApiKey } from "@/lib/ai/config";
import {
  buildDemoDailyCommandSummary,
  type DailyCommandAiInput,
} from "@/lib/ai/daily-command-summary";
import { generateDailyCommandSummaryWithGemini } from "@/lib/ai/providers/daily-command-gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
import {
  getIstanbulDateKey,
  getIstanbulDayRange,
} from "@/lib/dates/istanbul";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yap." },
        { status: 401 },
      );
    }

    const userId = authData.user.id;
    const { startIso, endIso } = getIstanbulDayRange();
    const [notesResult, tasksResult, calendarResult, debtsResult, paymentsResult] =
      await Promise.all([
        supabase
          .from("notes")
          .select("title,content")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("title,description,priority,due_date")
          .eq("user_id", userId)
          .is("archived_at", null)
          .neq("status", "done")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(10),
        supabase
          .from("planner_events")
          .select("title,description,start_at")
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .gte("start_at", startIso)
          .lt("start_at", endIso)
          .order("start_at", { ascending: true })
          .limit(8),
        supabase
          .from("debts")
          .select("title,total_amount,paid_amount,priority,due_date,status")
          .eq("user_id", userId)
          .neq("status", "paid")
          .neq("status", "cancelled")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(10),
        supabase
          .from("debt_payments")
          .select("amount,payment_date,method")
          .eq("user_id", userId)
          .order("payment_date", { ascending: false })
          .limit(5),
      ]);

    const failedResult = [
      notesResult,
      tasksResult,
      calendarResult,
      debtsResult,
      paymentsResult,
    ].find((result) => result.error);
    if (failedResult?.error) throw failedResult.error;

    const input: DailyCommandAiInput = {
      date: getIstanbulDateKey(),
      notes: (notesResult.data ?? []).map((note) => ({
        title: note.title,
        content: note.content.slice(0, 600),
      })),
      tasks: (tasksResult.data ?? []).map((task) => ({
        title: task.title,
        description: task.description.slice(0, 300),
        priority: task.priority,
        dueDate: task.due_date,
      })),
      calendar: (calendarResult.data ?? []).map((event) => ({
        title: event.title,
        description: event.description.slice(0, 300),
        startAt: event.start_at,
      })),
      debts: (debtsResult.data ?? []).map((debt) => ({
        title: debt.title,
        remainingAmount: Math.max(
          (Number(debt.total_amount) || 0) - (Number(debt.paid_amount) || 0),
          0,
        ),
        priority: debt.priority,
        dueDate: debt.due_date,
        status: debt.status,
      })),
      payments: (paymentsResult.data ?? []).map((payment) => ({
        amount: Number(payment.amount) || 0,
        date: payment.payment_date,
        method: payment.method,
      })),
    };
    const demoOutput = buildDemoDailyCommandSummary(input);

    if (!hasGeminiApiKey()) {
      return NextResponse.json({
        success: true,
        provider: "demo",
        output: formatAiOutputForDisplay(demoOutput),
      });
    }

    try {
      const output = await generateDailyCommandSummaryWithGemini(input);
      return NextResponse.json({
        success: true,
        provider: "gemini",
        output: formatAiOutputForDisplay(output),
      });
    } catch {
      return NextResponse.json({
        success: true,
        provider: "demo",
        output: formatAiOutputForDisplay(demoOutput),
      });
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "AI günlük planı oluşturulamadı. Lütfen tekrar dene.",
      },
      { status: 500 },
    );
  }
}
