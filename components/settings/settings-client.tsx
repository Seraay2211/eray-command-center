"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  Eye,
  Home,
  LayoutDashboard,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { AccountCard } from "@/components/settings/account-card";
import { SettingsSection } from "@/components/settings/settings-section";
import {
  SettingsSidebar,
  type SettingsTab,
} from "@/components/settings/settings-sidebar";
import { ThemeCard } from "@/components/settings/theme-card";
import { ToggleRow } from "@/components/settings/toggle-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DarkSelect } from "@/components/ui/dark-select";
import { APP_THEMES } from "@/lib/settings/themes";
import { cn } from "@/lib/utils";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/tasks";
import { formatTRY } from "@/lib/utils/currency";
import {
  exportFinanceData,
  exportNotesData,
  exportUserData,
  resetUserSettings,
} from "@/services/settings-service";
import type {
  AiActionKey,
  AppDensity,
  AppFontFamily,
  Category,
  DefaultLandingPage,
  SidebarMode,
  UpdateUserSettingsInput,
} from "@/types";

interface SettingsClientProps {
  aiProviderLabel: string;
  categories: Category[];
  initialError: string;
  userCreatedAt: string;
  userEmail: string;
}

const tabs: SettingsTab[] = [
  { id: "appearance", label: "Görünüm", icon: Eye },
  { id: "start", label: "Başlangıç Ekranı", icon: Home },
  { id: "notifications", label: "Bildirim Tercihleri", icon: Bell },
  { id: "finance", label: "Finans Tercihleri", icon: CircleDollarSign },
  { id: "ai", label: "AI Tercihleri", icon: Bot },
  { id: "workspace", label: "Çalışma Alanı", icon: SlidersHorizontal },
  { id: "data", label: "Veri ve Yedekleme", icon: Database },
];

const fontOptions = [
  { label: "Geist", value: "geist" },
  { label: "Sistem Yazı Tipi", value: "system" },
];

const densityOptions = [
  { label: "Rahat", value: "comfortable" },
  { label: "Kompakt", value: "compact" },
];

const sidebarOptions = [
  { label: "Geniş", value: "expanded" },
  { label: "Dar", value: "collapsed" },
];

const landingPageOptions = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Bugün", value: "today" },
  { label: "Notlar", value: "notes" },
  { label: "Finans", value: "finance" },
  { label: "Görevler", value: "tasks" },
];

const aiActionOptions = [
  { label: "Özetle", value: "summarize" },
  { label: "Kısa ve vurucu yap", value: "shorten" },
  { label: "Daha premium yaz", value: "premium" },
  { label: "Yönetici raporu oluştur", value: "manager_report" },
];

