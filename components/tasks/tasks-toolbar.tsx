"use client";

import {
  ArrowDownUp,
  Columns3,
  Flag,
  List,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { DarkSelect } from "@/components/ui/dark-select";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/tasks";
import { getCategoryCollectionLabel } from "@/lib/categories/display";
import { cn } from "@/lib/utils";
import type { Category, TaskPriority, TaskStatus } from "@/types";

export type TasksSort = "newest" | "oldest" | "due_date";
export type TasksView = "list" | "board";

interface TasksToolbarProps {
  categories: Category[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  onPriorityChange: (value: "all" | TaskPriority) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: TasksSort) => void;
  onStatusChange: (value: "all" | TaskStatus) => void;
  onViewChange: (value: TasksView) => void;
  priority: "all" | TaskPriority;
  query: string;
  resultCount: number;
  sort: TasksSort;
  status: "all" | TaskStatus;
  view: TasksView;
}

const sortOptions = [
  { label: "En yeni", value: "newest" },
  { label: "En eski", value: "oldest" },
  { label: "Son tarih", value: "due_date" },
];

export function TasksToolbar({
  categories,
  categoryId,
  onCategoryChange,
  onPriorityChange,
  onQueryChange,
  onSortChange,
  onStatusChange,
  onViewChange,
  priority,
  query,
  resultCount,
  sort,
  status,
  view,
}: TasksToolbarProps) {
  return (
    <div className="app-card rounded-2xl border p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Görevlerde ara</span>
            <Search className="app-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              className="app-input h-11 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition focus:ring-2"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Başlık veya açıklamada ara..."
              type="search"
              value={query}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium transition",
                view === "list"
                  ? "app-primary app-border bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))]"
                  : "app-button-secondary app-muted",
              )}
              onClick={() => onViewChange("list")}
              type="button"
            >
              <List className="size-3.5" />
              Liste
            </button>
            <button
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium transition",
                view === "board"
                  ? "app-primary app-border bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))]"
                  : "app-button-secondary app-muted",
              )}
              onClick={() => onViewChange("board")}
              type="button"
            >
              <Columns3 className="size-3.5" />
              Board
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DarkSelect
            ariaLabel="Görev durumu filtresi"
            icon={SlidersHorizontal}
            onChange={(value) =>
              onStatusChange(value as "all" | TaskStatus)
            }
            options={[
              { label: "Tüm durumlar", value: "all" },
              ...TASK_STATUS_OPTIONS,
            ]}
            value={status}
          />
          <DarkSelect
            ariaLabel="Görev önceliği filtresi"
            icon={Flag}
            onChange={(value) =>
              onPriorityChange(value as "all" | TaskPriority)
            }
            options={[
              { label: "Tüm öncelikler", value: "all" },
              ...TASK_PRIORITY_OPTIONS,
            ]}
            value={priority}
          />
          <DarkSelect
            ariaLabel="Görev kategorisi filtresi"
            icon={SlidersHorizontal}
            onChange={onCategoryChange}
            options={[
              { label: "Tüm kategoriler", value: "all" },
              { label: "Kategorisiz", value: "uncategorized" },
              ...categories.map((category) => ({
                label: getCategoryCollectionLabel(category),
                value: category.id,
              })),
            ]}
            value={categoryId}
          />
          <DarkSelect
            ariaLabel="Görev sıralaması"
            icon={ArrowDownUp}
            onChange={(value) => onSortChange(value as TasksSort)}
            options={sortOptions}
            value={sort}
          />
        </div>
      </div>

      <div className="app-border mt-3 flex items-center justify-between border-t pt-3 text-[10px]">
        <span className="app-muted">
          Arama ve filtreler istemci tarafında anında uygulanır
        </span>
        <span className="app-muted font-mono">{resultCount} sonuç</span>
      </div>
    </div>
  );
}
