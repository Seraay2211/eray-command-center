"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useSettings } from "@/components/providers/settings-provider";
import { navItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { settings, t } = useSettings();
  const isCollapsed = settings.sidebar_mode === "collapsed";
  const navLabels: Record<string, string> = {
    "/dashboard": t("nav.dashboard"),
    "/today": "Bugün",
    "/notes": t("nav.notes"),
    "/tasks": t("nav.tasks"),
    "/calendar": t("nav.calendar"),
    "/finance": "Finans",
    "/reports": t("nav.reports"),
    "/templates": "Şablonlar",
    "/taxonomy": "Düzen",
    "/ai": t("nav.ai"),
    "/settings": t("nav.settings"),
  };

  return (
    <>
      <button
        aria-label="Menüyü kapat"
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-modal={isOpen ? true : undefined}
        className={cn(
          "app-sidebar app-sidebar-safe fixed inset-y-0 left-0 z-50 flex w-68 max-w-[calc(100vw-2rem)] flex-col border-r px-3 shadow-2xl backdrop-blur-xl transition-[transform,width] duration-300 lg:translate-x-0 lg:shadow-none",
          isCollapsed && "lg:w-20",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role={isOpen ? "dialog" : undefined}
      >
        <div
          className={cn(
            "flex h-14 items-center justify-between px-2",
            isCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Link
            className={cn("flex items-center gap-3", isCollapsed && "lg:gap-0")}
            href="/dashboard"
            onClick={onClose}
            title={isCollapsed ? "Eray Command Center" : undefined}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-[0_0_28px_rgba(139,92,246,0.25)]">
              <Command className="size-5" strokeWidth={2.2} />
            </span>
            <span className={cn(isCollapsed && "lg:hidden")}>
              <span className="app-text block text-sm font-semibold tracking-tight">
                Eray Command
              </span>
              <span className="app-muted block text-[10px] font-medium uppercase tracking-[0.22em]">
                Center
              </span>
            </span>
          </Link>
          <button
            aria-label="Menüyü kapat"
            className="app-button-ghost flex size-9 items-center justify-center rounded-lg transition lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Ana menü" className="mt-7 flex-1">
          <p
            className={cn(
              "app-muted mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em]",
              isCollapsed && "lg:hidden",
            )}
          >
            {t("nav.workspace")}
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const label = navLabels[item.href] ?? item.label;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "app-nav-row group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all",
                    isCollapsed && "lg:justify-center lg:px-0",
                    isActive
                      ? "app-nav-link-active"
                      : "app-nav-link-inactive",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onClose}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon
                    className={cn(
                      "size-[17px] shrink-0 transition-colors",
                      isActive ? "app-primary" : "app-nav-icon",
                    )}
                  />
                  <span className={cn(isCollapsed && "lg:hidden")}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <LogoutButton compact={isCollapsed} onLogout={onClose} />
      </aside>
    </>
  );
}
