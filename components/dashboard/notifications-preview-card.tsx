"use client";

import Link from "next/link";
import { ArrowRight, Bell, BellRing } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppNotification } from "@/types/notifications";

interface NotificationsPreviewCardProps {
  notifications: AppNotification[];
}

const sourceLabels: Record<string, string> = {
  ai: "AI",
  calendar: "Takvim",
  finance: "Finans",
  note: "Not",
  report: "Rapor",
  system: "Sistem",
  task: "Görev",
};

function getPriorityLabel(priority: AppNotification["priority"]): string {
  if (priority === "critical") return "Kritik";
  if (priority === "high") return "Önemli";
  return "Normal";
}

export function NotificationsPreviewCard({
  notifications,
}: NotificationsPreviewCardProps) {
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <Card className="h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
            <BellRing className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              Bildirim Merkezi
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">
              Dikkat Edilecekler
            </h2>
          </div>
        </div>
        <span className="app-surface-2 app-muted rounded-full border px-2.5 py-1 text-[10px]">
          {notifications.length} kayıt
        </span>
      </div>

      {visibleNotifications.length > 0 ? (
        <div className="mt-4 space-y-2">
          {visibleNotifications.map((notification) => (
            <Link
              className="app-surface-2 block rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
              href={notification.action_url ?? "/dashboard"}
              key={notification.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-primary text-[9px] font-semibold uppercase tracking-[0.12em]">
                  {sourceLabels[notification.source ?? "system"] ?? "Sistem"}
                </span>
                <span className="app-muted text-[9px]">·</span>
                <span className="app-muted text-[9px]">
                  {getPriorityLabel(notification.priority)}
                </span>
              </div>
              <p className="app-text mt-2 line-clamp-1 text-xs font-semibold">
                {notification.title}
              </p>
              <p className="app-muted mt-1 line-clamp-2 text-[11px] leading-5">
                {notification.message}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="app-surface-2 mt-4 rounded-xl border border-dashed p-5 text-center">
          <Bell className="app-muted mx-auto size-5" />
          <p className="app-text mt-3 text-sm font-semibold">
            Şu an önemli bildirim yok
          </p>
          <p className="app-muted mt-1 text-xs leading-5">
            Görev, takvim veya finans uyarıları oluştuğunda burada görünür.
          </p>
        </div>
      )}

      <button
        className={`${buttonClassName({
          className: "mt-4 w-full justify-between",
          variant: "secondary",
        })}`}
        onClick={() => {
          window.dispatchEvent(new Event("ecc:open-notifications"));
        }}
        type="button"
      >
        Bildirimleri Aç
        <ArrowRight className="size-3.5" />
      </button>
    </Card>
  );
}
