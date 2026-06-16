"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  LoaderCircle,
  Palette,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface OnboardingChecklistState {
  hasDashboardPreferences: boolean;
  hasFinance: boolean;
  hasNotes: boolean;
  hasTasks: boolean;
  hasThemeChoice: boolean;
}

interface OnboardingCardProps {
  checklist: OnboardingChecklistState;
}

const checklistItems = [
  {
    href: "/finance?new=1",
    key: "hasFinance",
    label: "İlk borcunu ekle",
  },
  {
    href: "/tasks?new=1",
    key: "hasTasks",
    label: "İlk görevini oluştur",
  },
  {
    href: "/notes?editor=new",
    key: "hasNotes",
    label: "İlk notunu yaz",
  },
  {
    href: "/settings",
    key: "hasDashboardPreferences",
    label: "Dashboard kartlarını düzenle",
  },
  {
    href: "/settings",
    key: "hasThemeChoice",
    label: "Görünüm temasını seç",
  },
  {
    href: "/today",
    key: "dailySummary",
    label: "Günün Özeti oluştur",
  },
] as const;

export function OnboardingCard({ checklist }: OnboardingCardProps) {
  const { settings, updateSettings } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  if (settings.onboarding_completed) {
    return null;
  }

  const completedCount = checklistItems.filter((item) =>
    item.key === "dailySummary"
      ? false
      : Boolean(checklist[item.key]),
  ).length;

  async function hideOnboarding() {
    setIsPending(true);
    setError("");
    const nextError = await updateSettings({ onboarding_completed: true });
    setIsPending(false);

    if (nextError) {
      setError("Başlangıç kartı gizlenemedi. Birazdan tekrar dene.");
    }
  }

  return (
    <Card className="relative overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-lg">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0">
              <span className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                Hızlı Başlangıç
              </span>
              <h2 className="app-text mt-2 text-lg font-semibold">
                Hoş geldin, Eray Command Center hazır.
              </h2>
              <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
                Finans, görev, not ve günlük akışını tek yerden yönetmeye
                başlayabilirsin.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() => setIsCollapsed((current) => !current)}
              variant="secondary"
            >
              {isCollapsed ? "Kontrol listesini aç" : "Küçült"}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void hideOnboarding()}
              variant="ghost"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              Gizle
            </Button>
          </div>
        </div>

        {!isCollapsed ? (
          <>
            <div className="app-surface-2 app-border rounded-2xl border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="app-text text-sm font-semibold">
                    Başlangıç Kontrol Listesi
                  </p>
                  <p className="app-muted mt-1 text-[11px]">
                    {completedCount} / {checklistItems.length} adım tamamlandı.
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)] sm:w-40">
                  <span
                    className="block h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{
                      width: `${(completedCount / checklistItems.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {checklistItems.map((item) => {
                  const isDone =
                    item.key === "dailySummary"
                      ? false
                      : Boolean(checklist[item.key]);
                  return (
                    <Link
                      className="app-card group flex min-w-0 items-center gap-3 rounded-xl border p-3 text-sm transition hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))]"
                      href={item.href}
                      key={item.label}
                    >
                      <span
                        className={
                          isDone
                            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]"
                            : "app-surface-2 app-muted flex size-8 shrink-0 items-center justify-center rounded-full border app-border"
                        }
                      >
                        {isDone ? (
                          <Check className="size-4" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="app-text block truncate font-medium">
                          {item.label}
                        </span>
                        <span className="app-muted mt-0.5 block text-[10px]">
                          {isDone ? "Tamamlandı" : "Başlamak için aç"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Link
                className={buttonClassName({
                  className: "justify-start",
                  variant: "secondary",
                })}
                href="/finance?new=1"
              >
                <WalletCards className="size-4" />
                Finans Kaydı Ekle
              </Link>
              <Link
                className={buttonClassName({
                  className: "justify-start",
                  variant: "secondary",
                })}
                href="/settings"
              >
                <Palette className="size-4" />
                Temayı Düzenle
              </Link>
              <Link
                className={buttonClassName({ className: "justify-start" })}
                href="/today"
              >
                <LayoutDashboard className="size-4" />
                Günün Özeti
              </Link>
            </div>
          </>
        ) : (
          <div className="app-surface-2 app-border flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="app-muted flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-[var(--success)]" />
              Başlangıç kartı küçültüldü. İstediğin zaman tekrar açabilirsin.
            </span>
            <Link
              className={buttonClassName({ size: "sm", variant: "secondary" })}
              href="/settings"
            >
              Ayarlara Git
            </Link>
          </div>
        )}

        {error ? (
          <p className="text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
