import type {
  DashboardPreferences,
  DashboardWidgetId,
  DashboardWidgetPriority,
} from "@/types";

export interface DashboardWidgetDefinition {
  description: string;
  id: DashboardWidgetId;
  label: string;
  order: number;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: "command_summary",
    label: "Komuta Özeti",
    description: "Günün görev, plan ve finans durumunu tek bakışta gösterir.",
    order: 0,
  },
  {
    id: "overview_stats",
    label: "Günlük İstatistikler",
    description: "Not, görev ve çalışma modu sayılarını gösterir.",
    order: 1,
  },
  {
    id: "priority_finance",
    label: "Öncelikler ve Finans",
    description: "Önemli işleri ve finans radarını birlikte gösterir.",
    order: 2,
  },
  {
    id: "daily_flow",
    label: "Bugünkü Plan ve Hızlı Kayıt",
    description: "Takvim akışını ve hızlı not alanını gösterir.",
    order: 3,
  },
  {
    id: "daily_journal",
    label: "Günün Özeti",
    description: "Günün özetini AI ile hızlıca hazırlama kısayolunu gösterir.",
    order: 4,
  },
  {
    id: "notifications",
    label: "Bildirimler",
    description: "Önemli görev, takvim ve finans uyarılarını gösterir.",
    order: 5,
  },
  {
    id: "quick_actions",
    label: "Hızlı İşlemler",
    description: "Sık kullanılan oluşturma ve geçiş kısayollarını gösterir.",
    order: 6,
  },
  {
    id: "activity",
    label: "Notlar, Görevler ve Raporlar",
    description: "Son kayıtları ve açık işleri özetler.",
    order: 7,
  },
  {
    id: "focus_tools",
    label: "Odak ve AI Araçları",
    description: "Sabitlenen notu ve hızlı AI komutlarını gösterir.",
    order: 8,
  },
];

export const DEFAULT_DASHBOARD_PREFERENCES =
  DASHBOARD_WIDGETS.reduce<DashboardPreferences>((preferences, widget) => {
    preferences[widget.id] = {
      priority:
        widget.id === "command_summary" || widget.id === "priority_finance"
          ? "top"
          : widget.id === "activity" || widget.id === "focus_tools"
            ? "bottom"
            : "normal",
      visible: true,
    };
    return preferences;
  }, {} as DashboardPreferences);

const priorities: DashboardWidgetPriority[] = ["top", "normal", "bottom"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeDashboardPreferences(
  value: unknown,
): DashboardPreferences {
  const source = isRecord(value) ? value : {};

  return DASHBOARD_WIDGETS.reduce<DashboardPreferences>(
    (preferences, widget) => {
      const rawCandidate = source[widget.id];
      const candidate = isRecord(rawCandidate) ? rawCandidate : {};
      const defaultValue = DEFAULT_DASHBOARD_PREFERENCES[widget.id];
      preferences[widget.id] = {
        visible:
          typeof candidate.visible === "boolean"
            ? candidate.visible
            : defaultValue.visible,
        priority: priorities.includes(
          candidate.priority as DashboardWidgetPriority,
        )
          ? (candidate.priority as DashboardWidgetPriority)
          : defaultValue.priority,
      };
      return preferences;
    },
    {} as DashboardPreferences,
  );
}

export function getDashboardWidgetOrder(
  widgetId: DashboardWidgetId,
  preferences: DashboardPreferences,
): number {
  const baseOrder =
    DASHBOARD_WIDGETS.find((widget) => widget.id === widgetId)?.order ?? 0;
  const priorityOffset = {
    top: 0,
    normal: 100,
    bottom: 200,
  }[preferences[widgetId].priority];

  return priorityOffset + baseOrder;
}
