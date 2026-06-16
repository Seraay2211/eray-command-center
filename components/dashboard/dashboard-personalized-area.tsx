"use client";

import type { ReactNode } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { normalizeDashboardPreferences } from "@/lib/settings/dashboard-preferences";

interface DashboardPersonalizedAreaProps {
  children: ReactNode;
}

export function DashboardPersonalizedArea({
  children,
}: DashboardPersonalizedAreaProps) {
  const { settings } = useSettings();
  const preferences = normalizeDashboardPreferences(
    settings.dashboard_preferences,
  );
  const hasVisibleWidget = Object.values(preferences).some(
    (preference) => preference.visible,
  );

  if (!hasVisibleWidget) {
    return (
      <div className="app-card rounded-2xl border border-dashed p-6 text-center">
        <p className="app-text text-sm font-semibold">
          Dashboard için en az bir kart seçebilirsin.
        </p>
        <p className="app-muted mt-2 text-xs leading-5">
          Görünüm Merkezi içinden kullanmak istediğin bölümleri tekrar
          gösterebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">{children}</div>
  );
}
