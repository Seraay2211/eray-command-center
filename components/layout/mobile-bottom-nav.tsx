"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare2,
  Home,
  LibraryBig,
  MoreHorizontal,
  NotebookPen,
  Settings,
  Sunrise,
  Tags,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/today", icon: Sunrise, label: "Bugün" },
  { href: "/notes", icon: NotebookPen, label: "Notlar" },
  { href: "/finance", icon: WalletCards, label: "Finans" },
];

const moreItems = [
  { href: "/tasks", icon: CheckSquare2, label: "Görevler" },
  { href: "/calendar", icon: CalendarDays, label: "Takvim" },
  { href: "/reports", icon: BarChart3, label: "Raporlar" },
  { href: "/templates", icon: LibraryBig, label: "Şablonlar" },
  { href: "/taxonomy", icon: Tags, label: "Düzen" },
  { href: "/ai", icon: Bot, label: "AI Asistan" },
  { href: "/settings", icon: Settings, label: "Ayarlar" },
  { href: "/settings?tab=account", icon: UserRound, label: "Hesap Merkezi" },
];

function isActivePath(pathname: string, href: string): boolean {
  const route = href.split("?")[0];
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpenPathname, setMoreOpenPathname] = useState<string | null>(null);
  const isMoreOpen = moreOpenPathname === pathname;
  const isPrimaryActive = primaryItems.some((item) =>
    isActivePath(pathname, item.href),
  );

  return (
    <>
      {isMoreOpen ? (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <button
            aria-label="Daha fazla menüsünü kapat"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpenPathname(null)}
            type="button"
          />
          <section
            aria-label="Daha fazla menüsü"
            aria-modal="true"
            className="mobile-bottom-sheet app-card app-border absolute inset-x-3 bottom-3 rounded-[1.75rem] border p-4 shadow-2xl"
            role="dialog"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Menü
                </p>
                <h2 className="app-text mt-1 text-base font-semibold">
                  Daha Fazla
                </h2>
              </div>
              <button
                aria-label="Daha fazla menüsünü kapat"
                className="app-button-ghost flex size-10 items-center justify-center rounded-xl"
                onClick={() => setMoreOpenPathname(null)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "app-surface-2 app-border flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-sm font-semibold transition",
                      active &&
                        "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))]",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMoreOpenPathname(null)}
                  >
                    <Icon className="app-primary size-4 shrink-0" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3">
              <LogoutButton onLogout={() => setMoreOpenPathname(null)} />
            </div>
          </section>
        </div>
      ) : null}

      <nav
        aria-label="Mobil alt menü"
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-2 pt-2 shadow-[0_-18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition",
                  active
                    ? "bg-[color-mix(in_srgb,var(--primary)_16%,var(--surface))] text-[var(--text)]"
                    : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className={cn("size-4", active && "app-primary")} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            aria-expanded={isMoreOpen}
            aria-label="Daha fazla menüsünü aç"
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition",
              !isPrimaryActive
                ? "bg-[color-mix(in_srgb,var(--primary)_16%,var(--surface))] text-[var(--text)]"
                : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
            )}
            onClick={() => setMoreOpenPathname(pathname)}
            type="button"
          >
            <MoreHorizontal
              className={cn("size-4", !isPrimaryActive && "app-primary")}
            />
            <span>Daha</span>
          </button>
        </div>
      </nav>
    </>
  );
}
