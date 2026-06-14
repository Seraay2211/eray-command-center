"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFinanceExportData } from "@/services/finance-service";

export function FinanceExportButton({ onError }: { onError: (message: string) => void }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await getFinanceExportData();
      if (result.error || !result.data) {
        onError(result.error ?? "Finans verisi dışa aktarılamadı.");
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `eray-finance-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      onError("Finans verisi dışa aktarılamadı. Lütfen tekrar dene.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button disabled={isExporting} onClick={() => void handleExport()} variant="secondary">
      {isExporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      Dışa Aktar
    </Button>
  );
}
