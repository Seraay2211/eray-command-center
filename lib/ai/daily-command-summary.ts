import "server-only";

import { formatTRY } from "@/lib/utils/currency";

export interface DailyCommandAiInput {
  date: string;
  notes: Array<{ title: string; content: string }>;
  tasks: Array<{
    title: string;
    description: string;
    priority: string;
    dueDate: string | null;
  }>;
  calendar: Array<{
    title: string;
    description: string;
    startAt: string;
  }>;
  debts: Array<{
    title: string;
    remainingAmount: number;
    priority: string;
    dueDate: string | null;
    status: string;
  }>;
  payments: Array<{
    amount: number;
    date: string;
    method: string | null;
  }>;
}

function listOrFallback(items: string[], fallback: string): string {
  return items.length > 0
    ? items.slice(0, 3).map((item) => `- ${item}`).join("\n")
    : `- ${fallback}`;
}

export function buildDemoDailyCommandSummary(
  input: DailyCommandAiInput,
): string {
  const now = Date.now();
  const overdueTasks = input.tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate).getTime() < now,
  );
  const criticalDebts = input.debts.filter(
    (debt) => debt.priority === "critical" || debt.status === "overdue",
  );
  const priorityTasks = [...overdueTasks, ...input.tasks].filter(
    (task, index, items) =>
      items.findIndex((item) => item.title === task.title) === index,
  );

  return [
    "BUGÜNÜN ÖNCELİKLERİ",
    listOrFallback(
      priorityTasks.map((task) => task.title),
      "Bugün için kritik görev görünmüyor.",
    ),
    "",
    "DİKKAT EDİLECEKLER",
    listOrFallback(
      [
        ...overdueTasks.map((task) => `${task.title} görevinin tarihi geçmiş.`),
        ...input.calendar.map((event) => `${event.title} takvimde planlı.`),
      ],
      "Acil dikkat gerektiren kayıt bulunmuyor.",
    ),
    "",
    "FİNANS UYARILARI",
    listOrFallback(
      criticalDebts.map(
        (debt) =>
          `${debt.title}: kalan ${formatTRY(debt.remainingAmount)}${debt.dueDate ? `, vade ${debt.dueDate}` : ""}.`,
      ),
      "Kritik veya gecikmiş finans kaydı görünmüyor.",
    ),
    "",
    "ÖNERİLEN 3 AKSİYON",
    listOrFallback(
      [
        priorityTasks[0]
          ? `${priorityTasks[0].title} için ilk somut adımı tamamla.`
          : "Günün en önemli işini belirle.",
        input.calendar[0]
          ? `${input.calendar[0].title} öncesinde gerekli hazırlığı kontrol et.`
          : "Takvimine bir odak bloğu ekle.",
        criticalDebts[0]
          ? `${criticalDebts[0].title} için ödeme durumunu gözden geçir.`
          : "Finans kayıtlarındaki yaklaşan vadeleri kontrol et.",
      ],
      "Günün planını kısa bir notla netleştir.",
    ),
    "",
    "KISA YÖNETİCİ ÖZETİ",
    `${input.date} için ${input.tasks.length} açık görev, ${input.calendar.length} takvim kaydı ve ${input.debts.length} aktif finans kaydı değerlendirildi. Önce geciken işleri, ardından gün içi planı ve yaklaşan ödemeleri ele al.`,
  ].join("\n");
}
