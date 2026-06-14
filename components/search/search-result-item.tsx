"use client";

import {
  CalendarRange,
  CheckSquare,
  FileText,
  Forward,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RecentItem,
  SearchResult,
  SearchResultType,
} from "@/types";

interface SearchResultItemProps {
  isSelected?: boolean;
  item: RecentItem | SearchResult;
  onSelect: () => void;
}

const typeLabelMap: Record<SearchResultType, string> = {
  note: "Note",
  task: "Task",
  report: "Report",
  calendar: "Calendar",
  action: "Action",
};

const typeIconMap: Record<SearchResultType, typeof StickyNote> = {
  note: StickyNote,
  task: CheckSquare,
  report: FileText,
  calendar: CalendarRange,
  action: Forward,
};

function getItemType(item: RecentItem | SearchResult): SearchResultType {
  return item.type;
}

function formatCreatedAt(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function SearchResultItem({
  isSelected = false,
  item,
  onSelect,
}: SearchResultItemProps) {
  const itemType = getItemType(item);
  const Icon = typeIconMap[itemType];
  const timestamp =
    "openedAt" in item ? formatCreatedAt(item.openedAt) : formatCreatedAt(item.created_at);

  return (
    <button
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition",
        isSelected
          ? "app-theme-card-active"
          : "hover:bg-[color:color-mix(in_srgb,var(--surface-2)_74%,transparent)]",
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border app-surface-2">
        <Icon className="app-primary size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="app-text text-sm font-semibold">{item.title}</span>
          <span className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold app-muted app-border">
            {typeLabelMap[itemType]}
          </span>
        </span>
        {"description" in item && item.description ? (
          <span className="app-muted mt-1 line-clamp-2 block text-xs leading-5">
            {item.description}
          </span>
        ) : null}
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] app-muted">
          {"meta" in item && item.meta ? <span>{item.meta}</span> : null}
          {timestamp ? <span>{timestamp}</span> : null}
        </span>
      </span>
    </button>
  );
}
