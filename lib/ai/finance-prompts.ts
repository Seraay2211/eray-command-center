import type { FinanceDeterministicAnalysis } from "@/lib/ai/finance-analysis";
import { AI_PLAIN_TEXT_INSTRUCTION } from "@/lib/ai/format-ai-output";
import { formatFinanceDate } from "@/lib/finance/installments";
import { formatTRY } from "@/lib/utils/currency";
import type { Debt, DebtInstallment, DebtPayment } from "@/types";

export type FinanceAiMode =
  | "payment_plan"
  | "risk_analysis"
  | "monthly_summary"
  | "thirty_day_plan"
  | "manager_summary";

export interface FinanceAiInput {
  analysis: FinanceDeterministicAnalysis;
  debts: Debt[];
  installments: DebtInstallment[];
  mode: FinanceAiMode;
  payments: DebtPayment[];
}

export const FINANCE_DISCLAIMER =
  "AI çıktıları kişisel planlama amaçlıdır, finansal tavsiye değildir.";

export const FINANCE_SYSTEM_INSTRUCTION = `
Sen kullanıcının mevcut borç, ödeme ve taksit kayıtlarını düzenleyen Türkçe bir planlama asistanısın.
Yalnızca verilen yapılandırılmış veriyi kullan. Tutar, kurum, tarih veya ödeme uydurma.
Finansal danışmanlık ya da yatırım tavsiyesi verme.
Çıktıyı karar alınabilir, kısa ve somut tut.
Her çıktının sonunda şu uyarıyı aynen ekle:
"${FINANCE_DISCLAIMER}"
${AI_PLAIN_TEXT_INSTRUCTION}
`.trim();

const modeInstructions: Record<FinanceAiMode, string> = {
  payment_plan:
    "Öncelik sırasını, gerekçesini, ilk 7 gün ve sonraki 30 gün aksiyonlarını yaz.",
  risk_analysis:
    "Geciken, kritik, kısmi ödenen, yüksek bakiyeli ve vadesiz kayıtları somut biçimde listele.",
  monthly_summary:
    "Bu ay ödenecek kayıtları, toplam aylık yükü ve önerilen takip sırasını yaz.",
  thirty_day_plan:
    "Hafta 1, Hafta 2, Hafta 3 ve Hafta 4 başlıklarıyla ödeme kontrol planı oluştur.",
  manager_summary:
    "Genel durum, kritik riskler, karar görünümü ve önerilen 3 aksiyon bölümlerini yaz.",
};

function formatItem(
  item: FinanceDeterministicAnalysis["overdueItems"][number],
): string {
  const priorityLabels: Record<Debt["priority"], string> = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
    critical: "Kritik",
  };

  return [
    item.title,
    item.creditor || "Kurum belirtilmedi",
    item.installmentNo ? `${item.installmentNo}. taksit` : "Borç kaydı",
    item.dueDate ? formatFinanceDate(item.dueDate) : "Vade belirtilmedi",
    formatTRY(item.remainingAmount),
    `öncelik=${priorityLabels[item.priority]}`,
  ].join(" — ");
}

function formatItems(
  items: FinanceDeterministicAnalysis["overdueItems"],
): string {
  return items.length ? items.map(formatItem).join("\n") : "Kayıt yok.";
}

export function buildFinancePrompt(input: FinanceAiInput): string {
  const { analysis } = input;
  return `
İSTENEN ÇALIŞMA
${modeInstructions[input.mode]}

KESİN HESAPLANMIŞ ÖZET
Tarih: ${formatFinanceDate(analysis.currentDate)}
Toplam borç: ${formatTRY(analysis.totalDebt)}
Toplam ödenen: ${formatTRY(analysis.totalPaid)}
Kalan borç: ${formatTRY(analysis.remainingDebt)}
Bu ay vadesi gelen: ${formatTRY(analysis.thisMonthDueTotal)}
7 günlük ödeme yükü: ${formatTRY(analysis.next7DaysDueTotal)}
30 günlük ödeme yükü: ${formatTRY(analysis.next30DaysDueTotal)}
Aylık taksit yükü: ${formatTRY(analysis.monthlyBurdenEstimate)}

GECİKEN KAYITLAR
${formatItems(analysis.overdueItems)}

ÖNÜMÜZDEKİ 7 GÜN
${formatItems(analysis.upcoming7Days)}

ÖNÜMÜZDEKİ 30 GÜN
${formatItems(analysis.upcoming30Days)}

YÜKSEK ÖNCELİKLİ KAYITLAR
${formatItems(analysis.highPriorityItems)}

KISMİ ÖDENEN TAKSİTLER
${formatItems(analysis.partialInstallments)}

VADESİ OLMAYAN KAYITLAR
${formatItems(analysis.debtsWithoutDueDate)}

EN BÜYÜK KALAN BAKİYELER
${formatItems(analysis.largestDebts)}

Kurallar:
- Gerçek borç adlarını, tutarları ve tarihleri kullan.
- Olmayan nakit veya gelir bilgisi varsayma.
- Ödeme sırası önerirken vade, gecikme ve kayıt önceliğini gerekçe göster.
- Markdown, tablo, JSON ve kod bloğu kullanma.
`.trim();
}

