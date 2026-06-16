"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  translate,
  type DictionaryKey,
} from "@/lib/i18n/dictionaries";
import { normalizeAppearancePreferences } from "@/lib/settings/appearance-preferences";
import { normalizeDashboardPreferences } from "@/lib/settings/dashboard-preferences";
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
const APP_FONTS = [
  "system",
  "inter",
  "geist",
  "manrope",
  "jakarta",
  "nunito",
  "roboto",
] as const;
const APP_DENSITIES = ["comfortable", "balanced", "compact"] as const;

interface SettingsContextValue {
  settings: UserSettings;
  replaceSettings: (settings: UserSettings) => void;
  t: (key: DictionaryKey) => string;
  updateSettings: (input: UpdateUserSettingsInput) => Promise<string | null>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyDocumentSettings(settings: UserSettings) {
  const root = document.documentElement;
  const appearance = normalizeAppearancePreferences(
    settings.appearance_preferences,
  );
  root.dataset.theme = settings.app_theme;
  root.dataset.colorScheme = isLightTheme(settings.app_theme)
    ? "light"
    : "dark";
  root.dataset.density = settings.density;
  root.dataset.sidebar = settings.sidebar_mode;
  root.dataset.font = settings.font_family;
  root.dataset.textSize = appearance.text_size;
  root.dataset.lineHeight = appearance.line_height;
  root.dataset.cardStyle = appearance.card_style;
  root.dataset.authenticatedApp = "true";
  root.dataset.reduceMotion = String(settings.reduce_motion);
  root.dataset.defaultLandingPage = settings.default_landing_page;
  root.dataset.dashboardLayout = settings.dashboard_layout;
  root.lang = settings.language;
  root.style.colorScheme = isLightTheme(settings.app_theme) ? "light" : "dark";
}

function resetDocumentSettings() {
  const root = document.documentElement;
  root.dataset.theme = "command_dark";
  root.dataset.colorScheme = "dark";
  root.dataset.density = "balanced";
  root.dataset.sidebar = "expanded";
  root.dataset.font = "geist";
  root.dataset.textSize = "normal";
  root.dataset.lineHeight = "normal";
  root.dataset.cardStyle = "modern";
  root.dataset.reduceMotion = "false";
  delete root.dataset.authenticatedApp;
  delete root.dataset.defaultLandingPage;
  delete root.dataset.dashboardLayout;
  delete root.dataset.showDashboardNotes;
  delete root.dataset.showDashboardTasks;
  delete root.dataset.showDashboardReports;
  delete root.dataset.showDashboardAi;
  delete root.dataset.showDashboardCalendar;
  delete root.dataset.compactCards;
  root.style.colorScheme = "dark";
}

function normalizeClientSettings(settings: UserSettings): UserSettings {
  return {
    ...settings,
    appearance_preferences: normalizeAppearancePreferences(
      settings.appearance_preferences,
    ),
    dashboard_preferences: normalizeDashboardPreferences(
      settings.dashboard_preferences,
    ),
  };
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
      legacySettings.font_family &&
      APP_FONTS.includes(legacySettings.font_family)
    ) {
      nextSettings.font_family = legacySettings.font_family;
    }
    if (
      legacySettings.density &&
      APP_DENSITIES.includes(legacySettings.density)
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
    if (legacySettings.appearance_preferences) {
      nextSettings.appearance_preferences = normalizeAppearancePreferences(
        legacySettings.appearance_preferences,
      );
    }
    if (legacySettings.dashboard_preferences) {
      nextSettings.dashboard_preferences = normalizeDashboardPreferences(
        legacySettings.dashboard_preferences,
      );
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
    return normalizeClientSettings({
      ...settings,
      ...localFallback,
    });
  }

  return normalizeClientSettings({
    ...settings,
    ...(localTheme && isNewThemeId(localTheme)
      ? { app_theme: localTheme }
      : {}),
    ...(!settings.appearance_preferences &&
    localFallback.appearance_preferences
      ? { appearance_preferences: localFallback.appearance_preferences }
      : {}),
    ...(!settings.dashboard_preferences &&
    localFallback.dashboard_preferences
      ? { dashboard_preferences: localFallback.dashboard_preferences }
      : {}),
  });
}

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings: UserSettings;
}

export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const updateRequestId = useRef(0);
  const updateQueue = useRef<Promise<void>>(Promise.resolve());
  const [settings, setSettings] = useState(() =>
    mergePersistedSettings(initialSettings),
  );

  useEffect(() => {
    applyDocumentSettings(settings);
    saveLocalFallback(settings);
  }, [settings]);

  useEffect(() => () => resetDocumentSettings(), []);

  const replaceSettings = useCallback((nextSettings: UserSettings) => {
    const normalized = normalizeClientSettings(nextSettings);
    setSettings(normalized);
    applyDocumentSettings(normalized);
    saveLocalFallback(normalized);
  }, []);

  const updateSettings = useCallback(
    async (input: UpdateUserSettingsInput): Promise<string | null> => {
      const requestId = ++updateRequestId.current;
      const previous = settings;
      const optimistic = normalizeClientSettings({ ...previous, ...input });
      setSettings(optimistic);
      applyDocumentSettings(optimistic);
      saveLocalFallback(optimistic);

      const request = updateQueue.current.then(() => updateUserSettings(input));
      updateQueue.current = request.then(() => undefined);
      const result = await request;
      if (requestId !== updateRequestId.current) return null;

      if (result.error || !result.data) {
        setSettings(previous);
        applyDocumentSettings(previous);
        saveLocalFallback(previous);
        return result.error ?? "Ayarlar kaydedilemedi.";
      }

      const resolvedSettings = normalizeClientSettings(isNewThemeId(optimistic.app_theme)
        ? { ...result.data, app_theme: optimistic.app_theme }
        : result.data);
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
