import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { getInstallmentDisplayStatus } from "@/lib/finance/installments";
import type { Debt, DebtInstallment, DebtPayment } from "@/types";

export interface FinanceAnalysisItem {
  creditor: string;
  debtId: string;
  dueDate: string | null;
  installmentId?: string;
  installmentNo?: number;
  priority: Debt["priority"];
  remainingAmount: number;
  title: string;
}

export interface FinanceDeterministicAnalysis {
  currentDate: string;
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  thisMonthDueTotal: number;
  next7DaysDueTotal: number;
  next30DaysDueTotal: number;
  monthlyBurdenEstimate: number;
  overdueItems: FinanceAnalysisItem[];
  upcoming7Days: FinanceAnalysisItem[];
  upcoming30Days: FinanceAnalysisItem[];
  highPriorityItems: FinanceAnalysisItem[];
  partialInstallments: FinanceAnalysisItem[];
  debtsWithoutDueDate: FinanceAnalysisItem[];
  largestDebts: FinanceAnalysisItem[];
  recentPaymentTotal: number;
}

function addDays(dateKey: string, days: number): string {
  const value = new Date(`${dateKey}T12:00:00+03:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return getIstanbulDateKey(value);
}

function debtItem(debt: Debt): FinanceAnalysisItem {
  return {
    creditor: debt.creditor ?? "",
    debtId: debt.id,
    dueDate: debt.due_date,
    priority: debt.priority,
    remainingAmount: Math.max(debt.total_amount - debt.paid_amount, 0),
    title: debt.title,
  };
}

export function analyzeFinanceData(input: {
  debts: Debt[];
  installments: DebtInstallment[];
  payments: DebtPayment[];
}): FinanceDeterministicAnalysis {
  const currentDate = getIstanbulDateKey();
  const next7Date = addDays(currentDate, 7);
  const next30Date = addDays(currentDate, 30);
  const currentMonth = currentDate.slice(0, 7);
  const activeDebts = input.debts.filter(
    (debt) => debt.status !== "paid" && debt.status !== "cancelled",
  );
  const debtById = new Map(input.debts.map((debt) => [debt.id, debt]));
  const openInstallments = input.installments.filter(
    (installment) => getInstallmentDisplayStatus(installment) !== "paid",
  );
  const installmentItems = openInstallments.map((installment) => {
    const debt = debtById.get(installment.debt_id);
    return {
      creditor: debt?.creditor ?? "",
      debtId: installment.debt_id,
      dueDate: installment.due_date,
      installmentId: installment.id,
      installmentNo: installment.installment_no,
      priority: debt?.priority ?? ("medium" as const),
      remainingAmount: Math.max(
        installment.expected_amount - installment.paid_amount,
        0,
      ),
      title: debt?.title ?? "Borç kaydı",
    };
  });
  const nonInstallmentItems = activeDebts
    .filter((debt) => !debt.is_installment)
    .map(debtItem);
  const dueItems = [...installmentItems, ...nonInstallmentItems].filter(
    (item) => item.dueDate,
  );
  const overdueItems = dueItems
    .filter((item) => item.dueDate! < currentDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const upcoming7Days = dueItems
    .filter(
      (item) =>
        item.dueDate! >= currentDate && item.dueDate! <= next7Date,
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const upcoming30Days = dueItems
    .filter(
      (item) =>
        item.dueDate! >= currentDate && item.dueDate! <= next30Date,
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  return {
    currentDate,
    totalDebt: input.debts
      .filter((debt) => debt.status !== "cancelled")
      .reduce((sum, debt) => sum + debt.total_amount, 0),
    totalPaid: input.debts
      .filter((debt) => debt.status !== "cancelled")
      .reduce((sum, debt) => sum + debt.paid_amount, 0),
    remainingDebt: activeDebts.reduce(
      (sum, debt) =>
        sum + Math.max(debt.total_amount - debt.paid_amount, 0),
      0,
    ),
    thisMonthDueTotal: dueItems
      .filter((item) => item.dueDate?.startsWith(currentMonth))
      .reduce((sum, item) => sum + item.remainingAmount, 0),
    next7DaysDueTotal: upcoming7Days.reduce(
      (sum, item) => sum + item.remainingAmount,
      0,
    ),
    next30DaysDueTotal: upcoming30Days.reduce(
      (sum, item) => sum + item.remainingAmount,
      0,
    ),
    monthlyBurdenEstimate: openInstallments
      .filter((item) => item.due_date.startsWith(currentMonth))
      .reduce(
        (sum, item) =>
          sum + Math.max(item.expected_amount - item.paid_amount, 0),
        0,
      ),
    overdueItems,
    upcoming7Days,
    upcoming30Days,
    highPriorityItems: activeDebts
      .filter(
        (debt) =>
          debt.priority === "high" || debt.priority === "critical",
      )
      .map(debtItem)
      .sort((a, b) => b.remainingAmount - a.remainingAmount),
    partialInstallments: installmentItems.filter((item) => {
      const installment = input.installments.find(
        (candidate) => candidate.id === item.installmentId,
      );
      return installment ? installment.paid_amount > 0 : false;
    }),
    debtsWithoutDueDate: activeDebts
      .filter(
        (debt) =>
          !debt.due_date &&
          (!debt.is_installment || !debt.installment_start_date),
      )
      .map(debtItem),
    largestDebts: activeDebts
      .map(debtItem)
      .sort((a, b) => b.remainingAmount - a.remainingAmount)
      .slice(0, 5),
    recentPaymentTotal: input.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    ),
  };
}
