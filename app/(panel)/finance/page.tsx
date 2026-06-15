import { FinanceClient } from "@/components/finance/finance-client";
import { generateFinanceAlerts } from "@/lib/notifications/finance-alerts";
import {
  getDebtById,
  getDebtPayments,
  getDebts,
  getFinanceStats,
  getFinanceInstallments,
  getRecentPayments,
} from "@/services/finance-service";

export const metadata = {
  title: "Finans",
};

export const dynamic = "force-dynamic";

interface FinancePageProps {
  searchParams: Promise<{
    action?: string;
    debt?: string;
    installment?: string;
    new?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const query = await searchParams;
  const [debtsResult, statsResult, paymentsResult, installmentsResult] =
    await Promise.all([
      getDebts(50),
      getFinanceStats(),
      getRecentPayments(8),
      getFinanceInstallments(300),
    ]);
  const debtMissing =
    Boolean(query.debt) &&
    !(debtsResult.data ?? []).some((debt) => debt.id === query.debt);
  const selectedResult =
    debtMissing && query.debt ? await getDebtById(query.debt) : null;
  const selectedPaymentsResult = query.debt
    ? await getDebtPayments(query.debt)
    : null;
  const initialDebts = selectedResult?.data
    ? [selectedResult.data, ...(debtsResult.data ?? [])]
    : (debtsResult.data ?? []);
  await generateFinanceAlerts(initialDebts);

  return (
    <FinanceClient
      initialAiOpen={query.action === "summary"}
      initialDebts={initialDebts}
      initialInstallments={installmentsResult.data ?? []}
      initialInstallmentPaymentId={query.installment ?? ""}
      initialError={
        debtsResult.error ?? statsResult.error ?? paymentsResult.error ?? ""
      }
      initialNewOpen={query.new === "1"}
      initialPayments={paymentsResult.data ?? []}
      initialSelectedPayments={selectedPaymentsResult?.data ?? []}
      initialSelectedPaymentError={
        selectedPaymentsResult?.error
          ? "Ödeme geçmişi yüklenemedi. Lütfen tekrar dene."
          : ""
      }
      initialSelectedDebtId={query.debt ?? ""}
      initialStats={
        statsResult.data ?? {
          totalDebt: 0,
          totalPaid: 0,
          remainingDebt: 0,
          dueThisMonth: 0,
          criticalCount: 0,
          overdueCount: 0,
          dueTodayInstallmentCount: 0,
          dueSoonInstallmentCount: 0,
          overdueInstallmentCount: 0,
          monthlyInstallmentBurden: 0,
        }
      }
    />
  );
}