export function buildDemoFinanceSummary(input: FinanceAiInput): string {
  const { analysis } = input;
  const common = [
    `Genel durum: Toplam borç ${formatTRY(analysis.totalDebt)}, kaydedilen ödeme ${formatTRY(
      analysis.totalPaid,
    )}, kalan borç ${formatTRY(analysis.remainingDebt)}.`,
    `Bu ay vadesi gelen kayıtların toplamı ${formatTRY(
      analysis.thisMonthDueTotal,
    )}. Önümüzdeki 7 günlük yük ${formatTRY(analysis.next7DaysDueTotal)}.`,
  ];
  const priorityLines = [
    ...analysis.overdueItems,
    ...analysis.upcoming7Days,
    ...analysis.highPriorityItems,
  ]
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) =>
            candidate.debtId === item.debtId &&
            candidate.installmentId === item.installmentId,
        ) === index,
    )
    .slice(0, 5)
    .map(
      (item, index) =>
        `${String(index + 1).padStart(2, "0")} — ${formatItem(item)}`,
    );

  const sections: Record<FinanceAiMode, string[]> = {
    payment_plan: [
      "ÖDEME PLANI",
      "",
      ...common,
      "",
      "Öncelik sırası:",
      ...(priorityLines.length
        ? priorityLines
        : ["Yakın vadeli veya gecikmiş ödeme görünmüyor."]),
      "",
      "7 günlük aksiyon:",
      "Geciken ve bugün vadesi gelen kayıtları kontrol et; yapılan ödemeleri aynı gün kaydet.",
      "",
      "30 günlük aksiyon:",
      "Yaklaşan taksitleri haftalık kontrol noktalarına böl ve vadesiz kayıtların tarihlerini tamamla.",
    ],
    risk_analysis: [
      "RİSKLİ BORÇLAR",
      "",
      ...common,
      "",
      "Gecikenler:",
      ...analysis.overdueItems.slice(0, 5).map(formatItem),
      "",
      "Kısmi ödenenler:",
      ...analysis.partialInstallments.slice(0, 5).map(formatItem),
      "",
      `Vadesi olmayan kayıt sayısı: ${analysis.debtsWithoutDueDate.length}`,
    ],
    monthly_summary: [
      "BU AY NE ÖDEMELİYİM?",
      "",
      ...common,
      "",
      "Bu ayın ödeme sırası:",
      ...(analysis.upcoming30Days.length
        ? analysis.upcoming30Days.slice(0, 8).map(formatItem)
        : ["Bu ay için açık ödeme görünmüyor."]),
    ],
    thirty_day_plan: [
      "30 GÜNLÜK FİNANS PLANI",
      "",
      ...common,
      "",
      "Hafta 1:",
      ...analysis.upcoming7Days.slice(0, 5).map(formatItem),
      "",
      "Hafta 2:",
      "8-14 gün aralığındaki vadeleri kontrol et ve ödeme kayıtlarını güncelle.",
      "",
      "Hafta 3:",
      "Kısmi ödenen taksitlerin kalan tutarlarını yeniden değerlendir.",
      "",
      "Hafta 4:",
      "Sonraki ayın taksit yükünü ve vadesiz borç kayıtlarını kontrol et.",
    ],
    manager_summary: [
      "YÖNETİCİ FİNANS ÖZETİ",
      "",
      ...common,
      "",
      `Kritik görünüm: ${analysis.overdueItems.length} geciken, ${analysis.highPriorityItems.length} yüksek öncelikli, ${analysis.partialInstallments.length} kısmi ödeme.`,
      "",
      "Önerilen 3 aksiyon:",
      "01 — Geciken kayıtları ödeme tarihi sırasıyla kontrol et.",
      "02 — Önümüzdeki 7 günlük taksitler için gerçek ödeme tutarlarını netleştir.",
      "03 — Vadesi olmayan borç kayıtlarına takip tarihi ekle.",
    ],
  };

  return [...sections[input.mode], "", FINANCE_DISCLAIMER].join("\n");
}
