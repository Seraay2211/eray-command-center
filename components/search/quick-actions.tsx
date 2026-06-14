"use client";

import { SearchSection } from "@/components/search/search-section";
import type { SearchResult } from "@/types";

interface QuickActionsProps {
  items: SearchResult[];
  onSelect: (item: SearchResult) => void;
  selectedId?: string | null;
}

export function QuickActions({
  items,
  onSelect,
  selectedId,
}: QuickActionsProps) {
  return (
    <SearchSection
      items={items}
      onSelect={(item) => onSelect(item as SearchResult)}
      selectedId={selectedId}
      title="Hizli Aksiyonlar"
    />
  );
}
