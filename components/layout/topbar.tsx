"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Database,
  Eye,
  Menu,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useSettings } from "@/components/providers/settings-provider";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { buttonClassName } from "@/components/ui/button";
import { DEFAULT_APPEARANCE_PREFERENCES } from "@/lib/settings/appearance-preferences";
import type { AppNotification } from "@/types/notifications";

interface TopbarProps {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
  onMenuClick: () => void;
  userEmail: string;
}

export function Topbar({
  initialNotifications,
  initialUnreadCount,
  onMenuClick,
  userEmail,
}: TopbarProps) {
  const { settings, t, updateSettings } = useSettings();
  const { openPalette } = useCommandPalette();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  const avatarLetter = userEmail.charAt(0).toLocaleUpperCase("tr-TR") || "E";
  const isPrivacyMode = Boolean(
    settings.appearance_preferences?.hide_sensitive_amounts,
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isProfileOpen]);

  async function handlePrivacyToggle() {
    setIsPrivacySaving(true);
    setProfileError("");

    const nextError = await updateSettings({
      appearance_preferences: {
        ...DEFAULT_APPEARANCE_PREFERENCES,
        ...(settings.appearance_preferences ?? {}),
        hide_sensitive_amounts: !isPrivacyMode,
      },
    });

    setIsPrivacySaving(false);

    if (nextError) {
      setProfileError("Gizlilik modu kaydedilemedi. Birazdan tekrar dene.");
    }
  }

  return (
    <header className="app-topbar app-topbar-safe sticky top-0 z-30 flex items-center justify-between border-b px-3 shadow-[0_10px_34px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Menüyü aç"
          className="app-control flex size-10 shrink-0 items-center justify-center rounded-xl border transition lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div className="relative hidden sm:block">
          <span className="sr-only">Ara veya komut çalıştır</span>
          <Search className="app-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <button
            className="app-input flex h-10 w-56 items-center rounded-xl border bg-[color-mix(in_srgb,var(--surface-2)_74%,transparent)] pl-9 pr-16 text-left text-xs outline-none transition hover:border-[color-mix(in_srgb,var(--primary)_34%,var(--border))] lg:w-72 xl:w-[22rem]"
            onClick={openPalette}
            type="button"
          >
            <span className="app-muted truncate">Ara veya komut çalıştır...</span>
          </button>
          <span className="app-kbd absolute right-2.5 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[9px] font-medium">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <button
          aria-label="Arama paletini aç"
          className="app-control flex size-10 items-center justify-center rounded-xl border transition sm:hidden"
          onClick={openPalette}
          type="button"
        >
          <Search className="size-4" />
        </button>
        {settings.notifications_enabled ? (
          <NotificationCenter
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
          />
        ) : null}
        <Link
          className={`${buttonClassName({ size: "sm", variant: "secondary" })} hidden rounded-xl lg:inline-flex`}
          href="/notes?quick=1"
        >
          Hızlı Kayıt
        </Link>
        <Link
          className={`${buttonClassName({ size: "sm" })} hidden rounded-xl md:inline-flex`}
          href="/notes?new=1"
        >
          <Plus className="size-4" />
          {t("topbar.newNote")}
        </Link>
        <div
          className="app-border relative ml-1 min-w-0 border-l pl-2 sm:pl-3"
          ref={profileMenuRef}
        >
          <button
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            className="app-control flex min-w-0 items-center gap-2 rounded-2xl border px-1.5 py-1 transition hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] hover:bg-[var(--surface-2)]"
            onClick={() => setIsProfileOpen((value) => !value)}
            type="button"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-bold text-white ring-2 ring-white/[0.08] sm:size-9">
              {avatarLetter}
            </span>
            <span className="hidden min-w-0 max-w-36 text-left xl:block">
              <span className="app-text block truncate text-xs font-semibold">
                {settings.display_name || "Eray"}
              </span>
              <span
                className="app-muted block truncate text-[10px]"
                title={userEmail}
              >
                {userEmail}
              </span>
            </span>
            <ChevronDown className="app-muted hidden size-3.5 sm:block" />
          </button>

          {isProfileOpen ? (
            <div
              className="app-card absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-1.5rem))] rounded-[1.35rem] border p-3 shadow-2xl"
              role="menu"
            >
              <div className="app-surface-2 app-border rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <div className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="app-text truncate text-sm font-semibold">
                      {settings.display_name || "Eray"}
                    </p>
                    <p className="app-muted truncate text-xs" title={userEmail}>
                      {userEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 grid gap-1">
                {[
                  {
                    href: "/settings?tab=account",
                    icon: UserRound,
                    label: "Hesap Merkezi",
                  },
                  {
                    href: "/settings?tab=appearance",
                    icon: Eye,
                    label: "Görünüm Merkezi",
                  },
                  {
                    href: "/settings?tab=data",
                    icon: Database,
                    label: "Veri ve Yedekleme",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      className="app-muted flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                      href={item.href}
                      key={item.href}
                      onClick={() => setIsProfileOpen(false)}
                      role="menuitem"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <button
                  className="app-muted flex items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:cursor-wait disabled:opacity-60"
                  disabled={isPrivacySaving}
                  onClick={() => void handlePrivacyToggle()}
                  role="menuitem"
                  type="button"
                >
                  <Eye className="size-4" />
                  {isPrivacyMode
                    ? "Gizlilik Modunu Kapat"
                    : "Gizlilik Modunu Aç"}
                </button>
              </div>

              {profileError ? (
                <p className="mt-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] px-3 py-2 text-[11px] text-[var(--danger)]">
                  {profileError}
                </p>
              ) : null}

              <div className="mt-3">
                <LogoutButton onLogout={() => setIsProfileOpen(false)} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
