import { formatTRY } from "@/lib/utils/currency";
import type { TodaySummary } from "@/types/today";

function section(title: string, lines: string[]): string {
  return `${title}\n${lines.length > 0 ? lines.join("\n") : "- Kayıt yok."}`;
}

function formatTime(value: string, allDay = false): string {
  if (allDay) return "Tüm gün";
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function buildDailyOperationNote(summary: TodaySummary): string {
  const financeLines = [
    ...summary.financeOverdue.map(
      (item) =>
        `- GECİKMİŞ: ${item.title} — kalan ${formatTRY(item.remainingAmount)}`,
    ),
    ...summary.financeDueToday.map(
      (item) =>
        `- BUGÜN: ${item.title} — kalan ${formatTRY(item.remainingAmount)}`,
    ),
  ];
  const taskLines = [
    ...summary.tasksOverdue.map((item) => `- GECİKMİŞ: ${item.title}`),
    ...summary.tasksDueToday.map((item) => `- BUGÜN: ${item.title}`),
  ];
  const calendarLines = summary.calendarItems.map(
    (item) => `- ${formatTime(item.startAt, item.allDay)} — ${item.title}`,
  );
  const notificationLines = summary.unreadNotifications
    .slice(0, 10)
    .map((item) => `- ${item.title}: ${item.message}`);
  const priorityLines = summary.priorities
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.title} — ${item.reason}`);

  return [
    `GÜNLÜK OPERASYON — ${summary.dateLabel.toLocaleUpperCase("tr-TR")}`,
    "",
    section("ÖNCELİK SIRASI", priorityLines),
    "",
    section("FİNANS", financeLines),
    "",
    section("GÖREVLER", taskLines),
    "",
    section("TAKVİM", calendarLines),
    "",
    section("BİLDİRİMLER", notificationLines),
    "",
    "GÜN SONU NOTU",
    "",
  ].join("\n");
}
