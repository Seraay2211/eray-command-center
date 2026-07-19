"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GlobalErrorProps {
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <main className="app-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg p-6 text-center sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface))] text-[var(--danger)]">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="app-text mt-5 text-xl font-semibold">
          Bir şeyler ters gitti.
        </h1>
        <p className="app-muted mx-auto mt-2 max-w-sm text-sm leading-6">
          İşlem tamamlanamadı. Sayfayı yeniden deneyebilir veya ana ekrana
          dönebilirsin.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="size-4" />
            Tekrar dene
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/";
            }}
            variant="secondary"
          >
            Ana sayfaya dön
          </Button>
        </div>
      </Card>
    </main>
  );
}
