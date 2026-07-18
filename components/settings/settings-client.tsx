"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  Eye,
  Home,
  LayoutDashboard,
  LoaderCircle,
  Megaphone,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { AccountCard } from "@/components/settings/account-card";
import { AccountCenter } from "@/components/settings/account-center";
import { AppearanceCenter } from "@/components/settings/appearance-center";
import { DashboardLayoutSettings } from "@/components/settings/dashboard-layout-settings";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsOverview } from "@/components/settings/settings-overview";
import {
  SettingsSidebar,
  type SettingsTab,
} from "@/components/settings/settings-sidebar";
import { ToggleRow } from "@/components/settings/toggle-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DarkSelect } from "@/components/ui/dark-select";
import { getThemeById } from "@/lib/settings/themes";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/tasks";
import { getUserFacingError } from "@/lib/user-facing-error";
import { formatTRY } from "@/lib/utils/currency";
import {
  exportFinanceData,
  exportNotesData,
  exportTasksData,
  exportUserData,
  resetUserSettings,
} from "@/services/settings-service";
import type {
  AccountCenterData,
  AiActionKey,
  Category,
  DefaultLandingPage,
  UpdateUserSettingsInput,
} from "@/types";

interface SettingsClientProps {
  accountData: AccountCenterData;
  aiProviderLabel: string;
  categories: Category[];
  initialError: string;
  userCreatedAt: string;
  userEmail: string;
  userLastSignInAt: string;
}

const tabs: SettingsTab[] = [
  { group: "GENEL", id: "overview", label: "Genel Bakış", icon: SlidersHorizontal },
  { group: "HESAP", id: "account", label: "Hesap Merkezi", icon: UserRound },
  { group: "HESAP", id: "data", label: "Veri ve Yedekleme", icon: Database },
  { group: "DENEYİM", id: "appearance", label: "Görünüm Merkezi", icon: Eye },
  { group: "DENEYİM", id: "dashboard", label: "Dashboard Düzeni", icon: LayoutDashboard },
  { group: "DENEYİM", id: "start", label: "Başlangıç Ekranı", icon: Home },
  { group: "ÇALIŞMA", id: "notifications", label: "Bildirimler", icon: Bell },
  { group: "ÇALIŞMA", id: "finance", label: "Finans Tercihleri", icon: CircleDollarSign },
  { group: "ÇALIŞMA", id: "ai", label: "AI Tercihleri", icon: Bot },
  { group: "ÇALIŞMA", id: "workspace", label: "Çalışma Alanı", icon: SlidersHorizontal },
  { group: "YARDIM", id: "guide", label: "Kullanım Rehberi", icon: BookOpen },
  { group: "YARDIM", id: "news", label: "Yenilikler", icon: Megaphone },
];

const tabDescriptions: Record<string, string> = {
  account: "Profil, güvenlik, gizlilik ve hesap kontrollerini düzenle.",
  ai: "Akıllı asistanın yanıt biçimini ve görünürlüğünü yönet.",
  appearance: "Tema, yazı tipi, yoğunluk ve arayüz hissini ayarla.",
  dashboard: "Komuta ekranındaki bölümlerin görünürlüğünü ve sırasını belirle.",
  data: "Kayıtlarını dışa aktar ve kişisel arşivini güvence altına al.",
  finance: "Para gösterimi ve borç önceliklendirme tercihlerini düzenle.",
  guide: "Uygulamayı daha verimli kullanmak için kısa rehberleri incele.",
  news: "Son iyileştirmeler ve lansman notlarını gör.",
  notifications: "Bildirim ve uyarı davranışlarını sade şekilde yönet.",
  overview: "Hesap, görünüm, veri ve çalışma tercihlerini tek merkezden yönet.",
  start: "Uygulama açılışı ve yeni kayıt varsayılanlarını belirle.",
  workspace: "Profil adı ve temel çalışma alanı davranışlarını düzenle.",
};

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
  downloadFile(fileName, JSON.stringify(value, null, 2), "application/json");
}

