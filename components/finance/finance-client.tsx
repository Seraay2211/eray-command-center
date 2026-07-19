"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { DebtCard } from "@/components/finance/debt-card";
import { DebtDetailPanel } from "@/components/finance/debt-detail-panel";
import { DebtForm } from "@/components/finance/debt-form";
import { FinanceCommandHero } from "@/components/finance/finance-command-hero";
import { FinanceStatCard } from "@/components/finance/finance-stat-card";
import { InstallmentPaymentForm } from "@/components/finance/installment-payment-form";
import { PaymentForm } from "@/components/finance/payment-form";
import { SmartFinancePlan } from "@/components/finance/smart-finance-plan";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { formatSensitiveTRY } from "@/lib/privacy";
import { getUserFacingError } from "@/lib/user-facing-error";
import {
  createDebt,
  createDebtPayment,
  createDebtReminder,
  deleteDebt,
  deleteDebtPayment,
  getDebtPayments,
  getDebts,
  getFinanceStats,
  getFinanceInstallments,
  getRecentPayments,
  updateDebt,
} from "@/services/finance-service";
import type {
  CreateDebtInput,
  CreateDebtPaymentInput,
  CreateDebtPaymentWithReceiptInput,
  Debt,
  DebtInstallment,
  DebtPayment,
  FinanceStats,
} from "@/types";

const FinanceAiPanel = dynamic(
  () =>
    import("@/components/finance/finance-ai-panel").then(
      (module) => module.FinanceAiPanel,
    ),
  { ssr: false },
);

interface FinanceClientProps {
  initialAiOpen: boolean;
  initialDebts: Debt[];
  initialError: string;
  initialInstallments: DebtInstallment[];
  initialInstallmentPaymentId: string;
  initialNewOpen: boolean;
  initialPayments: DebtPayment[];
  initialSelectedPayments: DebtPayment[];
  initialSelectedPaymentError: string;
  initialSelectedDebtId: string;
  initialStats: FinanceStats;
}

const emptyStats: FinanceStats = {
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
};

