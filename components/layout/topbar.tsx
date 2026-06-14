"use client";

import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useSettings } from "@/components/providers/settings-provider";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { buttonClassName } from "@/components/ui/button";
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
  const { settings, t } = useSettings();
  const { openPalette } = useCommandPalette();
  const avatarLetter = userEmail.charAt(0).toLocaleUpperCase("tr-TR") || "E";

  return (
    <header className="app-topbar app-topbar-safe sticky top-0 z-30 flex items-center justify-between border-b px-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Menüyü aç"
          className="app-control flex size-9 shrink-0 items-center justify-center rounded-lg border transition lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div className="relative hidden sm:block">
          <span className="sr-only">Ara veya komut çalıştır</span>
          <Search className="app-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <button
            className="app-input flex h-10 w-56 items-center rounded-lg border pl-9 pr-16 text-left text-sm outline-none transition lg:w-80"
            onClick={openPalette}
            type="button"
          >
            <span className="truncate app-muted">
              Ara veya komut çalıştır...
            </span>
          </button>
          <span className="app-kbd absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[9px] font-medium">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          aria-label="Arama paletini aç"
          className="app-control flex size-9 items-center justify-center rounded-lg border transition sm:hidden"
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
        <div className="hidden sm:block">
          <Link
            className={buttonClassName({ size: "sm", variant: "secondary" })}
            href="/notes?quick=1"
          >
            Hızlı Kayıt
          </Link>
        </div>
        <div className="hidden sm:block">
          <Link
            className={buttonClassName({ size: "sm" })}
            href="/notes?new=1"
          >
            <Plus className="size-4" />
            {t("topbar.newNote")}
          </Link>
        </div>
        <div className="app-border ml-1 flex items-center gap-2 border-l pl-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-bold text-white ring-2 ring-white/[0.08]">
            {avatarLetter}
          </div>
          <div className="hidden max-w-44 xl:block">
            <p className="app-text text-xs font-semibold">
              {settings.display_name || "Eray"}
            </p>
            <p className="app-muted truncate text-[10px]">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
