"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { useSettings } from "@/components/providers/settings-provider";
import { CommandPaletteProvider } from "@/components/search/command-palette";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";
import {
  getAppFontStack,
  normalizeAppFontFamily,
} from "@/lib/settings/fonts";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

interface AppShellProps {
  children: ReactNode;
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
  userEmail: string;
}

export function AppShell({
  children,
  initialNotifications,
  initialUnreadCount,
  userEmail,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { isStandalone } = useStandaloneMode();
  const isCollapsed = settings.sidebar_mode === "collapsed";
  const selectedFont = normalizeAppFontFamily(settings.font_family);
  const shellStyle = useMemo(
    () =>
      ({
        "--app-font-family": getAppFontStack(selectedFont),
      }) as CSSProperties,
    [selectedFont],
  );

  useEffect(() => {
    if (!isSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    document.documentElement.dataset.pwaStandalone = isStandalone
      ? "true"
      : "false";

    return () => {
      delete document.documentElement.dataset.pwaStandalone;
    };
  }, [isStandalone]);

  return (
    <CommandPaletteProvider>
      <div
        className="app-shell min-h-screen"
        data-font={selectedFont}
        data-standalone={isStandalone ? "true" : "false"}
        style={shellStyle}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div
          className={cn(
            "min-h-screen transition-[padding] duration-300",
            isCollapsed ? "lg:pl-20" : "lg:pl-68",
          )}
        >
          <Topbar
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
            onMenuClick={() => setIsSidebarOpen(true)}
            userEmail={userEmail}
          />
          <OfflineBanner />
          <main className="app-main app-main-safe app-mobile-main-safe mx-auto min-w-0 w-full max-w-[1600px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </CommandPaletteProvider>
  );
}
