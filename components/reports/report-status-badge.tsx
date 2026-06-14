import { Badge } from "@/components/ui/badge";
import { REPORT_STATUS_LABELS } from "@/lib/reports";
import type { ReportStatus } from "@/types";

interface ReportStatusBadgeProps {
  status: ReportStatus;
}

const variants: Record<
  ReportStatus,
  "default" | "green" | "amber"
> = {
  draft: "amber",
  final: "green",
  archived: "default",
};

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  return (
    <Badge variant={variants[status]}>{REPORT_STATUS_LABELS[status]}</Badge>
  );
}
