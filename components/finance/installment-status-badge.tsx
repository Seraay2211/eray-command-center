import { getInstallmentDisplayStatus } from "@/lib/finance/installments";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import type { DebtInstallment } from "@/types";

interface InstallmentStatusBadgeProps {
  installment: DebtInstallment;
}

const labels = {
  overdue: "Gecikti",
  paid: "Ödendi",
  partial: "Kısmi ödendi",
  pending: "Planlandı",
} as const;

export function InstallmentStatusBadge({
  installment,
}: InstallmentStatusBadgeProps) {
  const status = getInstallmentDisplayStatus(installment);
  const today = getIstanbulDateKey();
  const sevenDaysLater = getIstanbulDateKey(
    new Date(new Date(`${today}T12:00:00+03:00`).getTime() + 7 * 86400000),
  );
  const label =
    status === "pending" && installment.due_date === today
      ? "Bugün"
      : status === "pending" && installment.due_date <= sevenDaysLater
        ? "Yaklaşıyor"
        : labels[status];
  const color =
    status === "paid"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-400"
      : status === "overdue"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-400"
        : status === "partial"
          ? "border-amber-400/20 bg-amber-500/10 text-amber-400"
          : "app-border app-surface app-muted";

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  );
}
