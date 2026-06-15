"use client";

import { useState } from "react";
import { AlertCircle, LoaderCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FinanceAiMode =
  | "payment_plan"
  | "risk_analysis"
  | "monthly_summary"
  | "thirty_day_plan"
  | "manager_summary";

const actions: Array<{ id: string; mode: FinanceAiMode; label: string; description: string }> = [
  { id: "payment-plan", mode: "payment_plan", label: "Ödeme planı çıkar", description: "Vadeler ve önceliklere göre kişisel takip planı oluşturur." },
  { id: "risk", mode: "risk_analysis", label: "Riskli borçları listele", description: "Gecikmiş ve kritik kayıtları öne çıkarır." },
  { id: "month", mode: "monthly_summary", label: "Bu ay ne ödemeliyim?", description: "Bu ayın ödeme görünümünü özetler." },
  { id: "30-days", mode: "thirty_day_plan", label: "30 günlük finans planı yap", description: "Ödemeleri dört haftalık kontrol planına dönüştürür." },
  { id: "manager", mode: "manager_summary", label: "Yönetici finans özeti oluştur", description: "Kısa, karar odaklı bir finans görünümü üretir." },
];

interface FinanceAiPanelProps {
  initialOpen: boolean;
  onClose: () => void;
}

export function FinanceAiPanel({ initialOpen, onClose }: FinanceAiPanelProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");

  if (!isOpen) return null;

  async function run(mode: FinanceAiMode) {
    setIsLoading(true);
    setError("");
    setOutput("");
    try {
      const response = await fetch("/api/ai/finance-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        provider?: string;
        output?: string;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.output) {
        throw new Error(payload.error || "Finans özeti oluşturulamadı.");
      }
      setOutput(payload.output);
      setProvider(payload.provider ?? "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Finans özeti oluşturulamadı.");
    } finally {
      setIsLoading(false);
    }
  }

  function close() {
    setIsOpen(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[95]">
      <button aria-label="AI finans panelini kapat" className="absolute inset-0 bg-black/70" onClick={close} type="button" />
      <aside className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l shadow-2xl" role="dialog" aria-modal="true">
        <div className="app-border flex items-center justify-between border-b p-5">
          <div>
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">Gemini finans analizi</p>
            <h2 className="app-text mt-1 text-lg font-semibold">Finans Özeti</h2>
          </div>
          <button aria-label="Kapat" className="app-button-ghost flex size-9 items-center justify-center rounded-lg" onClick={close} type="button"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <button className="app-surface-2 rounded-xl border p-4 text-left transition hover:border-[color-mix(in_srgb,var(--primary)_32%,var(--border))]" disabled={isLoading} key={action.id} onClick={() => void run(action.mode)} type="button">
                <Sparkles className="app-primary size-4" />
                <p className="app-text mt-3 text-sm font-semibold">{action.label}</p>
                <p className="app-muted mt-1 text-xs leading-5">{action.description}</p>
              </button>
            ))}
          </div>
          {isLoading ? <div className="app-muted flex min-h-48 items-center justify-center gap-2 text-sm"><LoaderCircle className="size-5 animate-spin" /> Finans verileri analiz ediliyor...</div> : null}
          {error ? <div className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-xs text-rose-300"><AlertCircle className="size-4 shrink-0" />{error}</div> : null}
          {output ? (
            <div className="app-surface-2 rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="app-text text-sm font-semibold">AI Çıktısı</p>
                <span className="app-muted text-[10px] uppercase">{provider}</span>
              </div>
              <div className="app-text mt-4 whitespace-pre-wrap text-sm leading-7">{output}</div>
            </div>
          ) : null}
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-300">
            AI çıktıları kişisel planlama amaçlıdır, finansal tavsiye değildir.
          </div>
        </div>
        <div className="app-border flex justify-end border-t p-4"><Button onClick={close} variant="secondary">Kapat</Button></div>
      </aside>
    </div>
  );
}
