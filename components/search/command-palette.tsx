"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { CommandPaletteContext } from "@/hooks/use-command-palette";
import { useDebounce } from "@/hooks/use-debounce";
import { getRecentItems, trackRecentItem } from "@/lib/recent-items";
import { filterQuickActions, QUICK_ACTIONS } from "@/lib/search/actions";
import { QuickActions } from "@/components/search/quick-actions";
import { RecentItemsSection } from "@/components/search/recent-items-section";
import { SearchSection } from "@/components/search/search-section";
import type {
  RecentItem,
  SearchResult,
  SearchResultType,
} from "@/types";

interface SearchApiResponse {
  error?: string;
  results?: SearchResult[];
  success: boolean;
}

interface CommandPaletteProviderProps {
  children: ReactNode;
}

type SearchItem = RecentItem | SearchResult;

const sectionTitleMap: Record<
  Exclude<SearchResultType, "action">,
  string
> = {
  note: "Notlar",
  task: "Görevler",
  report: "Raporlar",
  calendar: "Takvim",
};

function isRecentItem(item: SearchItem): item is RecentItem {
  return "openedAt" in item;
}

function buildSelectedId(item: SearchItem): string {
  return `${item.type}:${item.id}`;
}

function normalizeSearchResult(result: SearchResult): SearchResult {
  return {
    ...result,
    meta: result.meta ?? null,
    description: result.description ?? null,
    created_at: result.created_at ?? null,
  };
}

