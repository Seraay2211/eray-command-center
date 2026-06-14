import type { Debt, DebtPayment } from "@/types";
import { AI_PLAIN_TEXT_INSTRUCTION } from "@/lib/ai/format-ai-output";

export type FinanceAiMode =
  | "payment_plan"
  | "risk_analysis"
  | "monthly_summary"
  | "manager_summary";

export const FINANCE_DISCLAIMER =
  "Bu çıktı kişisel planlama amaçlıdır, finansal tavsiye değildir.";

export const FINANCE_SYSTEM_INSTRUCTION = `
Sen kişisel finans kayıtlarını düzenleyen Türkçe bir planlama asistanısın.
Finansal danışmanlık, yatırım tavsiyesi veya kesin borç yönlendirmesi yapma.
Yalnızca verilen borç ve ödeme kayıtlarını özetle; eksik veya belirsiz verileri açıkça belirt.
Çıktıyı kısa başlıklar, net tutarlar ve uygulanabilir takip maddeleriyle yaz.
Her çıktının sonunda şu uyarıyı aynen ekle:
"${FINANCE_DISCLAIMER}"
${AI_PLAIN_TEXT_INSTRUCTION}
`.trim();

const modeLabels: Record<FinanceAiMode, string> = {
  payment_plan: "Ödeme planı ve 30 günlük takip akışı",
  risk_analysis: "Riskli ve gecikmiş borç analizi",
  monthly_summary: "Bu ayın ödeme özeti",
  manager_summary: "Yönetici finans özeti",
};

function formatDebt(debt: Debt): string {
  return [
    `- ${debt.title}`,
    `alacaklı=${debt.creditor || "belirtilmedi"}`,
    `toplam=${debt.total_amount} ${debt.currency}`,
    `ödenen=${debt.paid_amount} ${debt.currency}`,
    `kalan=${Math.max(debt.total_amount - debt.paid_amount, 0)} ${debt.currency}`,
    `durum=${debt.status}`,
    `öncelik=${debt.priority}`,
    `vade=${debt.due_date || "belirtilmedi"}`,
  ].join(" | ");
}

function formatPayment(payment: DebtPayment): string {
  return `- ${payment.payment_date} | ${payment.amount} | ${payment.method || "yöntem belirtilmedi"} | ${payment.note || "not yok"}`;
}

export function buildFinancePrompt(input: {
  mode: FinanceAiMode;
  debts: Debt[];
  payments: DebtPayment[];
}): string {
  return `
İstenen çalışma: ${modeLabels[input.mode]}
Bugünün tarihi: ${new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date())}

BORÇ KAYITLARI
${input.debts.length ? input.debts.map(formatDebt).join("\n") : "Kayıt yok."}

SON ÖDEMELER
${input.payments.length ? input.payments.map(formatPayment).join("\n") : "Ödeme kaydı yok."}

Kurallar:
- Tutarları para birimleriyle birlikte yaz.
- Farklı para birimlerini tek toplam altında birleştirme.
- Önce gecikmiş ve kritik kayıtları belirt.
- Vadesi olmayan kayıtları belirsiz veri olarak işaretle.
- Kesin finansal öneri verme; takip ve planlama dili kullan.
`.trim();
}

export function buildDemoFinanceSummary(input: {
  mode: FinanceAiMode;
  debts: Debt[];
  payments: DebtPayment[];
}): string {
  const active = input.debts.filter(
    (debt) => debt.status !== "paid" && debt.status !== "cancelled",
  );
  const risky = active.filter(
    (debt) => debt.status === "overdue" || debt.priority === "critical",
  );
  return [
    modeLabels[input.mode].toLocaleUpperCase("tr-TR"),
    "",
    `Aktif kayıt: ${active.length}`,
    `Kritik veya gecikmiş kayıt: ${risky.length}`,
    `İncelenen son ödeme: ${input.payments.length}`,
    "",
    "Öncelikli takip:",
    ...(risky.length
      ? risky.slice(0, 5).map(
          (debt, index) =>
            `${index + 1}. ${debt.title}: ${Math.max(
              debt.total_amount - debt.paid_amount,
              0,
            )} ${debt.currency} kalan, vade ${debt.due_date || "belirtilmedi"}.`,
        )
      : ["Kritik veya gecikmiş kayıt görünmüyor."]),
    "",
    "Planlama notu:",
    "Vadeleri, para birimlerini ve mevcut nakit akışını ayrıca doğrula. Eksik vade bilgilerini tamamlamak takip kalitesini artırır.",
    "",
    FINANCE_DISCLAIMER,
  ].join("\n");
}
