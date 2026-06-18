"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Sparkles,
  X,
} from "lucide-react";
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
    label: "İlk borç kaydını ekle",
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
    href: "/settings?tab=appearance",
    key: "hasDashboardPreferences",
    label: "Dashboard düzenini kişiselleştir",
  },
  {
    href: "/settings?tab=appearance",
    key: "hasThemeChoice",
    label: "Tema görünümünü seç",
  },
  {
    href: "/settings?tab=data",
    key: "dataBackup",
    label: "Veri yedekleme alanını kontrol et",
  },
] as const;

const launchReadinessStorageKey = "ecc-launch-readiness-hidden-v23-1";
const launchReadinessStorageEvent = "ecc-launch-readiness-storage";

function subscribeToLaunchReadiness(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(launchReadinessStorageEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(launchReadinessStorageEvent, callback);
  };
}

function getLaunchReadinessSnapshot() {
  return localStorage.getItem(launchReadinessStorageKey) === "1";
}

function getLaunchReadinessServerSnapshot() {
  return false;
}

function isChecklistItemDone(
  item: (typeof checklistItems)[number],
  checklist: OnboardingChecklistState,
) {
  if (item.key === "dataBackup") {
    return false;
  }

  return Boolean(checklist[item.key]);
}

export function OnboardingCard({ checklist }: OnboardingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHidden = useSyncExternalStore(
    subscribeToLaunchReadiness,
    getLaunchReadinessSnapshot,
    getLaunchReadinessServerSnapshot,
  );

  if (isHidden) {
    return null;
  }

  const completedCount = checklistItems.filter((item) =>
    isChecklistItemDone(item, checklist),
  ).length;
  const progress = Math.round((completedCount / checklistItems.length) * 100);
  const nextItem =
    checklistItems.find((item) => !isChecklistItemDone(item, checklist)) ??
    checklistItems[0];

  function hideOnboarding() {
    localStorage.setItem(launchReadinessStorageKey, "1");
    window.dispatchEvent(new Event(launchReadinessStorageEvent));
  }

  return (
    <Card className="relative overflow-hidden rounded-[1.5rem] border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] p-4 shadow-lg shadow-[color-mix(in_srgb,var(--primary)_5%,transparent)] sm:p-5">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_70%)] blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-lg">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <span className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                Başlangıç Kontrol Listesi
              </span>
              <h2 className="app-text mt-1 text-base font-semibold">
                Kurulum Hazırlığı
              </h2>
              <p className="app-muted mt-1 max-w-2xl text-xs leading-5 sm:text-sm">
                {completedCount} / {checklistItems.length} adım tamamlandı.
                <span className="app-text ml-1 font-medium">
                  Sıradaki öneri: {nextItem.label}.
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              className={buttonClassName({
                className: "w-full sm:w-auto",
                size: "sm",
                variant: "secondary",
              })}
              href={nextItem.href}
            >
              Devam Et
              <ArrowRight className="size-3.5" />
            </Link>
            <Button
              className="w-full sm:w-auto"
              onClick={() => setIsExpanded((current) => !current)}
              size="sm"
              variant="secondary"
            >
              {isExpanded ? "Detayları Gizle" : "Detayları Aç"}
              <ChevronDown
                className={`size-3.5 transition ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Button
              aria-label="Başlangıç kontrol listesini gizle"
              onClick={hideOnboarding}
              size="sm"
              variant="ghost"
            >
              <X className="size-4" />
              Gizle
            </Button>
          </div>
        </div>

        <div className="app-surface-2 app-border rounded-2xl border p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="app-text block text-xs font-semibold">
                  Hazırlık seviyesi %{progress}
                </span>
                <span className="app-muted block truncate text-[10px]">
                  Tamamlanan adımlar ve önerilen sonraki işlem.
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)] sm:w-56">
              <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,var(--primary),color-mix(in_srgb,var(--primary)_70%,var(--success)))] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {isExpanded ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {checklistItems.map((item) => {
              const isDone = isChecklistItemDone(item, checklist);
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
                        : "app-surface-2 app-muted app-border flex size-8 shrink-0 items-center justify-center rounded-full border"
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
                      {isDone ? "Hazır" : "Devam etmek için aç"}
                    </span>
                  </span>
                  <span className="app-primary ml-auto shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2 py-1 text-[10px] font-semibold">
                    Aç
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
