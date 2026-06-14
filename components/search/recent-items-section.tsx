"use client";

import { SearchSection } from "@/components/search/search-section";
import type { RecentItem } from "@/types";

interface RecentItemsSectionProps {
  items: RecentItem[];
  onSelect: (item: RecentItem) => void;
  selectedId?: string | null;
}

export function RecentItemsSection({
  items,
  onSelect,
  selectedId,
}: RecentItemsSectionProps) {
  return (
    <SearchSection
      items={items}
      onSelect={(item) => onSelect(item as RecentItem)}
      selectedId={selectedId}
      title="Son Acilanlar"
    />
  );
}