function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SettingsClient({
  aiProviderLabel,
  categories,
  initialError,
  userCreatedAt,
  userEmail,
}: SettingsClientProps) {
  const { replaceSettings, settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");
  const [themeFilter, setThemeFilter] = useState<
    "all" | "dark" | "light" | "colorful"
  >("all");
  const [displayName, setDisplayName] = useState(settings.display_name ?? "");
  const [criticalThreshold, setCriticalThreshold] = useState(
    String(settings.critical_debt_threshold),
  );
  const [pendingKey, setPendingKey] = useState("");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const noticeTimer = useRef<number | null>(null);
  const activeTheme =
    APP_THEMES.find((theme) => theme.id === settings.app_theme)?.name ??
    settings.app_theme;
  const filteredThemes = APP_THEMES.filter((theme) => {
    if (themeFilter === "all") return true;
    if (themeFilter === "colorful") return theme.category === "colorful";
    return theme.mode === themeFilter;
  });

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) {
        window.clearTimeout(noticeTimer.current);
      }
    },
    [],
  );

  function showNotice(message: string) {
    if (noticeTimer.current !== null) {
      window.clearTimeout(noticeTimer.current);
    }
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  }

  async function savePatch(
    key: string,
    input: UpdateUserSettingsInput,
    successMessage = "Ayarlar kaydedildi.",
  ) {
    setPendingKey(key);
    setError("");
    const nextError = await updateSettings(input);
    setPendingKey("");

    if (nextError) {
      setError(nextError);
      return;
    }

    showNotice(successMessage);
  }

  async function handleExport(
    type: "all" | "notes" | "finance",
  ) {
    setPendingKey(`export-${type}`);
    setError("");
    const result =
      type === "all"
        ? await exportUserData()
        : type === "notes"
          ? await exportNotesData()
          : await exportFinanceData();
    setPendingKey("");

    if (result.error || !result.data) {
      setError(result.error ?? "Veriler dışa aktarılamadı.");
      return;
    }

    const date = result.data.exported_at.slice(0, 10);
    const label =
      type === "all" ? "tum-veriler" : type === "notes" ? "notlar" : "finans";
    downloadJson(`eray-command-center-${label}-${date}.json`, result.data);
    showNotice("Dışa aktarma tamamlandı.");
  }

  async function handleReset() {
    setPendingKey("reset");
    setError("");
    const result = await resetUserSettings();
    setPendingKey("");

    if (result.error || !result.data) {
      setError(result.error ?? "Ayarlar sıfırlanamadı.");
      return;
    }

    replaceSettings(result.data);
    setDisplayName(result.data.display_name ?? "");
    setCriticalThreshold(String(result.data.critical_debt_threshold));
    setIsResetOpen(false);
    showNotice("Ayarlar varsayılan değerlere döndürüldü.");
  }

  const categoryOptions = [
    { label: "Kategori yok", value: "" },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ];
  const visibleError = error.includes("phase-18-settings-center.sql")
    ? "Ayarlar şu anda kaydedilemiyor. Lütfen daha sonra tekrar dene."
    : error;

  return (
    <div className="app-page-stack mx-auto w-full max-w-6xl min-w-0 space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-primary text-[10px] font-semibold tracking-[0.18em]">
            KONTROL MERKEZİ
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
            Ayarlar
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
            Eray Command Center deneyimini, görünümünü ve çalışma tercihlerini
            buradan yönet.
          </p>
        </div>
        <span className="app-surface-2 app-border app-text inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium">
          <CheckCircle2 className="size-3.5 text-[var(--success)]" />
          Tercihler hesabınla eşitleniyor
        </span>
      </header>

      {notice ? (
        <div
          className="app-card fixed inset-x-3 top-20 z-[130] rounded-xl border px-4 py-3 text-xs font-medium text-[var(--success)] shadow-xl sm:left-auto sm:right-4"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-4 text-xs leading-6 app-text"
          role="alert"
        >
          <p>{visibleError}</p>
        </div>
      ) : null}

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <SettingsSidebar
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={tabs}
        />

        <div className="min-w-0 max-w-5xl">
          {activeTab === "appearance" ? (
            <SettingsSection
              description="Tema, yazı tipi, yoğunluk ve hareket tercihlerini düzenle."
              icon={Eye}
              title="Görünüm"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">Yazı Tipi</p>
                  <DarkSelect
                    ariaLabel="Yazı tipi"
                    onChange={(value) =>
                      void savePatch("font", {
                        font_family: value as AppFontFamily,
                      })
                    }
                    options={fontOptions}
                    value={settings.font_family}
                  />
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Arayüz Yoğunluğu
                  </p>
                  <DarkSelect
                    ariaLabel="Arayüz yoğunluğu"
                    onChange={(value) =>
                      void savePatch("density", {
                        density: value as AppDensity,
                      })
                    }
                    options={densityOptions}
                    value={settings.density}
                  />
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Kenar Çubuğu
                  </p>
                  <DarkSelect
                    ariaLabel="Kenar çubuğu görünümü"
                    onChange={(value) =>
                      void savePatch("sidebar", {
                        sidebar_mode: value as SidebarMode,
                      })
                    }
                    options={sidebarOptions}
                    value={settings.sidebar_mode}
                  />
                </div>
              </div>

              <ToggleRow
                checked={settings.reduce_motion}
                description="Animasyon ve geçişleri en aza indirir."
                label="Animasyonları Azalt"
                onChange={(checked) =>
                  void savePatch("motion", { reduce_motion: checked })
                }
              />

              <div>
                <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="app-text text-sm font-medium">Tema</p>
                  <div
                    aria-label="Tema filtresi"
                    className="app-surface-2 app-border grid w-full grid-cols-4 rounded-lg border p-1 sm:w-auto"
                    role="group"
                  >
                    {[
                      { label: "Tümü", value: "all" },
                      { label: "Koyu", value: "dark" },
                      { label: "Açık", value: "light" },
                      { label: "Renkli", value: "colorful" },
                    ].map((filter) => (
                      <button
                        aria-pressed={themeFilter === filter.value}
                        className={cn(
                          "min-w-0 rounded-md px-2 py-1.5 text-[10px] font-medium transition",
                          themeFilter === filter.value
                            ? "bg-[var(--surface)] app-text shadow-sm"
                            : "app-muted hover:app-text",
                        )}
                        key={filter.value}
                        onClick={() =>
                          setThemeFilter(
                            filter.value as typeof themeFilter,
                          )
                        }
                        type="button"
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredThemes.map((theme) => (
                    <ThemeCard
                      isActive={settings.app_theme === theme.id}
                      key={theme.id}
                      onSelect={() =>
                        void savePatch(
                          `theme-${theme.id}`,
                          { app_theme: theme.id },
                          "Tema uygulandı.",
                        )
                      }
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "start" ? (
            <SettingsSection
              description="Uygulama açıldığında ve yeni kayıt oluştururken kullanılacak varsayılanları belirle."
              icon={Home}
              title="Başlangıç Ekranı"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan Açılış Ekranı
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan açılış ekranı"
                    onChange={(value) =>
                      void savePatch("landing-page", {
                        default_landing_page: value as DefaultLandingPage,
                      })
                    }
                    options={landingPageOptions}
                    value={settings.default_landing_page}
                  />
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan Not Kategorisi
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan not kategorisi"
                    onChange={(value) =>
                      void savePatch("note-category", {
                        default_note_category_id: value || null,
                      })
                    }
                    options={categoryOptions}
                    value={settings.default_note_category_id ?? ""}
                  />
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan Görev Durumu
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan görev durumu"
                    onChange={(value) =>
                      void savePatch("task-status", {
                        default_task_status:
                          value as typeof settings.default_task_status,
                      })
                    }
                    options={TASK_STATUS_OPTIONS}
                    value={settings.default_task_status}
                  />
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan Görev Önceliği
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan görev önceliği"
                    onChange={(value) =>
                      void savePatch("task-priority", {
                        default_task_priority:
                          value as typeof settings.default_task_priority,
                      })
                    }
                    options={TASK_PRIORITY_OPTIONS}
                    value={settings.default_task_priority}
                  />
                </div>
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "notifications" ? (
            <SettingsSection
              description="Uygulama içindeki uyarı türlerini ve kritik kayıtların görünürlüğünü yönet."
              icon={Bell}
              title="Bildirim Tercihleri"
            >
              <ToggleRow
                checked={settings.notifications_enabled}
                description="Üst bardaki bildirim merkezi ve uygulama içi uyarıları gösterir."
                label="Uygulama İçi Bildirimler"
                onChange={(checked) =>
                  void savePatch("notifications", {
                    notifications_enabled: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.finance_alerts_enabled}
                description="Vadesi yaklaşan ve gecikmiş borç bildirimlerini gösterir."
                label="Finans Uyarıları"
                onChange={(checked) =>
                  void savePatch("finance-alerts", {
                    finance_alerts_enabled: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.task_alerts_enabled}
                description="Bugünkü ve gecikmiş görev uyarılarını gösterir."
                label="Görev Uyarıları"
                onChange={(checked) =>
                  void savePatch("task-alerts", {
                    task_alerts_enabled: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.calendar_alerts_enabled}
                description="Takvim ve plan kayıtları için uygulama içi uyarıları gösterir."
                label="Takvim Uyarıları"
                onChange={(checked) =>
                  void savePatch("calendar-alerts", {
                    calendar_alerts_enabled: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.highlight_critical_alerts}
                description="Kritik uyarıları listelerde daha görünür hale getirir."
                label="Kritik Uyarıları Öne Çıkar"
                onChange={(checked) =>
                  void savePatch("critical-alerts", {
                    highlight_critical_alerts: checked,
                  })
                }
              />
            </SettingsSection>
          ) : null}

          {activeTab === "finance" ? (
            <SettingsSection
              description="Para gösterimi ve borç önceliklendirme tercihlerini düzenle."
              icon={CircleDollarSign}
              title="Finans Tercihleri"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan Para Birimi
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan para birimi"
                    onChange={() => undefined}
                    options={[{ label: "Türk Lirası (TRY)", value: "TRY" }]}
                    value={settings.default_currency}
                  />
                </div>
                <div className="app-surface-2 app-border rounded-xl border px-4 py-3">
                  <p className="app-muted text-[10px] font-medium">
                    Para Formatı
                  </p>
                  <p className="app-text mt-1 font-mono text-lg font-semibold">
                    {formatTRY(100000)}
                  </p>
                </div>
              </div>

              <ToggleRow
                checked={settings.highlight_overdue_debts}
                description="Gecikmiş borçları finans listelerinde daha görünür gösterir."
                label="Gecikmiş Borçları Öne Çıkar"
                onChange={(checked) =>
                  void savePatch("overdue-debts", {
                    highlight_overdue_debts: checked,
                  })
                }
              />

              <div className="app-surface-2 app-border rounded-xl border p-4">
                <label className="app-text text-sm font-medium">
                  Kritik Borç Eşiği
                  <input
                    className="app-input mt-2 h-10 w-full rounded-[10px] border px-3 text-sm outline-none"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) =>
                      setCriticalThreshold(event.target.value)
                    }
                    type="number"
                    value={criticalThreshold}
                  />
                </label>
                <p className="app-muted mt-2 text-[11px]">
                  Bu tutarın üzerindeki açık borçlar kritik değerlendirmeye
                  alınabilir.
                </p>
                <Button
                  className="mt-3"
                  disabled={pendingKey === "debt-threshold"}
                  onClick={() =>
                    void savePatch("debt-threshold", {
                      critical_debt_threshold: Number(criticalThreshold),
                    })
                  }
                  size="sm"
                >
                  {pendingKey === "debt-threshold" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Eşiği Kaydet
                </Button>
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "ai" ? (
            <SettingsSection
              description="AI özetlerinin görünümünü ve yanıt biçimini yönet."
              icon={Bot}
              title="AI Tercihleri"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="app-surface-2 app-border rounded-xl border p-4">
                  <p className="app-muted text-[10px] font-medium">
                    AI Modu
                  </p>
                  <p className="app-text mt-2 text-sm font-semibold">
                    {aiProviderLabel}
                  </p>
                  <p className="app-muted mt-1 text-[11px]">
                    Seçili akıllı asistan modu uygulama genelinde kullanılır.
                  </p>
                </div>
                <div>
                  <p className="app-muted mb-2 text-xs font-medium">
                    Varsayılan AI Aksiyonu
                  </p>
                  <DarkSelect
                    ariaLabel="Varsayılan AI aksiyonu"
                    onChange={(value) =>
                      void savePatch("ai-action", {
                        ai_default_action: value as AiActionKey,
                      })
                    }
                    options={aiActionOptions}
                    value={settings.ai_default_action}
                  />
                </div>
              </div>
              <ToggleRow
                checked={settings.show_ai_summaries}
                description="Bugün ve finans ekranlarında AI özet alanlarını gösterir."
                label="AI Özetlerini Göster"
                onChange={(checked) =>
                  void savePatch("ai-summaries", {
                    show_ai_summaries: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.show_finance_ai_warning}
                description="Finans AI çıktılarında bilgilendirme metnini gösterir."
                label="Finans Uyarı Metnini Göster"
                onChange={(checked) =>
                  void savePatch("finance-ai-warning", {
                    show_finance_ai_warning: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.short_ai_response_mode}
                description="AI yanıtlarını daha kısa ve doğrudan üretmeye yönlendirir."
                label="Kısa Yanıt Modu"
                onChange={(checked) =>
                  void savePatch("short-ai", {
                    short_ai_response_mode: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.ai_save_history}
                description="Tamamlanan AI işlemlerini kişisel geçmişinde saklar."
                label="AI İşlem Geçmişini Kaydet"
                onChange={(checked) =>
                  void savePatch("ai-history", { ai_save_history: checked })
                }
              />
            </SettingsSection>
          ) : null}

          {activeTab === "workspace" ? (
            <SettingsSection
              description="Hesap bilgilerini ve dashboard üzerinde görünen bölümleri yönet."
              icon={LayoutDashboard}
              title="Çalışma Alanı"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-muted text-xs font-medium">
                  E-posta
                  <input
                    className="app-input mt-2 h-10 w-full rounded-[10px] border px-3 text-sm outline-none"
                    disabled
                    value={userEmail}
                  />
                </label>
                <label className="app-muted text-xs font-medium">
                  Görünen Ad
                  <input
                    className="app-input mt-2 h-10 w-full rounded-[10px] border px-3 text-sm outline-none"
                    maxLength={80}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Eray"
                    value={displayName}
                  />
                </label>
              </div>
              <Button
                disabled={pendingKey === "profile"}
                onClick={() =>
                  void savePatch(
                    "profile",
                    { display_name: displayName },
                    "Profil güncellendi.",
                  )
                }
              >
                {pendingKey === "profile" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Profili Kaydet
              </Button>
              <AccountCard
                activeTheme={activeTheme}
                createdAt={userCreatedAt}
                email={userEmail}
                isOnboardingPending={pendingKey === "onboarding"}
                onShowOnboarding={() =>
                  void savePatch(
                    "onboarding",
                    { onboarding_completed: false },
                    "Onboarding Dashboard’da tekrar gösterilecek.",
                  )
                }
              />
              <ToggleRow
                checked={settings.show_dashboard_notes}
                description="Son notlar bölümünü dashboard üzerinde gösterir."
                label="Notlar Kartını Göster"
                onChange={(checked) =>
                  void savePatch("dashboard-notes", {
                    show_dashboard_notes: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.show_dashboard_tasks}
                description="Açık görevler bölümünü dashboard üzerinde gösterir."
                label="Görevler Kartını Göster"
                onChange={(checked) =>
                  void savePatch("dashboard-tasks", {
                    show_dashboard_tasks: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.show_dashboard_reports}
                description="Son raporlar bölümünü dashboard üzerinde gösterir."
                label="Raporlar Kartını Göster"
                onChange={(checked) =>
                  void savePatch("dashboard-reports", {
                    show_dashboard_reports: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.show_dashboard_calendar}
                description="Bugünün planı bölümünü dashboard üzerinde gösterir."
                label="Takvim Kartını Göster"
                onChange={(checked) =>
                  void savePatch("dashboard-calendar", {
                    show_dashboard_calendar: checked,
                  })
                }
              />
              <ToggleRow
                checked={settings.confirm_before_delete}
                description="Kayıtları silmeden önce onay penceresi gösterir."
                label="Silmeden Önce Onay İste"
                onChange={(checked) =>
                  void savePatch("confirm-delete", {
                    confirm_before_delete: checked,
                  })
                }
              />
            </SettingsSection>
          ) : null}

          {activeTab === "data" ? (
            <SettingsSection
              description="Kişisel verilerini güvenli JSON dosyaları olarak dışa aktar."
              icon={Database}
              title="Veri ve Yedekleme"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  disabled={pendingKey.startsWith("export-")}
                  onClick={() => void handleExport("all")}
                  variant="secondary"
                >
                  {pendingKey === "export-all" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Verileri Dışa Aktar
                </Button>
                <Button
                  disabled={pendingKey.startsWith("export-")}
                  onClick={() => void handleExport("notes")}
                  variant="secondary"
                >
                  {pendingKey === "export-notes" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Notları Dışa Aktar
                </Button>
                <Button
                  disabled={pendingKey.startsWith("export-")}
                  onClick={() => void handleExport("finance")}
                  variant="secondary"
                >
                  {pendingKey === "export-finance" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Finans Verilerini Dışa Aktar
                </Button>
              </div>
              <div className="app-surface-2 app-border rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 text-[var(--success)]" />
                  <div>
                    <p className="app-text text-sm font-medium">
                      Veriler hesabına bağlıdır
                    </p>
                    <p className="app-muted mt-1 text-[11px] leading-5">
                      Dışa aktarma işlemleri yalnızca aktif oturum kullanıcısının
                      kayıtlarını içerir.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsResetOpen(true)}
                variant="secondary"
              >
                <RotateCcw className="size-4" />
                Ayarları Sıfırla
              </Button>
            </SettingsSection>
          ) : null}

        </div>
      </div>

      {isResetOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            aria-label="Sıfırlama penceresini kapat"
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsResetOpen(false)}
            type="button"
          />
          <Card
            aria-modal="true"
            className="relative w-full max-w-md p-5"
            role="dialog"
          >
            <h2 className="app-text text-lg font-semibold">
              Ayarlar sıfırlansın mı?
            </h2>
            <p className="app-muted mt-2 text-sm leading-6">
              Tema, yoğunluk, yazı tipi ve diğer çalışma tercihleri varsayılan
              değerlere dönecek.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={pendingKey === "reset"}
                onClick={() => setIsResetOpen(false)}
                variant="secondary"
              >
                İptal
              </Button>
              <Button
                disabled={pendingKey === "reset"}
                onClick={() => void handleReset()}
              >
                {pendingKey === "reset" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Sıfırla
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
