import { NextResponse } from "next/server";
import { buildProductivityContext } from "@/lib/ai/build-productivity-context";
import { hasGeminiApiKey } from "@/lib/ai/config";
import {
  buildDemoDailyCommandSummary,
  type DailyCommandAiInput,
} from "@/lib/ai/daily-command-summary";
import { generateDailyCommandSummaryWithGemini } from "@/lib/ai/providers/daily-command-gemini";
import { formatAiOutputForDisplay } from "@/lib/ai/format-ai-output";
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

    const context = await buildProductivityContext();
    const input: DailyCommandAiInput = {
      context,
      date: context.today.dateKey,
      notes: context.notes.recent.map((note) => ({
        title: note.title,
        content: note.preview,
      })),
      tasks: [
        ...context.tasks.overdue,
        ...context.tasks.today,
        ...context.tasks.upcoming,
      ].map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
      calendar: context.calendar.today.map((event) => ({
        title: event.title,
        description: event.description,
        startAt: event.startAt,
      })),
      debts: context.finance.activeDebts.map((debt) => ({
        title: debt.title,
        remainingAmount: debt.remainingAmount,
        priority: debt.priority,
        dueDate: debt.dueDate,
        status:
          context.finance.overdueDebts.some((item) => item.id === debt.id)
            ? "overdue"
            : "active",
      })),
      payments: context.finance.recentPayments.map((payment) => ({
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
      })),
      installments: [
        ...context.installments.overdue,
        ...context.installments.dueToday,
        ...context.installments.upcoming,
      ].map((installment) => ({
        title: `${installment.debtTitle} ${installment.installmentNo}. taksit`,
        remainingAmount: installment.remainingAmount,
        dueDate: installment.dueDate,
      })),
      reports: context.reports.recent.map((report) => ({
        title: report.title,
        summary: report.summary,
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
