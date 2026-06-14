import { ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";
import {
  DarkSelect,
  type DarkSelectOption,
} from "@/components/ui/dark-select";
import { getCategoryCollectionLabel } from "@/lib/categories/display";
import type { Category } from "@/types";

export type NotesSort = "newest" | "oldest" | "pinned";

interface NotesToolbarProps {
  categories: Category[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: NotesSort) => void;
  query: string;
  resultCount: number;
  sort: NotesSort;
}

const sortOptions: DarkSelectOption[] = [
  { label: "En yeni", value: "newest" },
  { label: "En eski", value: "oldest" },
  { label: "Sabitlenenler", value: "pinned" },
];

export function NotesToolbar({
  categories,
  categoryId,
  onCategoryChange,
  onQueryChange,
  onSortChange,
  query,
  resultCount,
  sort,
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
    <div className="rounded-2xl border border-white/[0.07] bg-[#111114]/85 p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Notlarda ara</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/10"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Başlık veya içerikte ara..."
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
        <span className="text-zinc-700">
          Başlık ve içerik alanlarında aranır
        </span>
        <span className="font-mono text-zinc-500">{resultCount} sonuç</span>
      </div>
    </div>
  );
}
