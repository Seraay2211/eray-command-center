"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ThemeCard } from "@/components/settings/theme-card";
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

const INITIAL_THEME_LIMIT = 12;

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
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllThemes, setShowAllThemes] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const activeTheme = useMemo(
    () => getThemeById(activeThemeId),
    [activeThemeId],
  );

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

  const visibleThemes = useMemo(() => {
    if (showAllThemes || normalizeSearch(deferredSearchQuery)) {
      return filteredThemes;
    }

    if (
      activeTheme &&
      filteredThemes.includes(activeTheme) &&
      filteredThemes.indexOf(activeTheme) >= INITIAL_THEME_LIMIT
    ) {
      return [
        activeTheme,
        ...filteredThemes.filter((theme) => theme.id !== activeTheme.id),
      ].slice(0, INITIAL_THEME_LIMIT);
    }

    return filteredThemes.slice(0, INITIAL_THEME_LIMIT);
  }, [activeTheme, deferredSearchQuery, filteredThemes, showAllThemes]);

  return (
    <div className="app-surface-2 app-border min-w-0 rounded-2xl border p-3 sm:p-4">
      <div className="mb-4 flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <p className="app-text text-sm font-semibold">Tema Kütüphanesi</p>
          <p className="app-muted mt-1 text-xs leading-5">
            Çalışma alanının görünümünü seç. Aktif tema:{" "}
            <span className="app-text font-medium">
              {activeTheme?.name ?? activeThemeId}
            </span>
          </p>
        </div>

        <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block min-w-0">
            <span className="sr-only">Tema ara</span>
            <Search className="app-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              className="app-input h-10 w-full min-w-0 rounded-xl border pl-9 pr-3 text-xs outline-none"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowAllThemes(false);
              }}
              placeholder="Tema ara..."
              type="search"
              value={searchQuery}
            />
          </label>

          <div
            aria-label="Tema filtresi"
            className="app-surface app-border grid min-w-0 grid-cols-3 rounded-xl border p-1 sm:grid-cols-6"
            role="group"
          >
            {THEME_FILTERS.map((filter) => (
              <button
                aria-pressed={themeFilter === filter.value}
                className={cn(
                  "min-h-8 min-w-0 rounded-lg px-2 py-1.5 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  themeFilter === filter.value
                    ? "app-primary-bg shadow-sm"
                    : "app-muted hover:app-text",
                )}
                key={filter.value}
                onClick={() => {
                  setThemeFilter(filter.value);
                  setShowAllThemes(false);
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleThemes.length ? (
        <div className="grid min-w-0 auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleThemes.map((theme) => (
            <ThemeCard
              isActive={activeThemeId === theme.id}
              key={theme.id}
              onSelect={onSelect}
              theme={theme}
            />
          ))}
        </div>
      ) : (
        <div className="app-surface app-border rounded-xl border px-4 py-8 text-center">
          <p className="app-text text-sm font-medium">Tema bulunamadı.</p>
          <p className="app-muted mt-1 text-xs">
            Arama metnini veya kategori filtresini değiştir.
          </p>
        </div>
      )}

      {!normalizeSearch(deferredSearchQuery) &&
      filteredThemes.length > INITIAL_THEME_LIMIT ? (
        <div className="mt-4 flex justify-center">
          <button
            className="app-button-secondary app-border min-h-10 rounded-lg border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            onClick={() => setShowAllThemes((current) => !current)}
            type="button"
          >
            {showAllThemes
              ? "Daha az tema göster"
              : `${filteredThemes.length - INITIAL_THEME_LIMIT} tema daha göster`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
