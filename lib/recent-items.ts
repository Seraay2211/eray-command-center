import type {
  RecentItem,
  SearchResultType,
} from "@/types";

export const RECENT_ITEMS_STORAGE_KEY = "ecc-recent-items";
const MAX_RECENT_ITEMS = 10;

type RecentItemType = Exclude<SearchResultType, "action">;

interface TrackRecentItemInput {
  href: string;
  id: string;
  title: string;
  type: RecentItemType;
}

function isRecentItem(value: unknown): value is RecentItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.href === "string" &&
    typeof candidate.openedAt === "string"
  );
}

export function getRecentItems(): RecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
    const parsed = rawValue ? (JSON.parse(rawValue) as unknown[]) : [];

    return parsed
      .filter(isRecentItem)
      .sort(
        (left, right) =>
          new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime(),
      )
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function trackRecentItem(input: TrackRecentItemInput): RecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const currentItems = getRecentItems().filter(
    (item) => !(item.id === input.id && item.type === input.type),
  );
  const nextItems = [
    {
      ...input,
      openedAt: new Date().toISOString(),
    },
    ...currentItems,
  ].slice(0, MAX_RECENT_ITEMS);

  window.localStorage.setItem(
    RECENT_ITEMS_STORAGE_KEY,
    JSON.stringify(nextItems),
  );

  return nextItems;
}
