"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translate,
  type DictionaryKey,
} from "@/lib/i18n/dictionaries";
import {
  isLightTheme,
  isNewThemeId,
  isThemeId,
} from "@/lib/settings/themes";
import { updateUserSettings } from "@/services/settings-service";
import type {
  AppLanguage,
  UpdateUserSettingsInput,
  UserSettings,
} from "@/types";

const STORAGE_KEY = "eray-command-center-settings";
const THEME_STORAGE_KEY = "ecc-theme";
const LANGUAGE_STORAGE_KEY = "ecc-language";
const APP_LANGUAGES: AppLanguage[] = ["tr", "en"];

interface SettingsContextValue {
  settings: UserSettings;
  replaceSettings: (settings: UserSettings) => void;
  t: (key: DictionaryKey) => string;
  updateSettings: (input: UpdateUserSettingsInput) => Promise<string | null>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyDocumentSettings(settings: UserSettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.app_theme;
  root.dataset.colorScheme = isLightTheme(settings.app_theme)
    ? "light"
    : "dark";
  root.dataset.density = settings.density;
  root.dataset.sidebar = settings.sidebar_mode;
  root.dataset.font = settings.font_family;
  root.dataset.reduceMotion = String(settings.reduce_motion);
  root.dataset.defaultLandingPage = settings.default_landing_page;
  root.dataset.dashboardLayout = settings.dashboard_layout;
  root.dataset.showDashboardNotes = String(settings.show_dashboard_notes);
  root.dataset.showDashboardTasks = String(settings.show_dashboard_tasks);
  root.dataset.showDashboardReports = String(settings.show_dashboard_reports);
  root.dataset.showDashboardAi = String(settings.show_dashboard_ai);
  root.dataset.showDashboardCalendar = String(
    settings.show_dashboard_calendar,
  );
  root.dataset.compactCards = String(settings.compact_cards);
  root.lang = settings.language;
  root.style.colorScheme = isLightTheme(settings.app_theme) ? "light" : "dark";
}

function saveLocalFallback(settings: UserSettings) {
  localStorage.setItem(THEME_STORAGE_KEY, settings.app_theme);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, settings.language);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings),
  );
}

function isLanguage(value: string): value is AppLanguage {
  return APP_LANGUAGES.includes(value as AppLanguage);
}

function readLocalFallback(): Partial<UserSettings> {
  const nextSettings: Partial<UserSettings> = {};

  try {
    const legacyValue = localStorage.getItem(STORAGE_KEY);
    const legacySettings = legacyValue
      ? (JSON.parse(legacyValue) as Partial<UserSettings>)
      : {};
    const localTheme =
      localStorage.getItem(THEME_STORAGE_KEY) ?? legacySettings.app_theme;
    const localLanguage =
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? legacySettings.language;

    if (localTheme && isThemeId(localTheme)) {
      nextSettings.app_theme = localTheme;
    }

    if (localLanguage && isLanguage(localLanguage)) {
      nextSettings.language = localLanguage;
    }

    if (
      legacySettings.font_family === "inter" ||
      legacySettings.font_family === "geist" ||
      legacySettings.font_family === "system"
    ) {
      nextSettings.font_family = legacySettings.font_family;
    }
    if (
      legacySettings.density === "comfortable" ||
      legacySettings.density === "compact"
    ) {
      nextSettings.density = legacySettings.density;
    }
    if (
      legacySettings.sidebar_mode === "expanded" ||
      legacySettings.sidebar_mode === "collapsed"
    ) {
      nextSettings.sidebar_mode = legacySettings.sidebar_mode;
    }
    if (typeof legacySettings.reduce_motion === "boolean") {
      nextSettings.reduce_motion = legacySettings.reduce_motion;
    }
  } catch {
    return {};
  }

  return nextSettings;
}

function mergePersistedSettings(settings: UserSettings): UserSettings {
  const localFallback = readLocalFallback();
  const localTheme = localFallback.app_theme;
  const shouldUseLocalFallback =
    settings.id === "local-default" || !settings.updated_at;

  if (shouldUseLocalFallback) {
    return {
      ...settings,
      ...localFallback,
    };
  }

  return localTheme && isNewThemeId(localTheme)
    ? { ...settings, app_theme: localTheme }
    : settings;
}

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings: UserSettings;
}

export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState(() =>
    mergePersistedSettings(initialSettings),
  );

  useEffect(() => {
    applyDocumentSettings(settings);
    saveLocalFallback(settings);
  }, [settings]);

  const replaceSettings = useCallback((nextSettings: UserSettings) => {
    setSettings(nextSettings);
    applyDocumentSettings(nextSettings);
    saveLocalFallback(nextSettings);
  }, []);

  const updateSettings = useCallback(
    async (input: UpdateUserSettingsInput): Promise<string | null> => {
      const previous = settings;
      const optimistic = { ...previous, ...input };
      setSettings(optimistic);
      applyDocumentSettings(optimistic);
      saveLocalFallback(optimistic);

      const result = await updateUserSettings(input);
      if (result.error || !result.data) {
        setSettings(previous);
        applyDocumentSettings(previous);
        saveLocalFallback(previous);
        return result.error ?? "Ayarlar kaydedilemedi.";
      }

      const resolvedSettings = isNewThemeId(optimistic.app_theme)
        ? { ...result.data, app_theme: optimistic.app_theme }
        : result.data;
      setSettings(resolvedSettings);
      applyDocumentSettings(resolvedSettings);
      saveLocalFallback(resolvedSettings);
      return null;
    },
    [settings],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      replaceSettings,
      t: (key) => translate(settings.language, key),
      updateSettings,
    }),
    [replaceSettings, settings, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider.");
  }

  return context;
}
