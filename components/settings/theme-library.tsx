"use client";

import { Palette, Search, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeCard } from "@/components/settings/theme-card";
import { Button } from "@/components/ui/button";
import {
  APP_THEMES,
  getThemeById,
  getThemeTags,
  type ThemeFilter,
} from "@/lib/settings/themes";
import { cn } from "@/lib/utils";
import type { AppTheme } from "@/types";

interface ThemeLibraryProps {
  activeThemeId: AppTheme;
  onSelect: (themeId: AppTheme) => void;
}

const FEATURED_THEME_LIMIT = 6;

const THEME_FILTERS: Array<{ label: string; value: ThemeFilter }> = [
  { label: "Tümü", value: "all" },
  { label: "Koyu", value: "dark" },
  { label: "Açık", value: "light" },
  { label: "Renkli", value: "colorful" },
  { label: "Premium", value: "premium" },
  { label: "Sade", value: "simple" },
];

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function ThemeLibrary({
  activeThemeId,
  onSelect,
}: ThemeLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const activeTheme = getThemeById(activeThemeId);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const featuredThemes = useMemo(() => {
    const themes = activeTheme
      ? [activeTheme, ...APP_THEMES.filter((theme) => theme.id !== activeTheme.id)]
      : APP_THEMES;
    return themes.slice(0, FEATURED_THEME_LIMIT);
  }, [activeTheme]);

  const filteredThemes = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredSearchQuery);

    return APP_THEMES.filter((theme) => {
      const matchesFilter =
        themeFilter === "all" || getThemeTags(theme).includes(themeFilter);
      const matchesSearch =
        !normalizedQuery ||
        normalizeSearch(`${theme.name} ${theme.description}`).includes(
          normalizedQuery,
        );

      return matchesFilter && matchesSearch;
    });
  }, [deferredSearchQuery, themeFilter]);

  return (
    <>
      <div className="app-surface-2 app-border min-w-0 rounded-2xl border p-3 sm:p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Palette className="app-primary size-4" />
              <h3 className="app-text text-sm font-semibold">
                Tema Kütüphanesi
              </h3>
            </div>
            <p className="app-muted mt-1 text-xs leading-5">
              Öne çıkan temalardan birini seç veya tüm koleksiyonu aç.
            </p>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setIsOpen(true)}
            size="sm"
            variant="secondary"
          >
            <Palette className="size-3.5" />
            Tüm Temaları Aç
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {THEME_FILTERS.slice(1).map((filter) => (
            <span
              className="app-surface app-border rounded-full border px-2 py-1 text-[9px] font-medium app-muted"
              key={filter.value}
            >
              {filter.label}
            </span>
          ))}
        </div>

        <div className="mt-4 grid min-w-0 auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {featuredThemes.map((theme) => (
            <ThemeCard
              isActive={activeThemeId === theme.id}
              key={theme.id}
              onSelect={onSelect}
              theme={theme}
            />
          ))}
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[160]">
          <button
            aria-label="Tema Kütüphanesini kapat"
            className="absolute inset-0 bg-black/65"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside
            aria-modal="true"
            className="app-bg app-border absolute inset-0 flex min-w-0 flex-col border-l shadow-2xl sm:left-auto sm:w-[min(760px,92vw)]"
            role="dialog"
          >
            <div className="app-border flex min-w-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="app-text text-base font-semibold">
                  Tema Kütüphanesi
                </h2>
                <p className="app-muted mt-1 text-xs leading-5">
                  Tüm temaları kategoriye göre incele ve çalışma alanına uygula.
                </p>
              </div>
              <button
                aria-label="Kapat"
                className="app-button-secondary app-border flex size-9 shrink-0 items-center justify-center rounded-xl border"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="app-border space-y-3 border-b p-4 sm:p-5">
              <label className="relative block min-w-0">
                <span className="sr-only">Tema ara</span>
                <Search className="app-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <input
                  autoFocus
                  className="app-input h-11 w-full min-w-0 rounded-xl border pl-9 pr-3 text-sm outline-none"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tema ara..."
                  type="search"
                  value={searchQuery}
                />
              </label>

              <div
                aria-label="Tema filtresi"
                className="app-surface app-border grid min-w-0 grid-cols-3 gap-1 rounded-xl border p-1 sm:grid-cols-6"
                role="group"
              >
                {THEME_FILTERS.map((filter) => (
                  <button
                    aria-pressed={themeFilter === filter.value}
                    className={cn(
                      "min-h-9 min-w-0 rounded-lg px-2 py-1.5 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                      themeFilter === filter.value
                        ? "app-primary-bg shadow-sm"
                        : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                    )}
                    key={filter.value}
                    onClick={() => setThemeFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              {filteredThemes.length ? (
                <div className="grid min-w-0 auto-rows-fr gap-2.5 sm:grid-cols-2">
                  {filteredThemes.map((theme) => (
                    <ThemeCard
                      isActive={activeThemeId === theme.id}
                      key={theme.id}
                      onSelect={onSelect}
                      theme={theme}
                    />
                  ))}
                </div>
              ) : (
                <div className="app-surface app-border rounded-xl border px-4 py-10 text-center">
                  <p className="app-text text-sm font-medium">
                    Tema bulunamadı.
                  </p>
                  <p className="app-muted mt-1 text-xs">
                    Arama metnini veya kategori filtresini değiştir.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
