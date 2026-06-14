import type { DarkSelectOption } from "@/components/ui/dark-select";
import type { ReportStatus, ReportType } from "@/types";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  operation: "Operasyon",
  manager: "Yönetici",
  finance: "Finans",
  custom: "Özel",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Taslak",
  final: "Final",
  archived: "Arşiv",
};

export const REPORT_TYPE_OPTIONS: Array<
  DarkSelectOption & { value: ReportType }
> = [
  { label: "Günlük Operasyon Raporu", value: "daily" },
  { label: "Haftalık Özet", value: "weekly" },
  { label: "Operasyon Raporu", value: "operation" },
  { label: "Yönetici Raporu", value: "manager" },
  { label: "Finans / Operasyon Notu", value: "finance" },
  { label: "Özel Rapor", value: "custom" },
];

export const REPORT_STATUS_OPTIONS: Array<
  DarkSelectOption & { value: ReportStatus }
> = [
  { label: "Taslak", value: "draft" },
  { label: "Final", value: "final" },
  { label: "Arşiv", value: "archived" },
];
