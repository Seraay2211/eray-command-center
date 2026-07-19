import {
  CheckCircle2,
  CircleGauge,
  CircleDollarSign,
  FileText,
  ListTodo,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WeeklyReviewData } from "@/types";

interface WeeklyReviewCardProps {
  review: WeeklyReviewData;
}

function clampScore(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function getWeeklyScore(review: WeeklyReviewData): number {
  const penalties =
    Math.min(review.overdueTasks * 8, 32) +
    Math.min(review.overdueFinanceItems * 12, 36) +
    Math.min(Math.max(review.upcomingPayments - 3, 0) * 3, 12) +
    Math.min(Math.max(review.activeTasks - 8, 0) * 2, 20);
  const positives =
    Math.min(review.completedTasks * 2, 10) +
    Math.min(review.paymentsMade * 3, 9) +
    Math.min(review.notesCreated, 7);

  return clampScore(100 - penalties + positives);
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Güçlü Hafta";
  if (score >= 60) return "Dengeli Hafta";
  if (score >= 40) return "Dikkat Gerekiyor";
  return "Toparlanma Haftası";
}

function getNextWeekFocus(review: WeeklyReviewData): string {
  if (review.overdueFinanceItems > 0) {
    return "Yeni haftaya geciken ödemeleri netleştirerek başla.";
  }

  if (review.overdueTasks >= 3) {
    return "Yeni haftaya biriken görevleri sadeleştirerek başla.";
  }

  if (review.notesCreated < 3) {
    return "Haftayı daha iyi takip etmek için kısa günlük notlar ekle.";
  }

  return "Yeni hafta için 1 net finans, 1 net görev hedefi belirle.";
}

function getFinancePressure(review: WeeklyReviewData): string {
  if (
    review.overdueFinanceItems >= 3 ||
    (review.overdueFinanceItems > 0 && review.upcomingPayments >= 5)
  ) {
    return "Kritik";
  }

  if (review.overdueFinanceItems > 0) return "Yüksek";
  if (review.upcomingPayments >= 4) return "Orta";
  return "Düşük";
}

function getTaskPressure(review: WeeklyReviewData): string {
  if (review.overdueTasks >= 3 || review.activeTasks >= 12) return "Sıkışık";
  if (review.overdueTasks > 0 || review.activeTasks >= 5) return "Yoğun";
  return "Sakin";
}

export function WeeklyReviewCard({ review }: WeeklyReviewCardProps) {
  const score = getWeeklyScore(review);
  const hasActivity =
    review.completedTasks +
      review.activeTasks +
      review.paymentsMade +
      review.notesCreated +
      review.upcomingPayments +
      review.overdueFinanceItems >
    0;
  const metrics = [
    {
      icon: CheckCircle2,
      label: "Tamamlanan görev",
      value: review.completedTasks,
    },
    {
      icon: ListTodo,
      label: "Geciken görev",
      value: review.overdueTasks,
    },
    {
      icon: CircleDollarSign,
      label: "Yapılan ödeme",
      value: review.paymentsMade,
    },
    { icon: FileText, label: "Oluşturulan not", value: review.notesCreated },
  ];

  return (
    <Card className="h-full min-w-0 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
            <CircleGauge className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              Son 7 Gün
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              Haftalık Değerlendirme
            </h2>
            <p className="app-muted mt-1 text-[11px] leading-5">
              Son 7 günü kısa bir özetle gör, yeni haftaya daha net gir.
            </p>
          </div>
        </div>
        <div className="app-surface-2 shrink-0 rounded-xl border px-4 py-3 text-center sm:min-w-28">
          <p className="app-primary text-2xl font-semibold">{score}</p>
          <p className="app-muted mt-0.5 text-[9px]">{getScoreLabel(score)}</p>
        </div>
      </div>

      {!review.available || !hasActivity ? (
        <p className="app-surface-2 app-muted mt-4 rounded-xl border border-dashed p-4 text-xs leading-5">
          Bu hafta için yeterli kayıt oluşmamış. Kayıt girdikçe haftalık özet burada güçlenecek.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="app-surface-2 min-w-0 rounded-xl border p-3" key={metric.label}>
              <Icon className="app-primary size-3.5" />
              <p className="app-text mt-2 text-sm font-semibold">{metric.value}</p>
              <p className="app-muted mt-1 text-[9px] leading-4">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="app-surface-2 rounded-xl border p-3">
          <p className="app-muted text-[9px]">Finans özeti</p>
          <p className="app-text mt-1 text-xs font-semibold">
            {review.upcomingPayments} yaklaşan · {review.overdueFinanceItems > 0 ? "Gecikme var" : "Gecikme yok"}
          </p>
          <p className="app-primary mt-1 text-[10px] font-semibold">
            Baskı: {getFinancePressure(review)}
          </p>
        </div>
        <div className="app-surface-2 rounded-xl border p-3">
          <p className="app-muted text-[9px]">Görev özeti</p>
          <p className="app-text mt-1 text-xs font-semibold">
            {review.completedTasks} tamamlandı · {review.activeTasks} bekliyor
          </p>
          <p className="app-primary mt-1 text-[10px] font-semibold">
            Baskı: {getTaskPressure(review)}
          </p>
        </div>
      </div>

      <div className="app-surface mt-3 flex min-w-0 items-start gap-3 rounded-xl border p-3">
        <Target className="app-primary mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="app-muted text-[9px]">Yeni Hafta Odağı</p>
          <p className="app-text mt-1 text-xs font-semibold leading-5">
            {getNextWeekFocus(review)}
          </p>
        </div>
      </div>
    </Card>
  );
}
