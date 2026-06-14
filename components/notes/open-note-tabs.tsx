"use client";

import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenNoteTab } from "@/types";

interface OpenNoteTabsProps {
  activeId: string | null;
  onClose: (noteId: string) => void;
  onSelect: (noteId: string) => void;
  tabs: OpenNoteTab[];
}

export function OpenNoteTabs({
  activeId,
  onClose,
  onSelect,
  tabs,
}: OpenNoteTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Açık notlar"
      className="app-surface flex flex-wrap gap-2 rounded-2xl border app-border p-2 sm:flex-nowrap sm:overflow-x-auto"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <div
            className={cn(
              "flex min-w-0 basis-[calc(50%-0.25rem)] items-center rounded-xl border transition sm:min-w-40 sm:max-w-60 sm:basis-auto sm:shrink-0",
              isActive
                ? "border-violet-400/25 bg-violet-500/[0.09] text-violet-100"
                : "border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:border-white/[0.11] hover:text-zinc-200",
            )}
            key={tab.id}
          >
            <button
              aria-selected={isActive}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
              onClick={() => onSelect(tab.id)}
              role="tab"
              type="button"
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate text-xs font-medium">{tab.title}</span>
            </button>
            <button
              aria-label={`${tab.title} sekmesini kapat`}
              className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.06] hover:text-zinc-200"
              onClick={() => onClose(tab.id)}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
