"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import {
  getDashboardWidgetOrder,
  normalizeDashboardPreferences,
} from "@/lib/settings/dashboard-preferences";
import type { DashboardWidgetId } from "@/types";

interface DashboardWidgetSectionProps {
  children: ReactNode;
  widgetId: DashboardWidgetId;
}

export function DashboardWidgetSection({
  children,
  widgetId,
}: DashboardWidgetSectionProps) {
  const { settings } = useSettings();
  const preferences = normalizeDashboardPreferences(
    settings.dashboard_preferences,
  );

  if (!preferences[widgetId].visible) return null;

  const style: CSSProperties = {
    order: getDashboardWidgetOrder(widgetId, preferences),
  };

  return (
    <div className="min-w-0" style={style}>
      {children}
    </div>
  );
}