function downloadFile(fileName: string, value: string, type: string) {
  const blob = new Blob([value], {
    type: `${type};charset=utf-8`,
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
  accountData,
  aiProviderLabel,
  categories,
  initialError,
  userCreatedAt,
  userEmail,
  userLastSignInAt,
}: SettingsClientProps) {
  const { replaceSettings, settings, updateSettings } = useSettings();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as SettingsTab["id"] | null;
  const initialTab = tabs.some((tab) => tab.id === tabFromUrl)
    ? tabFromUrl!
    : "overview";
  const [manualActiveTab, setManualActiveTab] =
    useState<SettingsTab["id"] | null>(null);
  const activeTab = manualActiveTab ?? initialTab;
  const [displayName, setDisplayName] = useState(settings.display_name ?? "");
  const [criticalThreshold, setCriticalThreshold] = useState(
    String(settings.critical_debt_threshold),
  );
  const [pendingKey, setPendingKey] = useState("");
  const [error, setError] = useState(() =>
    initialError ? getUserFacingError(initialError) : "",
  );
  const [notice, setNotice] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const noticeTimer = useRef<number | null>(null);
  const activeTheme =
    getThemeById(settings.app_theme)?.name ?? settings.app_theme;
  const activeTabMeta =
    tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

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
      setError(
        key === "font"
          ? "Yazı tipi kaydedilemedi. Birazdan tekrar deneyebilirsin."
          : getUserFacingError(nextError, "Ayarlar kaydedilemedi."),
      );
      return;
    }

    showNotice(successMessage);
  }

  async function handleExport(
    type: "all" | "notes-json" | "notes-text" | "finance-csv" | "tasks-csv",
  ) {
    setPendingKey(`export-${type}`);
    setError("");
    const result =
      type === "all"
        ? await exportUserData()
        : type === "notes-json" || type === "notes-text"
          ? await exportNotesData()
          : type === "tasks-csv"
            ? await exportTasksData()
            : await exportFinanceData();
    setPendingKey("");

    if (result.error || !result.data) {
      setError(
        getUserFacingError(
          result.error,
          "Dışa aktarma tamamlanamadı. Birazdan tekrar deneyebilirsin.",
        ),
      );
      return;
    }

    const date = result.data.exported_at.slice(0, 10);
    if (type === "all") {
      downloadJson(`eray-command-center-yedek-${date}.json`, result.data);
    } else if (type === "notes-json") {
      downloadJson(`eray-command-center-notlar-${date}.json`, {
        exported_at: result.data.exported_at,
        notes: "notes" in result.data ? result.data.notes : [],
      });
    } else if (type === "notes-text") {
      downloadFile(
        `eray-command-center-notlar-${date}.txt`,
        "text" in result.data ? result.data.text : "",
        "text/plain",
      );
    } else if (type === "tasks-csv") {
      downloadFile(
        `eray-command-center-gorevler-${date}.csv`,
        "csv" in result.data ? result.data.csv : "",
        "text/csv",
      );
    } else {
      downloadFile(
        `eray-command-center-finans-${date}.csv`,
        "csv" in result.data ? result.data.csv : "",
        "text/csv",
      );
    }
    showNotice("Dışa aktarma tamamlandı.");
  }

  async function handleReset() {
    setPendingKey("reset");
    setError("");
    const result = await resetUserSettings();
    setPendingKey("");

    if (result.error || !result.data) {
      setError(getUserFacingError(result.error, "Ayarlar sıfırlanamadı."));
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
  const visibleError = error
    ? getUserFacingError(
        error,
        "Ayarlar şu anda kaydedilemiyor. Lütfen daha sonra tekrar dene.",
      )
    : "";

  return (
    <div className="app-page-stack mx-auto w-full max-w-6xl min-w-0 space-y-5">
      <header className="app-visual-hero relative overflow-hidden rounded-[1.75rem] border p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_70%)] blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-primary text-[10px] font-semibold tracking-[0.18em]">
            AYARLAR
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
            {activeTabMeta.label}
          </h1>
          <p className="app-muted mt-2 max-w-2xl text-sm leading-6">
            {tabDescriptions[activeTab] ?? tabDescriptions.overview}
          </p>
        </div>
        <span className="app-surface-2 app-border app-text inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-medium">
          <CheckCircle2 className="size-3.5 text-[var(--success)]" />
          Tercihler hesabınla eşitleniyor
        </span>
        </div>
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
          onChange={setManualActiveTab}
          tabs={tabs}
        />

        <div className="min-w-0 max-w-5xl">
          {activeTab === "overview" ? (
            <SettingsOverview
              accountData={accountData}
              activeTheme={activeTheme}
              onOpenTab={setManualActiveTab}
              settings={settings}
            />
          ) : null}

          {activeTab === "account" ? (
            <AccountCenter
              accountData={accountData}
              activeTheme={activeTheme}
              onOpenAi={() => setManualActiveTab("ai")}
              onOpenData={() => setManualActiveTab("data")}
              onSave={savePatch}
              settings={settings}
              userCreatedAt={userCreatedAt}
              userEmail={userEmail}
              userLastSignInAt={userLastSignInAt}
            />
          ) : null}

          {activeTab === "appearance" ? (
            <AppearanceCenter onSave={savePatch} settings={settings} />
          ) : null}

          {activeTab === "dashboard" ? (
            <SettingsSection
              description="Komuta ekranında görmek istediğin bölümleri ve önceliklerini sakin bir düzende yönet."
              icon={LayoutDashboard}
              title="Dashboard Düzeni"
            >
              <DashboardLayoutSettings
                onSave={savePatch}
                preferences={settings.dashboard_preferences}
              />
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
              description="Hesap bilgilerini ve temel çalışma alanı davranışlarını yönet."
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
                isOnboardingPending={false}
                onShowOnboarding={() => {
                  localStorage.removeItem("ecc-launch-readiness-hidden-v23-1");
                  showNotice("Başlangıç kartı Dashboard’da tekrar gösterilecek.");
                }}
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
              description="Kayıtlarını dışa aktar ve kişisel arşivini güvence altında tut."
              icon={Database}
              title="Veri ve Yedekleme"
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    description:
                      "Başlık, içerik, kategori, etiket ve not durumları JSON olarak indirilir.",
                    key: "notes-json" as const,
                    label: "Notları Dışa Aktar",
                  },
                  {
                    description:
                      "Borçlar, taksit bilgisi, kalan tutar ve ödeme geçmişi CSV olarak indirilir.",
                    key: "finance-csv" as const,
                    label: "Finans Kayıtlarını Dışa Aktar",
                  },
                  {
                    description:
                      "Aktif, tamamlanan ve arşivlenen görev kayıtları CSV olarak indirilir.",
                    key: "tasks-csv" as const,
                    label: "Görevleri Dışa Aktar",
                  },
                  {
                    description:
                      "Not, görev, finans, takvim, rapor, şablon ve güvenli ayar yedeği JSON olarak indirilir.",
                    key: "all" as const,
                    label: "Tüm Verilerimi Dışa Aktar",
                  },
                ].map((item) => (
                  <button
                    className="app-surface-2 app-border flex min-h-36 min-w-0 flex-col items-start justify-between rounded-2xl border p-4 text-left transition hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pendingKey.startsWith("export-")}
                    key={item.key}
                    onClick={() => void handleExport(item.key)}
                    type="button"
                  >
                    <span className="flex w-full min-w-0 items-start gap-3">
                      <span className="app-primary-bg flex size-9 shrink-0 items-center justify-center rounded-xl">
                        {pendingKey === `export-${item.key}` ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="app-text block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="app-muted mt-1 block text-[11px] leading-5">
                          {item.description}
                        </span>
                      </span>
                    </span>
                    <span className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--primary-contrast)]">
                      {pendingKey === `export-${item.key}` ? (
                        <>
                          <LoaderCircle className="size-3.5 animate-spin" />
                          Dışa aktarılıyor...
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" />
                          Dışa Aktar
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="app-surface-2 app-border rounded-xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="app-text text-sm font-semibold">
                      Notları temiz metin olarak da arşivle
                    </p>
                    <p className="app-muted mt-1 text-[11px] leading-5">
                      Uzun notları hızlı okumak için ek TXT çıktısı alabilirsin.
                    </p>
                  </div>
                  <Button
                    disabled={pendingKey.startsWith("export-")}
                    onClick={() => void handleExport("notes-text")}
                    variant="secondary"
                  >
                    {pendingKey === "export-notes-text" ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    TXT İndir
                  </Button>
                </div>
              </div>
              <div className="app-surface-2 app-border rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 text-[var(--success)]" />
                  <div>
                    <p className="app-text text-sm font-medium">
                      Yedekler sadece sana ait kayıtları içerir
                    </p>
                    <p className="app-muted mt-1 text-[11px] leading-5">
                      Oturum, anahtar veya gizli yapılandırma bilgileri dışa
                      aktarılmaz. Türkçe karakterler dosyalarda korunur.
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

          {activeTab === "guide" ? (
            <SettingsSection
              description="Uygulamadaki ana alanları hızlıca hatırla ve doğru ekrana tek adımda geç."
              icon={BookOpen}
              title="Kullanım Rehberi"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    description:
                      "Günlük durum, öncelikler, hızlı kayıt ve finans sinyallerini tek ekranda takip et.",
                    href: "/dashboard",
                    label: "Dashboard’u kullan",
                  },
                  {
                    description:
                      "Notlarını tam ekran editörde yaz, hızlı kayıtları işle ve şablonlardan yararlan.",
                    href: "/notes",
                    label: "Not akışını yönet",
                  },
                  {
                    description:
                      "Borç, taksit, ödeme ve dekont takibini finans merkezinden kontrol et.",
                    href: "/finance",
                    label: "Finansı takip et",
                  },
                  {
                    description:
                      "Görevleri ve planları günlük akışa bağlayarak günü daha görünür hale getir.",
                    href: "/calendar",
                    label: "Takvim ve görevleri planla",
                  },
                ].map((item) => (
                  <Link
                    className="app-surface-2 app-border rounded-2xl border p-4 transition hover:border-[color-mix(in_srgb,var(--primary)_42%,var(--border))]"
                    href={item.href}
                    key={item.label}
                  >
                    <p className="app-text text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="app-muted mt-2 text-xs leading-5">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </SettingsSection>
          ) : null}

          {activeTab === "news" ? (
            <SettingsSection
              description="Lansman öncesi yapılan son arayüz ve deneyim iyileştirmelerini gör."
              icon={Megaphone}
              title="Yenilikler"
            >
              <div className="grid gap-3">
                {[
                  "Premium Dashboard görünümü ve komuta aksiyonları yenilendi.",
                  "Hesap Merkezi, gizlilik modu ve veri kontrolleri eklendi.",
                  "Finans taksit, ödeme ve dekont akışları stabilize edildi.",
                  "Tema, yazı tipi ve dashboard kişiselleştirme merkezi güçlendirildi.",
                ].map((item) => (
                  <div
                    className="app-surface-2 app-border flex items-start gap-3 rounded-2xl border p-4"
                    key={item}
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                    <p className="app-text text-sm leading-6">{item}</p>
                  </div>
                ))}
              </div>
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
