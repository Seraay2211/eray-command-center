"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DashboardErrorStateProps {
  message: string;
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  const router = useRouter();

  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger)]">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="app-text mt-5 text-xl font-semibold">
        Dashboard verileri yüklenemedi.
      </h1>
      <p className="app-muted mt-2 text-sm leading-6">{message}</p>
      <Button className="mt-5" onClick={() => router.refresh()}>
        <RefreshCw className="size-4" />
        Tekrar dene
      </Button>
    </Card>
  );
}