export function FinanceClient({
  initialAiOpen,
  initialDebts,
  initialError,
  initialInstallments,
  initialInstallmentPaymentId,
  initialNewOpen,
  initialPayments,
  initialSelectedPayments,
  initialSelectedPaymentError,
  initialSelectedDebtId,
  initialStats,
}: FinanceClientProps) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentRequestRef = useRef(0);
  const saveMutationRef = useRef(false);
  const paymentMutationRef = useRef(false);
  const paymentDeleteRef = useRef(new Set<string>());
  const [debts, setDebts] = useState(initialDebts);
  const [installments, setInstallments] = useState(initialInstallments);
  const [stats, setStats] = useState(initialStats ?? emptyStats);
  const [recentPayments, setRecentPayments] = useState(initialPayments);
  const [selectedDebtId, setSelectedDebtId] = useState(initialSelectedDebtId);
  const [payments, setPayments] = useState<DebtPayment[]>(initialSelectedPayments);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(initialNewOpen);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const initialInstallment = initialInstallments.find(
    (item) => item.id === initialInstallmentPaymentId,
  );
  const initialInstallmentDebt = initialDebts.find(
    (item) => item.id === initialInstallment?.debt_id,
  );
  const [installmentPayment, setInstallmentPayment] = useState<{
    debt: Debt;
    installment: DebtInstallment;
  } | null>(
    initialInstallment && initialInstallmentDebt
      ? { debt: initialInstallmentDebt, installment: initialInstallment }
      : null,
  );
  const [isAiOpen, setIsAiOpen] = useState(initialAiOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState("");
  const [receiptActionId, setReceiptActionId] = useState("");
  const [formError, setFormError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentHistoryError, setPaymentHistoryError] = useState(
    initialSelectedPaymentError,
  );
  const [receiptError, setReceiptError] = useState("");
  const [pageError, setPageError] = useState(() =>
    initialError ? getUserFacingError(initialError) : "",
  );
  const [notice, setNotice] = useState("");

  const selectedDebt = useMemo(
    () => debts.find((debt) => debt.id === selectedDebtId) ?? null,
    [debts, selectedDebtId],
  );
  const selectedInstallments = useMemo(
    () =>
      installments.filter(
        (installment) => installment.debt_id === selectedDebtId,
      ),
    [installments, selectedDebtId],
  );
  const criticalDebts = useMemo(
    () =>
      debts.filter(
        (debt) =>
          debt.status !== "paid" &&
          debt.status !== "cancelled" &&
          (debt.priority === "critical" ||
            debt.status === "overdue" ||
            Boolean(debt.due_date && debt.due_date < getIstanbulDateKey())),
      ),
    [debts],
  );
  const installmentsByDebt = useMemo(() => {
    const index = new Map<string, DebtInstallment[]>();
    installments.forEach((installment) => {
      const current = index.get(installment.debt_id);
      if (current) current.push(installment);
      else index.set(installment.debt_id, [installment]);
    });
    return index;
  }, [installments]);
  const debtsById = useMemo(
    () => new Map(debts.map((debt) => [debt.id, debt])),
    [debts],
  );
  const schemaMissing = pageError.includes("Finans alanı şu anda");

  const replaceParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(changes).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  async function refreshData() {
    const [debtsResult, statsResult, paymentsResult, installmentsResult] =
      await Promise.all([
        getDebts(50),
        getFinanceStats(),
        getRecentPayments(8),
        getFinanceInstallments(300),
      ]);
    const error =
      debtsResult.error ??
      statsResult.error ??
      paymentsResult.error ??
      installmentsResult.error;
    if (error) {
      setPageError(getUserFacingError(error));
      return;
    }
    setDebts(debtsResult.data ?? []);
    setStats(statsResult.data ?? emptyStats);
    setRecentPayments(paymentsResult.data ?? []);
    setInstallments(installmentsResult.data ?? []);
    setPageError("");
  }

  async function refreshSummaryData() {
    const [statsResult, paymentsResult] = await Promise.all([
      getFinanceStats(),
      getRecentPayments(8),
    ]);
    const error = statsResult.error ?? paymentsResult.error;
    if (error) {
      setPageError(getUserFacingError(error));
      return;
    }
    setStats(statsResult.data ?? emptyStats);
    setRecentPayments(paymentsResult.data ?? []);
    setPageError("");
  }

  async function selectDebt(debt: Debt, updateUrl = true) {
    const requestId = paymentRequestRef.current + 1;
    paymentRequestRef.current = requestId;
    setSelectedDebtId(debt.id);
    setPaymentError("");
    setPaymentHistoryError("");
    setReceiptError("");
    setPayments([]);
    setIsLoadingPayments(true);
    if (updateUrl) replaceParams({ debt: debt.id });
    try {
      const result = await getDebtPayments(debt.id);
      if (paymentRequestRef.current !== requestId) return;
      if (result.error) {
        setPaymentHistoryError(
          "Ödeme geçmişi yüklenemedi. Lütfen tekrar dene.",
        );
        return;
      }
      setPayments(result.data ?? []);
    } catch {
      if (paymentRequestRef.current === requestId) {
        setPaymentHistoryError(
          "Ödeme geçmişi yüklenemedi. Lütfen tekrar dene.",
        );
      }
    } finally {
      if (paymentRequestRef.current === requestId) {
        setIsLoadingPayments(false);
      }
    }
  }

  function openNew() {
    setEditingDebt(null);
    setFormError("");
    setIsFormOpen(true);
    replaceParams({ new: "1" });
  }

  function openEdit(debt: Debt) {
    setEditingDebt(debt);
    setFormError("");
    setIsFormOpen(true);
  }

  function openPayment(debt: Debt) {
    setPaymentError("");
    setPaymentDebt(debt);
  }

  function openInstallmentPayment(
    debt: Debt,
    installment: DebtInstallment,
  ) {
    setPaymentError("");
    setInstallmentPayment({ debt, installment });
    replaceParams({ debt: debt.id, installment: installment.id });
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingDebt(null);
    setFormError("");
    replaceParams({ new: null });
  }

  async function handleSave(input: CreateDebtInput) {
    if (saveMutationRef.current) return;
    saveMutationRef.current = true;
    const isEditing = Boolean(editingDebt);
    setIsSaving(true);
    setFormError("");
    try {
      const result = editingDebt
        ? await updateDebt(editingDebt.id, input)
        : await createDebt(input);
      if (result.error || !result.data) {
        setFormError(
          isEditing
            ? "Borç kaydı güncellenemedi."
            : "Borç kaydı oluşturulamadı.",
        );
        return;
      }
      const savedDebt = result.data;
      setDebts((current) => {
        const exists = current.some((item) => item.id === savedDebt.id);
        return exists
          ? current.map((item) => (item.id === savedDebt.id ? savedDebt : item))
          : [savedDebt, ...current];
      });
      setSelectedDebtId(savedDebt.id);
      setNotice(
        isEditing
          ? "Borç kaydı güncellendi."
          : "Yeni borç kaydı oluşturuldu.",
      );
      setIsFormOpen(false);
      setEditingDebt(null);
      setFormError("");
      replaceParams({ new: null, debt: savedDebt.id });
      void refreshData();
      void selectDebt(savedDebt, false);
    } catch {
      setFormError(
        isEditing
          ? "Borç kaydı güncellenemedi."
          : "Borç kaydı oluşturulamadı.",
      );
    } finally {
      saveMutationRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleDelete(debt: Debt) {
    if (!window.confirm(`"${debt.title}" borç kaydı ve ödeme geçmişi silinsin mi?`)) return;
    const result = await deleteDebt(debt.id);
    if (result.error) {
      setPageError(getUserFacingError(result.error));
      return;
    }
    if (selectedDebtId === debt.id) {
      setSelectedDebtId("");
      setPayments([]);
      replaceParams({ debt: null });
    }
    setNotice(result.data?.warning ?? "Borç kaydı silindi.");
    await refreshData();
  }

  async function handlePayment(input: CreateDebtPaymentWithReceiptInput) {
    if (paymentMutationRef.current) return;
    paymentMutationRef.current = true;
    setIsSavingPayment(true);
    setPaymentError("");
    setPaymentHistoryError("");
    try {
      const { receipt, ...paymentInput } = input;
      const result = await createDebtPayment(paymentInput);
      if (result.error || !result.data) {
        setPaymentError(getUserFacingError(result.error, "Ödeme kaydedilemedi."));
        return;
      }
      let savedPayment = result.data.payment;
      let receiptWarning = "";

      if (receipt) {
        try {
          const formData = new FormData();
          formData.append("paymentId", savedPayment.id);
          formData.append("file", receipt.file);
          formData.append("ocrStatus", receipt.ocr_status);
          if (receipt.ocr_result) {
            formData.append("ocrResult", JSON.stringify(receipt.ocr_result));
          }

          const uploadResponse = await fetch("/api/finance/receipts", {
            method: "POST",
            body: formData,
          });
          const uploadPayload = (await uploadResponse.json()) as {
            error?: string;
            payment?: DebtPayment;
            success: boolean;
          };

          if (
            uploadResponse.ok &&
            uploadPayload.success &&
            uploadPayload.payment
          ) {
            savedPayment = {
              ...uploadPayload.payment,
              amount: Number(uploadPayload.payment.amount) || 0,
            };
          } else {
            receiptWarning =
              getUserFacingError(
                uploadPayload.error,
                "Dekont yüklenemedi. Daha sonra tekrar deneyebilirsin.",
              );
          }
        } catch {
          receiptWarning =
            "Dekont yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.";
        }
      }

      setPaymentDebt(null);
      setSelectedDebtId(result.data.debt.id);
      setDebts((current) =>
        current.map((debt) =>
          debt.id === result.data!.debt.id ? result.data!.debt : debt,
        ),
      );
      setPayments((current) => [savedPayment, ...current]);
      setNotice(
        receiptWarning
          ? `Ödeme kaydedildi ancak dekont yüklenemedi. ${receiptWarning}`
          : receipt
            ? "Ödeme ve dekont kaydedildi. Kalan borç güncellendi."
            : "Ödeme kaydedildi ve kalan borç güncellendi.",
      );
      void refreshSummaryData();
    } catch {
      setPaymentError("Ödeme kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      paymentMutationRef.current = false;
      setIsSavingPayment(false);
    }
  }

  async function handleInstallmentPayment(input: CreateDebtPaymentInput) {
    if (paymentMutationRef.current) return;
    paymentMutationRef.current = true;
    setIsSavingPayment(true);
    setPaymentError("");
    setPaymentHistoryError("");
    try {
      const result = await createDebtPayment(input);
      if (result.error || !result.data) {
        setPaymentError("Taksit ödemesi kaydedilemedi. Lütfen tekrar dene.");
        return;
      }
      setDebts((current) =>
        current.map((debt) =>
          debt.id === result.data!.debt.id ? result.data!.debt : debt,
        ),
      );
      setPayments((current) => [result.data!.payment, ...current]);
      if (result.data.installment) {
        setInstallments((current) =>
          current.map((item) =>
            item.id === result.data!.installment!.id
              ? result.data!.installment!
              : item,
          ),
        );
      }
      setInstallmentPayment(null);
      replaceParams({ debt: result.data.debt.id, installment: null });
      setNotice("Taksit ödemesi kaydedildi ve kalan borç güncellendi.");
      void refreshSummaryData();
    } catch {
      setPaymentError("Taksit ödemesi kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      paymentMutationRef.current = false;
      setIsSavingPayment(false);
    }
  }

  async function handleDeletePayment(payment: DebtPayment) {
    if (paymentDeleteRef.current.has(payment.id)) return;
    if (
      !window.confirm(
        "Bu ödeme kaydı silinecek ve borcun ödenen tutarı geri düşecek. Emin misin?",
      )
    ) {
      return;
    }
    paymentDeleteRef.current.add(payment.id);
    setIsDeletingPayment(payment.id);
    setPaymentError("");
    setPaymentHistoryError("");
    try {
      const result = await deleteDebtPayment(payment.id);
      if (result.error || !result.data) {
        setPaymentHistoryError("Ödeme silinemedi. Lütfen tekrar dene.");
        return;
      }
      setDebts((current) =>
        current.map((debt) =>
          debt.id === result.data!.debt.id ? result.data!.debt : debt,
        ),
      );
      setPayments((current) =>
        current.filter((item) => item.id !== payment.id),
      );
      if (result.data.installment) {
        setInstallments((current) =>
          current.map((item) =>
            item.id === result.data!.installment!.id
              ? result.data!.installment!
              : item,
          ),
        );
      }
      setNotice(
        result.data.warning ??
          "Ödeme silindi ve borç toplamı güncellendi.",
      );
      void refreshSummaryData();
    } catch {
      setPaymentHistoryError("Ödeme silinemedi. Lütfen tekrar dene.");
    } finally {
      paymentDeleteRef.current.delete(payment.id);
      setIsDeletingPayment("");
    }
  }

  async function handleViewReceipt(payment: DebtPayment) {
    setReceiptActionId(payment.id);
    setReceiptError("");
    try {
      const response = await fetch(`/api/finance/receipts/${payment.id}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        error?: string;
        signedUrl?: string;
        success: boolean;
      };

      if (!response.ok || !payload.success || !payload.signedUrl) {
        setReceiptError(
          getUserFacingError(
            payload.error,
            "Dekont görüntülenemedi. Lütfen tekrar dene.",
          ),
        );
        return;
      }

      const link = document.createElement("a");
      link.href = payload.signedUrl;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      link.click();
    } catch {
      setReceiptError(
        "Dekont görüntülenemedi. Lütfen tekrar dene.",
      );
    } finally {
      setReceiptActionId("");
    }
  }

  async function handleDeleteReceipt(payment: DebtPayment) {
    if (!window.confirm("Bu ödemeye bağlı dekont silinsin mi?")) return;

    setReceiptActionId(payment.id);
    setReceiptError("");
    try {
      const response = await fetch(`/api/finance/receipts/${payment.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: string;
        success: boolean;
      };

      if (!response.ok || !payload.success) {
        setReceiptError(
          getUserFacingError(
            payload.error,
            "Dekont silinemedi. Lütfen tekrar dene.",
          ),
        );
        return;
      }

      const withoutReceipt = (item: DebtPayment): DebtPayment =>
        item.id === payment.id
          ? {
              ...item,
              receipt_url: null,
              receipt_path: null,
              receipt_file_name: null,
              receipt_mime_type: null,
              ocr_status: "idle",
              ocr_result: null,
            }
          : item;
      setPayments((current) => current.map(withoutReceipt));
      setRecentPayments((current) => current.map(withoutReceipt));
      setNotice("Dekont silindi. Ödeme kaydı korunuyor.");
    } catch {
      setReceiptError("Dekont silinemedi. Lütfen tekrar dene.");
    } finally {
      setReceiptActionId("");
    }
  }

  async function handleReminder(debt: Debt) {
    const result = await createDebtReminder(debt.id);
    if (result.error) {
      setPageError(getUserFacingError(result.error));
      return;
    }
    setNotice("Ödeme hatırlatması takvime eklendi.");
  }

  function closeDetail() {
    paymentRequestRef.current += 1;
    setSelectedDebtId("");
    setPayments([]);
    setPaymentHistoryError("");
    setReceiptError("");
    setIsLoadingPayments(false);
    replaceParams({ debt: null, installment: null });
  }

  return (
    <div>
      <FinanceCommandHero
        onError={setPageError}
        onOpenAi={() => {
          setIsAiOpen(true);
          replaceParams({ action: "summary" });
        }}
        onOpenNew={openNew}
        stats={stats}
      />

      {notice ? <div className="app-surface fixed inset-x-3 top-20 z-[120] rounded-xl border border-emerald-400/20 px-4 py-3 text-xs text-emerald-500 shadow-2xl sm:left-auto sm:right-4">{notice}</div> : null}

      {schemaMissing ? (
        <Card className="p-6 sm:p-8">
          <AlertCircle className="size-6 text-amber-400" />
          <h2 className="app-text mt-4 text-lg font-semibold">Finans alanı şu anda hazır değil</h2>
          <p className="app-muted mt-2 max-w-2xl text-sm leading-6">Kurulum tamamlandıktan sonra borç ve ödeme kayıtların burada yeniden görünecek.</p>
          <Button className="mt-5" onClick={() => router.refresh()}><RefreshCw className="size-4" /> Tekrar Kontrol Et</Button>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {pageError ? <div className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-xs text-rose-300"><AlertCircle className="size-4 shrink-0" />{pageError}</div> : null}
          <SmartFinancePlan
            debts={debts}
            installments={installments}
            onInspect={(debtId) => {
              const debt = debtsById.get(debtId);
              if (debt) void selectDebt(debt);
            }}
            onOpenAi={() => {
              setIsAiOpen(true);
              replaceParams({ action: "summary" });
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceStatCard
              description="Vadesi bugün olan taksitler"
              icon={CalendarClock}
              label="Bugün Ödenecek"
              value={String(stats.dueTodayInstallmentCount)}
            />
            <FinanceStatCard
              description="Önümüzdeki 7 günlük plan"
              icon={CalendarClock}
              label="7 Gün İçinde"
              value={String(stats.dueSoonInstallmentCount)}
            />
            <FinanceStatCard
              description="Vadesi geçen taksitler"
              icon={AlertCircle}
              label="Geciken Taksit"
              tone="danger"
              value={String(stats.overdueInstallmentCount)}
            />
            <FinanceStatCard
              description="Bu ay açık taksit toplamı"
              icon={WalletCards}
              label="Aylık Taksit Yükü"
              value={formatSensitiveTRY(stats.monthlyInstallmentBurden, settings)}
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.72fr)]">
            <div className="space-y-5">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="app-text text-base font-semibold">Borç Listesi</h2>
                    <p className="app-muted mt-1 text-xs">En fazla 50 aktif finans kaydı gösterilir.</p>
                  </div>
                  <span className="app-muted text-xs">{debts.length} kayıt</span>
                </div>
                {debts.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {debts.map((debt) => (
                      <DebtCard
                        debt={debt}
                        installments={installmentsByDebt.get(debt.id) ?? []}
                        isSelected={selectedDebtId === debt.id}
                        key={debt.id}
                        onDelete={(item) => void handleDelete(item)}
                        onEdit={openEdit}
                        onInstallmentPayment={openInstallmentPayment}
                        onPayment={openPayment}
                        onSelect={(item) => void selectDebt(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                    <Banknote className="app-primary size-7" />
                    <h2 className="app-text mt-4 text-base font-semibold">Henüz finans kaydı yok</h2>
                    <p className="app-muted mt-2 max-w-md text-sm leading-6">Borç, taksit veya ödeme kaydı ekleyerek finans merkezini kullanmaya başlayabilirsin.</p>
                    <Button className="mt-5" onClick={openNew}><Plus className="size-4" /> Borç Ekle</Button>
                  </Card>
                )}
              </section>

              {criticalDebts.length ? (
                <section>
                  <h2 className="app-text text-base font-semibold">Kritik / Gecikmiş Borçlar</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {criticalDebts.slice(0, 4).map((debt) => (
                      <button className="rounded-xl border border-rose-400/15 bg-rose-500/[0.06] p-4 text-left" key={debt.id} onClick={() => void selectDebt(debt)} type="button">
                        <p className="app-text text-sm font-semibold">{debt.title}</p>
                        <p className="mt-2 text-xs text-rose-300">Kalan {formatSensitiveTRY(Math.max(debt.total_amount - debt.paid_amount, 0), settings)}</p>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <h2 className="app-text text-base font-semibold">Son Ödemeler</h2>
                <Card className="mt-3 p-4">
                  {recentPayments.length ? (
                    <div className="divide-y divide-[var(--border)]">
                      {recentPayments.map((payment) => {
                        const debt = debtsById.get(payment.debt_id);
                        return (
                          <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={payment.id}>
                            <div><p className="app-text text-xs font-medium">{debt?.title ?? "Borç kaydı"}</p><p className="app-muted mt-1 text-[10px]">{payment.payment_date}{payment.method ? ` · ${payment.method}` : ""}</p></div>
                            <p className="text-sm font-semibold text-emerald-400">{formatSensitiveTRY(payment.amount, settings)}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="app-muted text-xs">Henüz ödeme kaydı yok.</p>}
                </Card>
              </section>
            </div>
            <DebtDetailPanel
              debt={selectedDebt}
              installments={selectedInstallments}
              isDeletingPayment={isDeletingPayment}
              isLoadingPayments={isLoadingPayments}
              isSavingPayment={isSavingPayment}
              onAddReminder={(debt) => void handleReminder(debt)}
              onClose={closeDetail}
              onDeletePayment={(payment) => void handleDeletePayment(payment)}
              onDeleteReceipt={(payment) => void handleDeleteReceipt(payment)}
              onEdit={openEdit}
              onInstallmentPayment={(installment) => {
                if (selectedDebt) {
                  openInstallmentPayment(selectedDebt, installment);
                }
              }}
              onPayment={(input) => void handlePayment(input)}
              onViewReceipt={(payment) => void handleViewReceipt(payment)}
              paymentError={paymentError}
              paymentHistoryError={paymentHistoryError}
              payments={payments}
              receiptActionId={receiptActionId}
              receiptError={receiptError}
            />
          </div>
        </div>
      )}

      <DebtForm debt={editingDebt} error={formError} isOpen={isFormOpen && !schemaMissing} isSaving={isSaving} key={`${isFormOpen}-${editingDebt?.id ?? "new"}`} onClose={closeForm} onSubmit={(input) => void handleSave(input)} />
      {paymentDebt ? <div className="fixed inset-0 z-[88] flex items-center justify-center p-4"><button aria-label="Ödeme formunu kapat" className="absolute inset-0 bg-black/70" onClick={() => setPaymentDebt(null)} type="button" /><div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto"><PaymentForm debt={paymentDebt} error={paymentError} isSaving={isSavingPayment} onCancel={() => setPaymentDebt(null)} onSubmit={(input) => void handlePayment(input)} /></div></div> : null}
      {installmentPayment ? (
        <InstallmentPaymentForm
          debt={installmentPayment.debt}
          error={paymentError}
          installment={installmentPayment.installment}
          isSaving={isSavingPayment}
          onClose={() => {
            if (!isSavingPayment) {
              setInstallmentPayment(null);
              replaceParams({ installment: null });
            }
          }}
          onSubmit={(input) => void handleInstallmentPayment(input)}
        />
      ) : null}
      <FinanceAiPanel initialOpen={isAiOpen} key={String(isAiOpen)} onClose={() => { setIsAiOpen(false); replaceParams({ action: null }); }} />
    </div>
  );
}
