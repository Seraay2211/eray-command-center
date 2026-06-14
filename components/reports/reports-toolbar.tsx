"use client";

import { ArrowDownUp, CalendarRange, Search } from "lucide-react";
import { DarkSelect } from "@/components/ui/dark-select";
import {
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from "@/lib/reports";
import type { ReportStatus, ReportType } from "@/types";

export type ReportsSort = "newest" | "oldest" | "updated";
export type ReportsDateFilter = "all" | "today" | "7days" | "30days";

interface ReportsToolbarProps {
  dateFilter: ReportsDateFilter;
  onDateFilterChange: (value: ReportsDateFilter) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: ReportsSort) => void;
  onStatusChange: (value: "active" | "all" | ReportStatus) => void;
  onTypeChange: (value: "all" | ReportType) => void;
  query: string;
  resultCount: number;
  sort: ReportsSort;
  status: "active" | "all" | ReportStatus;
  type: "all" | ReportType;
}

export function ReportsToolbar({
  dateFilter,
  onDateFilterChange,
  onQueryChange,
  onSortChange,
  onStatusChange,
  onTypeChange,
  query,
  resultCount,
  sort,
  status,
  type,
}: ReportsToolbarProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111114]/85 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Raporlarda ara</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Başlık, özet veya içerikte ara..."
            type="search"
            value={query}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DarkSelect
            ariaLabel="Rapor tipi filtresi"
            onChange={(value) => onTypeChange(value as "all" | ReportType)}
            options={[{ label: "Tüm rapor tipleri", value: "all" }, ...REPORT_TYPE_OPTIONS]}
            value={type}
          />
          <DarkSelect
            ariaLabel="Rapor durumu filtresi"
            onChange={(value) =>
              onStatusChange(value as "active" | "all" | ReportStatus)
            }
            options={[
              { label: "Aktif raporlar", value: "active" },
              { label: "Tüm durumlar", value: "all" },
              ...REPORT_STATUS_OPTIONS,
            ]}
            value={status}
          />
          <DarkSelect
            ariaLabel="Rapor tarih filtresi"
            icon={CalendarRange}
            onChange={(value) =>
              onDateFilterChange(value as ReportsDateFilter)
            }
            options={[
              { label: "Tüm tarihler", value: "all" },
              { label: "Bugün", value: "today" },
              { label: "Son 7 gün", value: "7days" },
              { label: "Son 30 gün", value: "30days" },
            ]}
            value={dateFilter}
          />
          <DarkSelect
            ariaLabel="Rapor sıralaması"
            icon={ArrowDownUp}
            onChange={(value) => onSortChange(value as ReportsSort)}
            options={[
              { label: "En yeni", value: "newest" },
              { label: "En eski", value: "oldest" },
              { label: "Son güncellenen", value: "updated" },
            ]}
            value={sort}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.055] pt-3 text-[10px]">
        <span className="text-zinc-700">Rapor arşivi anında filtrelenir</span>
        <span className="font-mono text-zinc-500">{resultCount} sonuç</span>
      </div>
    </div>
  );
}
