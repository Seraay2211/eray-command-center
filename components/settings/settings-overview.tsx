"use client";

import {
  Bell,
  Database,
  Eye,
  LayoutDashboard,
  ShieldHalf,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AccountCenterData, UserSettings } from "@/types";

interface SettingsOverviewProps {
  accountData: AccountCenterData;
  activeTheme: string;
  onOpenTab: (tabId: string) => void;
  settings: UserSettings;
}

const overviewCards = [
  {
    action: "Hesap merkezine git",
    icon: UserRound,
    id: "account",
    label: "Hesap Durumu",
  },
  {
    action: "Görünümü düzenle",
    icon: Eye,
    id: "appearance",
    label: "Aktif Tema",
  },
  {
    action: "Gizlilik ayarlarını aç",
    icon: ShieldHalf,
    id: "account",
    label: "Gizlilik Modu",
  },
  {
    action: "Dashboard’u düzenle",
    icon: LayoutDashboard,
    id: "dashboard",
    label: "Dashboard Düzeni",
  },
  {
    action: "Yedeklemeye git",
    icon: Database,
    id: "data",
    label: "Veri ve Yedekleme",
  },
  {
    action: "Bildirimleri yönet",
    icon: Bell,
    id: "notifications",
    label: "Bildirimler",
  },
] as const;

export function SettingsOverview({
  accountData,
  activeTheme,
  onOpenTab,
  settings,
}: SettingsOverviewProps) {
  const privacyEnabled = Boolean(
    settings.appearance_preferences?.hide_sensitive_amounts,
  );
  const totalRecords =
    accountData.counts.noteCount +
    accountData.counts.taskCount +
    accountData.counts.financeCount +
    accountData.counts.calendarCount +
    accountData.counts.reportCount;

  function getCardValue(id: (typeof overviewCards)[number]["id"], label: string) {
    if (label === "Hesap Durumu") return "Aktif hesap";
    if (label === "Aktif Tema") return activeTheme;
    if (label === "Gizlilik Modu") return privacyEnabled ? "Aktif" : "Kapalı";
    if (label === "Dashboard Düzeni") {
      return settings.dashboard_preferences ? "Kişiselleştirildi" : "Varsayılan";
    }
    if (label === "Veri ve Yedekleme") return `${totalRecords} kayıt`;
    if (label === "Bildirimler") {
      return settings.notifications_enabled ? "Açık" : "Kapalı";
    }
    return id;
  }

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_68%)] blur-3xl" />
        <div className="relative">
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
            Ayarlar Genel Bakış
          </p>
          <h2 className="app-text mt-2 text-2xl font-semibold tracking-[-0.035em]">
            Kontrol merkezini sakin ve düzenli tut.
          </h2>
          <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
            Hesap, görünüm, veri ve çalışma tercihlerini tek merkezden yönet.
            En sık kullanılan alanlara buradan hızlıca geçebilirsin.
          </p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {overviewCards.map((item) => {
          const Icon = item.icon;
          const value = getCardValue(item.id, item.label);
          const isPrimary =
            item.label === "Hesap Durumu" || item.label === "Gizlilik Modu";

          return (
            <button
              className="app-card group min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_42%,var(--border))] hover:shadow-xl hover:shadow-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
              key={item.label}
              onClick={() => onOpenTab(item.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                    isPrimary ? "app-primary-bg" : "app-surface-2 app-primary border",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="app-surface-2 app-muted rounded-full border px-2.5 py-1 text-[10px] font-medium">
                  Yönet
                </span>
              </div>
              <p className="app-muted mt-4 text-[10px] font-medium uppercase tracking-[0.14em]">
                {item.label}
              </p>
              <p className="app-text mt-1 truncate text-base font-semibold">
                {value}
              </p>
              <p className="app-primary mt-4 text-xs font-semibold">
                {item.action}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
