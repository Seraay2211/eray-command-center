import { ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";
import {
  DarkSelect,
  type DarkSelectOption,
} from "@/components/ui/dark-select";
import { getCategoryCollectionLabel } from "@/lib/categories/display";
import type { Category } from "@/types";

export type NotesSort = "newest" | "oldest" | "pinned";
export type NotesViewFilter =
  | "all"
  | "pinned"
  | "favorites"
  | "archive"
  | "recent";

interface NotesToolbarProps {
  categories: Category[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: NotesSort) => void;
  onViewFilterChange: (value: NotesViewFilter) => void;
  query: string;
  resultCount: number;
  sort: NotesSort;
  viewFilter: NotesViewFilter;
}

const sortOptions: DarkSelectOption[] = [
  { label: "En yeni", value: "newest" },
  { label: "En eski", value: "oldest" },
  { label: "Sabitlenenler", value: "pinned" },
];

const viewFilters: Array<{ label: string; value: NotesViewFilter }> = [
  { label: "Tümü", value: "all" },
  { label: "Sabitlenenler", value: "pinned" },
  { label: "Favoriler", value: "favorites" },
  { label: "Arşiv", value: "archive" },
  { label: "Son Düzenlenenler", value: "recent" },
];

export function NotesToolbar({
  categories,
  categoryId,
  onCategoryChange,
  onQueryChange,
  onSortChange,
  onViewFilterChange,
  query,
  resultCount,
  sort,
  viewFilter,
}: NotesToolbarProps) {
  const categoryOptions: DarkSelectOption[] = [
    { label: "Tüm kategoriler", value: "all" },
    { label: "Kategorisiz", value: "uncategorized" },
    ...categories.map((category) => ({
      label: getCategoryCollectionLabel(category),
      value: category.id,
    })),
  ];

  return (
    <div className="app-surface rounded-2xl border p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Notlarda ara</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Başlık, içerik, kategori veya etikette ara..."
            type="search"
            value={query}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:flex">
          <DarkSelect
            ariaLabel="Kategori filtresi"
            className="w-full sm:min-w-44"
            icon={SlidersHorizontal}
            onChange={onCategoryChange}
            options={categoryOptions}
            value={categoryId}
          />
          <DarkSelect
            ariaLabel="Not sıralaması"
            className="w-full sm:min-w-40"
            icon={ArrowDownUp}
            onChange={(value) => onSortChange(value as NotesSort)}
            options={sortOptions}
            value={sort}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.055] pt-3 text-[10px]">
        <div className="flex flex-wrap gap-1.5">
          {viewFilters.map((filter) => (
            <button
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition ${
                viewFilter === filter.value
                  ? "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-2))] text-[var(--text)]"
                  : "app-button-ghost app-muted"
              }`}
              key={filter.value}
              onClick={() => onViewFilterChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-zinc-500">{resultCount} sonuç</span>
      </div>
    </div>
  );
}
