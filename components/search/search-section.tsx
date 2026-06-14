"use client";

import { SearchResultItem } from "@/components/search/search-result-item";
import type {
  RecentItem,
  SearchResult,
} from "@/types";

interface SearchSectionProps {
  items: Array<RecentItem | SearchResult>;
  onSelect: (item: RecentItem | SearchResult) => void;
  selectedId?: string | null;
  title: string;
}

export function SearchSection({
  items,
  onSelect,
  selectedId = null,
  title,
}: SearchSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] app-muted">
          {title}
        </p>
        <span className="text-[10px] font-mono app-muted">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const composedId = `${item.type}:${item.id}`;

          return (
            <SearchResultItem
              isSelected={selectedId === composedId}
              item={item}
              key={composedId}
              onSelect={() => onSelect(item)}
            />
          );
        })}
      </div>
    </section>
  );
}
