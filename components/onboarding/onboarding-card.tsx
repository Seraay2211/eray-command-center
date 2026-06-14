"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  ListPlus,
  LoaderCircle,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    description:
      "Notlarını, görevlerini, takvimini ve finans kayıtlarını tek yerden yönetebilirsin.",
    icon: LayoutDashboard,
    title: "Eray Command Center’a hoş geldin",
  },
  {
    description:
      "Not ekleyebilir, görev planlayabilir veya borç ve ödeme takibini başlatabilirsin.",
    icon: ListPlus,
    title: "İlk kayıtlarını oluştur",
  },
  {
    description:
      "Tarayıcı menüsünden “Ana ekrana ekle” seçeneğiyle paneli telefonunda uygulama gibi açabilirsin.",
    icon: Smartphone,
    title: "Mobilde uygulama gibi kullan",
  },
] as const;

export function OnboardingCard() {
  const { settings, updateSettings } = useSettings();
  const [stepIndex, setStepIndex] = useState(0);
  const [isDeferred, setIsDeferred] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  if (settings.onboarding_completed || isDeferred) {
    return null;
  }

  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === steps.length - 1;

  async function completeOnboarding() {
    setIsPending(true);
    setError("");
    const nextError = await updateSettings({ onboarding_completed: true });
    setIsPending(false);

    if (nextError) {
      setError(nextError);
    }
  }

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-lg">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                Hızlı Başlangıç
              </span>
              <span className="app-surface-2 app-muted rounded-full border px-2 py-0.5 text-[10px] app-border">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>
            <h2 className="app-text mt-2 text-lg font-semibold">
              {step.title}
            </h2>
            <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
              {step.description}
            </p>
            <div className="mt-4 flex gap-1.5" aria-label="Onboarding ilerlemesi">
              {steps.map((item, index) => (
                <span
                  className={`h-1.5 rounded-full transition-all ${
                    index === stepIndex
                      ? "w-8 bg-[var(--primary)]"
                      : "w-3 bg-[var(--border)]"
                  }`}
                  key={item.title}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:justify-end">
          <Button
            disabled={isPending}
            onClick={() => setIsDeferred(true)}
            variant="ghost"
          >
            Daha sonra
          </Button>
          {stepIndex === 0 ? (
            <Button onClick={() => setStepIndex(1)}>
              <Sparkles className="size-4" />
              Başla
            </Button>
          ) : isLastStep ? (
            <Button
              disabled={isPending}
              onClick={() => void completeOnboarding()}
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Tamamla
            </Button>
          ) : (
            <Button onClick={() => setStepIndex((current) => current + 1)}>
              Sonraki
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {error ? (
        <p className="relative mt-4 text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
