import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import type {
  DebtInstallment,
  DebtInstallmentStatus,
} from "@/types";

export function addMonthsClamped(
  firstDueDate: string,
  monthOffset: number,
  preferredDay?: number | null,
): string {
  const [year, month, day] = firstDueDate.split("-").map(Number);
  const monthIndex = month - 1 + monthOffset;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonthIndex + 1, 0),
  ).getUTCDate();
  const targetDay = Math.min(
    Math.max(preferredDay ?? day, 1),
    lastDay,
  );

  return [
    String(targetYear).padStart(4, "0"),
    String(targetMonthIndex + 1).padStart(2, "0"),
    String(targetDay).padStart(2, "0"),
  ].join("-");
}

export function getInstallmentDisplayStatus(
  installment: Pick<
    DebtInstallment,
    "due_date" | "expected_amount" | "paid_amount" | "status"
  >,
): DebtInstallmentStatus {
  if (
    installment.status === "paid" ||
    installment.paid_amount >= installment.expected_amount
  ) {
    return "paid";
  }

  if (installment.paid_amount > 0) {
    return "partial";
  }

  if (installment.due_date < getIstanbulDateKey()) {
    return "overdue";
  }

  return "pending";
}

export function formatFinanceDate(value: string | null | undefined): string {
  if (!value) return "Belirtilmedi";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(`${value}T12:00:00+03:00`));
}

export function getNextOpenInstallment(
  installments: DebtInstallment[],
): DebtInstallment | null {
  return (
    installments
      .filter((item) => getInstallmentDisplayStatus(item) !== "paid")
      .sort((first, second) => {
        const dateOrder = first.due_date.localeCompare(second.due_date);
        return dateOrder || first.installment_no - second.installment_no;
      })[0] ?? null
  );
}
