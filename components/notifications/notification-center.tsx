"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/providers/settings-provider";
import { isPrivacyModeEnabled, MASKED_TRY_VALUE } from "@/lib/privacy";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notifications-service";
import type {
  AppNotification,
  NotificationPriority,
} from "@/types/notifications";

const priorityLabels: Record<NotificationPriority, string> = {
  low: "Normal",
  medium: "Normal",
  high: "Önemli",
  critical: "Kritik",
};

const sourceLabels: Record<string, string> = {
  finance: "Finans",
  task: "Görev",
  calendar: "Takvim",
  note: "Not",
  report: "Rapor",
  ai: "AI",
  system: "Sistem",
};

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsed >= 0 && elapsed < minute) return "Şimdi";
  if (elapsed >= minute && elapsed < hour) {
    return `${Math.floor(elapsed / minute)} dakika önce`;
  }
  if (elapsed >= hour && elapsed < day) {
    return `${Math.floor(elapsed / hour)} saat önce`;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function priorityClass(
  priority: NotificationPriority,
  highlightCritical: boolean,
): string {
  if (priority === "critical" && highlightCritical) {
    return "border-[color-mix(in_srgb,var(--primary)_60%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_18%,var(--surface))] app-text";
  }
  if (priority === "high") {
    return "border-[color-mix(in_srgb,var(--primary)_42%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] app-text";
  }
  return "app-border app-surface-2 app-muted";
}

function maskSensitiveNotificationText(value: string): string {
  return value
    .replace(/₺\s?[\d.,]+/g, MASKED_TRY_VALUE)
    .replace(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, MASKED_TRY_VALUE);
}

function isDynamicNotification(notification: AppNotification): boolean {
  return notification.metadata?.dynamic === true;
}

interface NotificationCenterProps {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
}

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const router = useRouter();
  const { settings } = useSettings();
  const shouldMaskSensitiveText = isPrivacyModeEnabled(settings);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications,
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const markableUnreadCount = notifications.filter(
    (notification) =>
      !notification.is_read && !isDynamicNotification(notification),
  ).length;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [notificationsResult, countResult] = await Promise.all([
        getNotifications(30),
        getUnreadNotificationCount(),
      ]);

      if (
        notificationsResult.error ||
        countResult.error ||
        !notificationsResult.data
      ) {
        setError("Bildirimler alınamadı.");
        return;
      }

      setNotifications(notificationsResult.data);
      setUnreadCount(countResult.data ?? 0);
    } catch {
      setError("Bildirimler alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    function openNotificationPanel() {
      setIsOpen(true);
      void refresh();
    }

    window.addEventListener("ecc:open-notifications", openNotificationPanel);
    return () => {
      window.removeEventListener(
        "ecc:open-notifications",
        openNotificationPanel,
      );
    };
  }, [refresh]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [isOpen]);

  async function markAsRead(notification: AppNotification) {
    if (notification.is_read) return;

    setActionId(notification.id);
    setError("");
    try {
      const result = await markNotificationAsRead(notification.id);
      if (result.error) {
        setError("Bildirim okundu olarak işaretlenemedi.");
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch {
      setError("Bildirim okundu olarak işaretlenemedi.");
    } finally {
      setActionId("");
    }
  }

  async function markAllAsRead() {
    if (markableUnreadCount === 0) return;

    setIsMarkingAll(true);
    setError("");
    try {
      const result = await markAllNotificationsAsRead();
      if (result.error) {
        setError("Bildirimler güncellenemedi.");
        return;
      }

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) =>
          isDynamicNotification(item)
            ? item
            : {
                ...item,
                is_read: true,
                read_at: item.read_at ?? readAt,
              },
        ),
      );
      setUnreadCount((current) =>
        Math.max(current - (result.data?.count ?? markableUnreadCount), 0),
      );
    } catch {
      setError("Bildirimler güncellenemedi.");
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function removeNotification(notification: AppNotification) {
    setActionId(notification.id);
    setError("");
    try {
      const result = await deleteNotification(notification.id);
      if (result.error) {
        setError("Bildirim silinemedi.");
        return;
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );
      if (!notification.is_read) {
        setUnreadCount((current) => Math.max(current - 1, 0));
      }
    } catch {
      setError("Bildirim silinemedi.");
    } finally {
      setActionId("");
    }
  }

  async function openNotification(notification: AppNotification) {
    setActionId(notification.id);
    try {
      if (!notification.is_read && !isDynamicNotification(notification)) {
        await markNotificationAsRead(notification.id);
      }
    } finally {
      setActionId("");
      setIsOpen(false);
      if (notification.action_url) router.push(notification.action_url);
    }
  }

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        aria-controls="notification-panel"
        aria-expanded={isOpen}
        aria-label="Bildirimler"
        className="app-button-ghost relative flex size-9 items-center justify-center rounded-lg transition"
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) void refresh();
        }}
        type="button"
      >
        {unreadCount > 0 ? (
          <BellRing className="size-[18px]" />
        ) : (
          <Bell className="size-[18px]" />
        )}
        {unreadCount > 0 ? (
          <span className="app-primary-bg absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-4">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          aria-label="Bildirim paneli"
          className="notification-panel app-card fixed left-3 right-3 top-20 z-[120] max-h-[calc(100vh-6rem)] w-auto overflow-hidden rounded-2xl border shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12"
          id="notification-panel"
        >
          <div className="app-border flex items-center justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <h2 className="app-text text-sm font-semibold">Bildirimler</h2>
              <p className="notification-copy app-muted mt-1 text-[10px] leading-4">
                {unreadCount > 0
                  ? `${unreadCount} okunmamış bildirim`
                  : "Güncel görev, finans ve plan hatırlatmaların."}
              </p>
            </div>
            <button
              aria-label="Bildirim panelini kapat"
              className="app-button-ghost flex size-8 items-center justify-center rounded-lg"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="app-border flex flex-wrap gap-2 border-b px-4 py-3">
            <Button
              disabled={isLoading || isMarkingAll || markableUnreadCount === 0}
              onClick={() => void markAllAsRead()}
              size="sm"
              variant="secondary"
            >
              {isMarkingAll ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              Tümünü Okundu Yap
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => void refresh()}
              size="sm"
              variant="ghost"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Yenile
            </Button>
          </div>

          <div className="notification-scroll max-h-[min(620px,calc(100vh-13rem))] overflow-y-auto p-3">
            {isLoading ? (
              <div className="app-muted flex items-center justify-center gap-2 py-12 text-xs">
                <LoaderCircle className="size-4 animate-spin" />
                Bildirimler yükleniyor...
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="app-surface-2 app-muted rounded-xl border p-5 text-center text-xs">
                <p>Bildirimler alınamadı.</p>
                <Button
                  className="mt-3"
                  onClick={() => void refresh()}
                  size="sm"
                  variant="secondary"
                >
                  Tekrar Dene
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="app-surface-2 rounded-xl border border-dashed p-8 text-center">
                <Bell className="app-muted mx-auto size-5" />
                <p className="app-text mt-3 text-sm font-semibold">
                  Bildirim yok
                </p>
                <p className="app-muted mt-1 text-xs">
                  Şu anda dikkat etmen gereken yeni bir bildirim bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {error ? (
                  <p
                    className="app-surface-2 app-text rounded-xl border p-3 text-xs"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                {notifications.map((notification) => (
                  (() => {
                    const isDynamic = isDynamicNotification(notification);
                    const sourceLabel =
                      sourceLabels[notification.source ?? "system"] ??
                      "Sistem";
                    return (
                  <article
                    className={`min-w-0 rounded-xl border p-3 transition ${
                      notification.is_read
                        ? "app-surface"
                        : "border-[color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_7%,var(--surface))]"
                    }`}
                    key={notification.id}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          notification.is_read
                            ? "bg-[var(--border)]"
                            : "bg-[var(--primary)]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="app-surface-2 app-muted rounded-md border px-1.5 py-0.5 text-[9px] font-semibold">
                            {sourceLabel}
                          </span>
                          <h3 className="notification-copy app-text min-w-0 flex-1 text-xs font-semibold leading-5">
                            {shouldMaskSensitiveText
                              ? maskSensitiveNotificationText(
                                  notification.title,
                                )
                              : notification.title}
                          </h3>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${priorityClass(notification.priority, settings.highlight_critical_alerts)}`}
                          >
                            {priorityLabels[notification.priority]}
                          </span>
                        </div>
                        <p className="notification-copy app-muted mt-1.5 text-[11px] leading-5">
                          {shouldMaskSensitiveText
                            ? maskSensitiveNotificationText(
                                notification.message,
                              )
                            : notification.message}
                        </p>
                        <div className="notification-meta app-muted mt-2 flex flex-wrap items-center gap-2 text-[9px]">
                          <time dateTime={notification.created_at}>
                            {formatNotificationDate(notification.created_at)}
                          </time>
                          {isDynamic ? <span>Aktif hatırlatma</span> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {notification.action_url ? (
                            <Button
                              disabled={actionId === notification.id}
                              onClick={() =>
                                void openNotification(notification)
                              }
                              size="sm"
                            >
                              {actionId === notification.id ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              İncele
                            </Button>
                          ) : null}
                          {!notification.is_read ? (
                            isDynamic ? null : (
                            <Button
                              disabled={actionId === notification.id}
                              onClick={() => void markAsRead(notification)}
                              size="sm"
                              variant="secondary"
                            >
                              <Check className="size-3.5" />
                              Okundu Yap
                            </Button>
                            )
                          ) : null}
                          {!isDynamic ? (
                            <Button
                              disabled={actionId === notification.id}
                              onClick={() =>
                                void removeNotification(notification)
                              }
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="size-3.5" />
                              Sil
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                    );
                  })()
                ))}
              </div>
            )}
          </div>

          <div className="app-border app-muted border-t px-4 py-3 text-[10px] leading-4">
            Bildirimler görev, finans ve takvim hatırlatmalarından oluşur.
          </div>
        </section>
      ) : null}
    </div>
  );
}
