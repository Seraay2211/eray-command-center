"use client";

import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PanelErrorProps {
  reset: () => void;
}

export default function PanelError({ reset }: PanelErrorProps) {
  const router = useRouter();

  return (
    <Card className="mx-auto my-10 max-w-xl p-6 text-center sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface))] text-[var(--danger)]">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="app-text mt-5 text-xl font-semibold">
        Bu bölüm yüklenemedi.
      </h1>
      <p className="app-muted mx-auto mt-2 max-w-sm text-sm leading-6">
        Veriler alınırken geçici bir sorun oluştu. Tekrar deneyebilir veya
        Dashboard&apos;a dönebilirsin.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          Tekrar dene
        </Button>
        <Button onClick={() => router.push("/dashboard")} variant="secondary">
          <LayoutDashboard className="size-4" />
          Dashboard&apos;a dön
        </Button>
      </div>
    </Card>
  );
}
