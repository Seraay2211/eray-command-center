import { ReportsClient } from "@/components/reports/reports-client";
import { getNotes } from "@/features/notes/actions";
import {
  getReportById,
  getReports,
} from "@/services/reports-service";
import { getTasks } from "@/services/tasks-service";
import type { ReportType } from "@/types";

export const metadata = {
  title: "Raporlar",
};

export const dynamic = "force-dynamic";

const reportTypes: ReportType[] = [
  "daily",
  "weekly",
  "operation",
  "manager",
  "finance",
  "custom",
];

interface ReportsPageProps {
  searchParams: Promise<{
    new?: string;
    report?: string;
    type?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [reportsResult, notesResult, tasksResult, query] = await Promise.all([
    getReports({ limit: 50 }),
    getNotes(),
    getTasks(),
    searchParams,
  ]);
  const requestedType = reportTypes.includes(query.type as ReportType)
    ? (query.type as ReportType)
    : "custom";
  const selectedReportMissing =
    Boolean(query.report) &&
    !(reportsResult.data ?? []).some((report) => report.id === query.report);
  const selectedReportResult =
    selectedReportMissing && query.report
      ? await getReportById(query.report)
      : null;
  const initialReports = selectedReportResult?.data
    ? [selectedReportResult.data, ...(reportsResult.data ?? [])]
    : (reportsResult.data ?? []);

  return (
    <ReportsClient
      initialAiOpen={query.new === "ai"}
      initialError={reportsResult.error ?? ""}
      initialManualOpen={query.new === "1"}
      initialNotes={notesResult.data ?? []}
      initialReportId={query.report ?? ""}
      initialReports={initialReports}
      initialTimestamp={new Date().getTime()}
      initialSourceError={notesResult.error ?? tasksResult.error ?? ""}
      initialTasks={tasksResult.data ?? []}
      initialType={requestedType}
      key={[query.new ?? "", query.type ?? "", query.report ?? "", reportsResult.error ?? ""].join("|")}
    />
  );
}
