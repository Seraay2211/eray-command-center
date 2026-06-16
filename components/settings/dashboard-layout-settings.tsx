"use client";

import { LayoutDashboard } from "lucide-react";
import { SegmentedControl } from "@/components/settings/segmented-control";
import {
  DASHBOARD_WIDGETS,
  normalizeDashboardPreferences,
} from "@/lib/settings/dashboard-preferences";
import type {
  DashboardPreferences,
  DashboardWidgetId,
  DashboardWidgetPriority,
  UpdateUserSettingsInput,
} from "@/types";

interface DashboardLayoutSettingsProps {
  onSave: (
    key: string,
    input: UpdateUserSettingsInput,
    successMessage?: string,
  ) => Promise<void>;
  preferences: DashboardPreferences | null;
}

const visibilityOptions = [
  { label: "Gizli", value: "hidden" },
  { label: "Göster", value: "visible" },
] as const;

const priorityOptions = [
  { label: "Üstte", value: "top" },
  { label: "Normal", value: "normal" },
  { label: "Altta", value: "bottom" },
] as const;

export function DashboardLayoutSettings({
  onSave,
  preferences,
}: DashboardLayoutSettingsProps) {
  const normalized = normalizeDashboardPreferences(preferences);

  function saveWidget(
    widgetId: DashboardWidgetId,
    nextValue: Partial<DashboardPreferences[DashboardWidgetId]>,
  ) {
    const nextPreferences: DashboardPreferences = {
      ...normalized,
      [widgetId]: {
        ...normalized[widgetId],
        ...nextValue,
      },
    };

    return onSave(
      `dashboard-${widgetId}`,
      { dashboard_preferences: nextPreferences },
      "Dashboard düzeni güncellendi.",
    );
  }

  return (
    <div className="app-surface-2 app-border min-w-0 rounded-2xl border p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="app-surface app-primary flex size-9 shrink-0 items-center justify-center rounded-xl border">
          <LayoutDashboard className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="app-text text-sm font-semibold">Dashboard Düzeni</h3>
          <p className="app-muted mt-1 text-xs leading-5">
            Komuta ekranında göreceğin bölümleri ve temel sıralarını belirle.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {DASHBOARD_WIDGETS.map((widget) => {
          const preference = normalized[widget.id];

          return (
            <div
              className="app-surface app-border grid min-w-0 gap-3 rounded-xl border p-3 lg:grid-cols-[minmax(0,1fr)_180px_250px] lg:items-center"
              key={widget.id}
            >
              <div className="min-w-0">
                <p className="app-text text-xs font-semibold">{widget.label}</p>
                <p className="app-muted mt-1 text-[10px] leading-4">
                  {widget.description}
                </p>
              </div>
              <SegmentedControl
                ariaLabel={`${widget.label} görünürlüğü`}
                className="grid-cols-2 sm:grid-cols-2"
                onChange={(value) =>
                  void saveWidget(widget.id, {
                    visible: value === "visible",
                  })
                }
                options={visibilityOptions}
                value={preference.visible ? "visible" : "hidden"}
              />
              <SegmentedControl<DashboardWidgetPriority>
                ariaLabel={`${widget.label} sırası`}
                className="grid-cols-3 sm:grid-cols-3"
                disabled={!preference.visible}
                onChange={(priority) =>
                  void saveWidget(widget.id, { priority })
                }
                options={priorityOptions}
                value={preference.priority}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
