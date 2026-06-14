import { Badge } from "@/components/ui/badge";
import { REPORT_TYPE_LABELS } from "@/lib/reports";
import type { ReportType } from "@/types";

interface ReportTypeBadgeProps {
  reportType: ReportType;
}

const variants: Record<
  ReportType,
  "default" | "violet" | "green" | "amber"
> = {
  daily: "green",
  weekly: "violet",
  operation: "default",
  manager: "violet",
  finance: "amber",
  custom: "default",
};

export function ReportTypeBadge({ reportType }: ReportTypeBadgeProps) {
  return (
    <Badge variant={variants[reportType]}>
      {REPORT_TYPE_LABELS[reportType]}
    </Badge>
  );
}
