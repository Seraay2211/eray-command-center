import "server-only";

import type { ProductivityContext } from "@/lib/ai/build-productivity-context";
import { formatTRY } from "@/lib/utils/currency";

export interface DailyCommandAiInput {
  context?: ProductivityContext;
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
  installments?: Array<{
    title: string;
    remainingAmount: number;
    dueDate: string;
  }>;
  reports?: Array<{
    title: string;
    summary: string;
  }>;
}

function listOrFallback(items: string[], fallback: string): string {
  return items.length > 0
    ? items
        .slice(0, 3)
        .map((item, index) => `${String(index + 1).padStart(2, "0")} — ${item}`)
        .join("\n")
    : `01 — ${fallback}`;
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
  const riskyInstallments = input.installments ?? [];
  const priorityTasks = [...overdueTasks, ...input.tasks].filter(
    (task, index, items) =>
      items.findIndex((item) => item.title === task.title) === index,
  );
  const context = input.context;

  return [
    "KOMUTA ÖZETİ",
    "",
    "Genel Durum:",
    `Bugün ${input.tasks.length} açık görev, ${input.calendar.length} takvim kaydı, ${input.debts.length} aktif finans kaydı ve ${riskyInstallments.length} takipte taksit değerlendirildi.`,
    "",
    "Öncelikli Aksiyonlar:",
    listOrFallback(
      [
        ...priorityTasks.map((task) => `${task.title} işini net bir sonraki adıma indir.`),
        ...(context?.suggestions ?? []),
      ],
      "Bugün için kritik görev görünmüyor. Bir ana hedef belirlemek yeterli olabilir.",
    ),
    "",
    "Finans Uyarıları:",
    listOrFallback(
      [
        ...criticalDebts.map(
          (debt) =>
            `${debt.title}: kalan ${formatTRY(debt.remainingAmount)}${debt.dueDate ? `, vade ${debt.dueDate}` : ""}.`,
        ),
        ...riskyInstallments.map(
          (installment) =>
            `${installment.title}: kalan ${formatTRY(installment.remainingAmount)}, vade ${installment.dueDate}.`,
        ),
      ],
      "Kritik veya gecikmiş finans kaydı görünmüyor.",
    ),
    "",
    "Görev ve Takvim:",
    listOrFallback(
      [
        ...overdueTasks.map((task) => `${task.title} görevinin tarihi geçmiş.`),
        ...input.calendar.map((event) => `${event.title} bugün takvimde planlı.`),
      ],
      "Görev ve takvim tarafında acil görünen kayıt yok.",
    ),
    "",
    "Notlardan Çıkanlar:",
    listOrFallback(
      input.notes.map((note) => `${note.title}: ${note.content.slice(0, 120)}`),
      "Son notlardan acil bir başlık çıkmadı.",
    ),
    "",
    "Bugün İçin Net Plan:",
    listOrFallback(
      [
        priorityTasks[0]
          ? `${priorityTasks[0].title} için ilk somut adımı tamamla.`
          : "Günün ana odağını seç.",
        input.calendar[0]
          ? `${input.calendar[0].title} öncesinde hazırlığı kontrol et.`
          : "Takviminde bir odak bloğu aç.",
        criticalDebts[0] || riskyInstallments[0]
          ? "Finans ve taksit kayıtlarında yaklaşan vadeleri kontrol et."
          : "Günün sonunda kısa bir değerlendirme notu oluştur.",
      ],
      "Günü sade bir planla kapat.",
    ),
  ].join("\n");
}