export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [recentItemsVersion, setRecentItemsVersion] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 250);
  const normalizedQuery = debouncedQuery.trim();
  const recentItems = useMemo(() => {
    void pathname;
    void recentItemsVersion;
    return getRecentItems();
  }, [pathname, recentItemsVersion]);

  const openPalette = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setRequestError("");
    setIsLoading(false);
    setResults([]);
    setSelectedId(null);
  }, []);

  const togglePalette = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
      }

      if (event.key === "Escape") {
        closePalette();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePalette, togglePalette]);

  useEffect(() => {
    if (!isOpen || normalizedQuery.length < 2) {
      return;
    }

    let isCancelled = false;

    async function search() {
      setIsLoading(true);
      setRequestError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
        );
        const result = (await response.json()) as SearchApiResponse;

        if (isCancelled) {
          return;
        }

        if (!response.ok || !result.success || !result.results) {
          setResults([]);
          setRequestError(
            result.error ?? "Arama yapilamadi. Lütfen tekrar dene.",
          );
          return;
        }

        setResults(result.results.map(normalizeSearchResult));
      } catch {
        if (!isCancelled) {
          setResults([]);
          setRequestError("Arama yapilamadi. Lütfen tekrar dene.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void search();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, normalizedQuery]);

  const quickActions = useMemo(
    () => filterQuickActions(query),
    [query],
  );
  const activeResults = useMemo(
    () => (normalizedQuery.length >= 2 ? results : []),
    [normalizedQuery, results],
  );
  const displayError =
    normalizedQuery.length === 1
      ? "En az 2 karakter yaz."
      : requestError;

  const groupedResults = useMemo(() => {
    return {
      calendar: activeResults.filter((item) => item.type === "calendar"),
      note: activeResults.filter((item) => item.type === "note"),
      report: activeResults.filter((item) => item.type === "report"),
      task: activeResults.filter((item) => item.type === "task"),
    };
  }, [activeResults]);

  const flatItems = useMemo(() => {
    if (normalizedQuery.length >= 2) {
      return [
        ...quickActions,
        ...groupedResults.note,
        ...groupedResults.task,
        ...groupedResults.report,
        ...groupedResults.calendar,
      ];
    }

    return [...quickActions, ...recentItems];
  }, [groupedResults, normalizedQuery, quickActions, recentItems]);
  const effectiveSelectedId = useMemo(() => {
    if (flatItems.length === 0) {
      return null;
    }

    return flatItems.some((item) => buildSelectedId(item) === selectedId)
      ? selectedId
      : buildSelectedId(flatItems[0]);
  }, [flatItems, selectedId]);

  const handleSelectItem = useCallback(
    (item: SearchItem) => {
      if (!isRecentItem(item) && item.type !== "action") {
        trackRecentItem({
          href: item.href,
          id: item.id,
          title: item.title,
          type: item.type,
        });
        setRecentItemsVersion((current) => current + 1);
      }

      router.push(item.href);
      closePalette();
    },
    [closePalette, router],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!flatItems.length) {
        return;
      }

      const currentIndex = flatItems.findIndex(
        (item) => buildSelectedId(item) === effectiveSelectedId,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex =
          currentIndex === -1 ? 0 : (currentIndex + 1) % flatItems.length;
        setSelectedId(buildSelectedId(flatItems[nextIndex]));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex =
          currentIndex === -1
            ? flatItems.length - 1
            : (currentIndex - 1 + flatItems.length) % flatItems.length;
        setSelectedId(buildSelectedId(flatItems[nextIndex]));
      }

      if (event.key === "Enter") {
        const selectedItem = flatItems.find(
          (item) => buildSelectedId(item) === effectiveSelectedId,
        );

        if (selectedItem) {
          event.preventDefault();
          handleSelectItem(selectedItem);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [effectiveSelectedId, flatItems, handleSelectItem, isOpen]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (value.trim().length < 2) {
        setIsLoading(false);
        setRequestError("");
        setResults([]);
      }
    },
    [],
  );

  return (
    <CommandPaletteContext.Provider
      value={{
        closePalette,
        isOpen,
        openPalette,
        togglePalette,
      }}
    >
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[160]">
          <button
            aria-label="Komut paletini kapat"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closePalette}
            type="button"
          />
          <div className="safe-top absolute inset-x-0 top-0 flex justify-center p-3 sm:p-6">
            <div className="app-card safe-bottom relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-3xl border shadow-[0_28px_90px_rgba(0,0,0,0.36)] sm:max-h-[calc(100dvh-3rem)]">
              <div className="app-border flex items-center gap-3 border-b px-4 py-3 sm:px-5">
                <Search className="app-muted size-4 shrink-0" />
                <input
                  aria-label="Global search"
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-zinc-500 app-text"
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="Ara veya komut çalıştır..."
                  ref={inputRef}
                  type="search"
                  value={query}
                />
                <button
                  aria-label="Kapat"
                  className="app-button-ghost flex size-9 items-center justify-center rounded-xl"
                  onClick={closePalette}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 px-2 py-6 text-sm app-muted">
                    <LoaderCircle className="size-4 animate-spin" />
                    Aranıyor...
                  </div>
                ) : null}

                {!isLoading && displayError ? (
                  <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
                    {displayError}
                  </div>
                ) : null}

                {!isLoading && !displayError ? (
                  <div className="space-y-5">
                    <QuickActions
                      items={quickActions}
                      onSelect={handleSelectItem}
                      selectedId={effectiveSelectedId}
                    />

                    {normalizedQuery.length < 2 ? (
                      <RecentItemsSection
                        items={recentItems}
                        onSelect={handleSelectItem}
                        selectedId={effectiveSelectedId}
                      />
                    ) : (
                      <>
                        {(Object.keys(groupedResults) as Array<
                          keyof typeof groupedResults
                        >).map((key) => (
                          <SearchSection
                            items={groupedResults[key]}
                            key={key}
                            onSelect={handleSelectItem}
                            selectedId={effectiveSelectedId}
                            title={sectionTitleMap[key]}
                          />
                        ))}

                        {activeResults.length === 0 && quickActions.length === 0 ? (
                          <div className="rounded-2xl border px-4 py-6 text-center app-border app-surface">
                            <p className="app-text text-sm font-semibold">
                              Sonuç bulunamadı
                            </p>
                            <p className="app-muted mt-2 text-xs">
                              Farklı bir kelimeyle arayabilir veya aramayı
                              temizleyebilirsin.
                            </p>
                            <button
                              className="app-button-secondary app-text mt-4 rounded-lg border px-3 py-2 text-xs font-medium"
                              onClick={() => handleQueryChange("")}
                              type="button"
                            >
                              Aramayı Temizle
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}

                    {normalizedQuery.length < 2 &&
                    recentItems.length === 0 &&
                    QUICK_ACTIONS.length === 0 ? (
                      <div className="rounded-2xl border px-4 py-6 text-center text-sm app-muted app-border app-surface">
                        Sonuç bulunamadı.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </CommandPaletteContext.Provider>
  );
}
