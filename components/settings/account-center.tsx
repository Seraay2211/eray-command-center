"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ClipboardCopy,
  Database,
  Download,
  FileText,
  HelpCircle,
  KeyRound,
  LoaderCircle,
  ShieldHalf,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/settings/segmented-control";
import { DEFAULT_APPEARANCE_PREFERENCES } from "@/lib/settings/appearance-preferences";
import { getUserFacingError } from "@/lib/user-facing-error";
import {
  createAccountDeletionRequestNote,
  createFeedbackNote,
  sendPasswordResetEmail,
} from "@/services/account-service";
import type {
  AccountCenterData,
  AiResponseTone,
  DailySummaryStyle,
  UpdateUserSettingsInput,
  UserSettings,
} from "@/types";

interface AccountCenterProps {
  accountData: AccountCenterData;
  activeTheme: string;
  onOpenAi: () => void;
  onOpenData: () => void;
  onSave: (
    key: string,
    input: UpdateUserSettingsInput,
    successMessage?: string,
  ) => Promise<void>;
  settings: UserSettings;
  userCreatedAt: string;
  userEmail: string;
  userLastSignInAt: string;
}

const backupOptions = [
  { label: "Kapalı", value: "off" },
  { label: "Haftalık", value: "weekly" },
  { label: "Aylık", value: "monthly" },
] as const;

const aiToneOptions = [
  { label: "Profesyonel", value: "professional" },
  { label: "Sade", value: "simple" },
  { label: "Detaylı", value: "detailed" },
] as const;

const dailySummaryOptions = [
  { label: "Kısa", value: "short" },
  { label: "Dengeli", value: "balanced" },
  { label: "Detaylı", value: "detailed" },
] as const;

function formatDateTime(value: string): string {
  if (!value) return "Henüz yeterli bilgi yok";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayName(settings: UserSettings, email: string): string {
  if (settings.display_name?.trim()) return settings.display_name.trim();
  const prefix = email.split("@")[0]?.trim();
  return prefix || "Eray";
}

function buildHealthItems(settings: UserSettings, email: string) {
  const appearance = settings.appearance_preferences;

  return [
    { done: Boolean(email), label: "E-posta tanımlı" },
    { done: true, label: "Şifre yönetimi hazır" },
    { done: true, label: "Veri yedekleme alanı hazır" },
    {
      done: typeof appearance?.hide_sensitive_amounts === "boolean",
      label: "Gizlilik modu tercihi seçildi",
    },
    {
      done: Boolean(settings.dashboard_preferences),
      label: "Dashboard düzeni kişiselleştirildi",
    },
    {
      done: appearance?.backup_reminder !== "off",
      label: "Yedekleme hatırlatıcısı seçildi",
    },
  ];
}

export function AccountCenter({
  accountData,
  activeTheme,
  onOpenAi,
  onOpenData,
  onSave,
  settings,
  userCreatedAt,
  userEmail,
  userLastSignInAt,
}: AccountCenterProps) {
  const [pendingKey, setPendingKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const appearance = settings.appearance_preferences;
  const displayName = getDisplayName(settings, userEmail);
  const avatarLetter = displayName.charAt(0).toLocaleUpperCase("tr-TR") || "E";
  const privacyEnabled = Boolean(appearance?.hide_sensitive_amounts);
  const backupReminder = appearance?.backup_reminder ?? "off";
  const healthItems = useMemo(
    () => buildHealthItems(settings, userEmail),
    [settings, userEmail],
  );
  const healthScore = healthItems.filter((item) => item.done).length;

  async function saveAppearancePatch(
    key: string,
    patch: Partial<NonNullable<UserSettings["appearance_preferences"]>>,
    successMessage: string,
  ) {
    setPendingKey(key);
    setError("");
    setNotice("");
    await onSave(
      key,
      {
        appearance_preferences: {
          ...DEFAULT_APPEARANCE_PREFERENCES,
          ...(appearance ?? {}),
          ...patch,
        },
      },
      successMessage,
    );
    setPendingKey("");
  }

  async function handlePasswordReset() {
    setPendingKey("password");
    setError("");
    setNotice("");
    const result = await sendPasswordResetEmail();
    setPendingKey("");

    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }

    setNotice("Şifre yenileme bağlantısı e-posta adresine gönderildi.");
  }

  async function handleCopyStatus() {
    const lines = [
      "Eray Command Center",
      `Tarih: ${new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Istanbul",
      }).format(new Date())}`,
      `Sayfa: ${window.location.pathname}`,
      `Tema: ${activeTheme}`,
      `Tarayıcı: ${navigator.userAgent.split(" ").slice(0, 6).join(" ")}`,
      "Not: Bu özet anahtar, oturum veya kişisel içerik içermez.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setNotice("Güvenli sistem özeti kopyalandı.");
    } catch {
      setError("Sistem özeti kopyalanamadı. Birazdan tekrar deneyebilirsin.");
    }
  }

  async function handleFeedbackNote() {
    setPendingKey("feedback");
    setError("");
    setNotice("");
    const result = await createFeedbackNote();
    setPendingKey("");

    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }

    setNotice("Geri bildirim notu oluşturuldu.");
  }

  async function handleDeletionRequest() {
    if (deleteConfirm !== "SİLME TALEBİ") return;

    setPendingKey("delete-request");
    setError("");
    setNotice("");
    const result = await createAccountDeletionRequestNote();
    setPendingKey("");

    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }

    setDeleteConfirm("");
    setIsDeleteModalOpen(false);
    setNotice("Hesap silme talebi notu oluşturuldu. Otomatik silme yapılmadı.");
  }

  const dataCards = [
    ["Not", accountData.counts.noteCount],
    ["Görev", accountData.counts.taskCount],
    ["Finans Kaydı", accountData.counts.financeCount],
    ["Taksit", accountData.counts.installmentCount],
    ["Takvim", accountData.counts.calendarCount],
    ["Rapor", accountData.counts.reportCount],
  ];
  const activities = [
    ["Son not güncellemesi", accountData.activity.lastNoteActivity],
    ["Son görev hareketi", accountData.activity.lastTaskActivity],
    ["Son finans kaydı", accountData.activity.lastFinanceActivity],
    ["Son takvim kaydı", accountData.activity.lastCalendarActivity],
    ["Son rapor kaydı", accountData.activity.lastReportActivity],
  ];

  return (
    <div className="space-y-5">
      {notice ? (
        <div
          className="app-card rounded-xl border p-3 text-xs font-medium text-[var(--success)]"
          role="status"
        >
          {notice}
        </div>
      ) : null}
      {error ? (
        <div
          className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-3 text-xs text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_30%,transparent),transparent_60%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="app-primary-bg flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold">
                {avatarLetter}
              </span>
              <div className="min-w-0">
                <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.18em]">
                  Hesap Merkezi
                </p>
                <h2 className="app-text mt-1 break-words text-2xl font-semibold">
                  {displayName}
                </h2>
                <p className="app-muted mt-1 break-all text-xs" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>
            <span className="app-surface-2 app-border inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
              <CheckCircle2 className="size-4" />
              Aktif Hesap
            </span>
          </div>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="app-surface-2 rounded-xl border p-3">
              <p className="app-muted text-[10px]">Hesap oluşturma</p>
              <p className="app-text mt-1 text-xs font-semibold">
                {formatDateTime(userCreatedAt)}
              </p>
            </div>
            <div className="app-surface-2 rounded-xl border p-3">
              <p className="app-muted text-[10px]">Son giriş</p>
              <p className="app-text mt-1 text-xs font-semibold">
                {formatDateTime(userLastSignInAt)}
              </p>
            </div>
            <div className="app-surface-2 rounded-xl border p-3">
              <p className="app-muted text-[10px]">Aktif tema</p>
              <p className="app-text mt-1 text-xs font-semibold">
                {activeTheme}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Hesap Sağlığı
                </p>
                <h3 className="app-text mt-1 text-lg font-semibold">
                  {healthScore} / {healthItems.length}
                </h3>
              </div>
              <div className="app-surface-2 h-2 overflow-hidden rounded-full sm:w-44">
                <div
                  className="h-full rounded-full bg-[var(--primary)]"
                  style={{
                    width: `${Math.round((healthScore / healthItems.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {healthItems.map((item) => (
                <div
                  className="app-surface-2 flex items-center gap-2 rounded-xl border p-3 text-xs"
                  key={item.label}
                >
                  <CheckCircle2
                    className={
                      item.done
                        ? "size-4 text-[var(--success)]"
                        : "app-muted size-4"
                    }
                  />
                  <span className="app-text">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <ShieldHalf className="app-primary mt-1 size-5" />
              <div>
                <h3 className="app-text text-base font-semibold">Gizlilik</h3>
                <p className="app-muted mt-1 text-xs leading-5">
                  Finans tutarlarını ve hassas bilgileri ekranda gizleyerek daha
                  güvenli kullanım sağlar.
                </p>
              </div>
            </div>
            <SegmentedControl
              ariaLabel="Gizlilik modu"
              className="mt-4 sm:grid-cols-2"
              disabled={pendingKey === "privacy"}
              onChange={(value) =>
                void saveAppearancePatch(
                  "privacy",
                  { hide_sensitive_amounts: value === "on" },
                  value === "on"
                    ? "Gizlilik modu açıldı."
                    : "Gizlilik modu kapatıldı.",
                )
              }
              options={[
                { label: "Kapalı", value: "off" },
                { label: "Açık", value: "on" },
              ]}
              value={privacyEnabled ? "on" : "off"}
            />
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Database className="app-primary mt-1 size-5" />
              <div>
                <h3 className="app-text text-base font-semibold">
                  Veri Özeti
                </h3>
                <p className="app-muted mt-1 text-xs leading-5">
                  Çalışma alanındaki kayıt yoğunluğunu güvenli sayılarla gör.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dataCards.map(([label, count]) => (
                <div className="app-surface-2 rounded-xl border p-3" key={label}>
                  <p className="app-muted text-[10px]">{label}</p>
                  <p className="app-text mt-1 text-lg font-semibold">{count}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Download className="app-primary mt-1 size-5" />
              <div>
                <h3 className="app-text text-base font-semibold">
                  Veri ve Gizlilik
                </h3>
                <p className="app-muted mt-1 text-xs leading-6">
                  Kayıtların kişisel çalışma alanına bağlı tutulur. Dışa aktarma
                  araçlarıyla verilerini kişisel arşivine alabilirsin. Silme
                  işlemleri geri alınamayabilir, bu yüzden önce yedek alman
                  önerilir.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={onOpenData} type="button">
                <Download className="size-4" />
                Verilerimi Dışa Aktar
              </Button>
              <Button onClick={onOpenData} type="button" variant="secondary">
                Yedekleme Alanına Git
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <KeyRound className="app-primary mt-1 size-5" />
              <div>
                <h3 className="app-text text-base font-semibold">Güvenlik</h3>
                <p className="app-muted mt-1 text-xs leading-5">
                  Oturum durumu aktif. Şifre yönetimini e-posta bağlantısıyla
                  güvenli şekilde başlatabilirsin.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="app-surface-2 rounded-xl border p-3">
                <span className="app-muted">Oturum durumu</span>
                <p className="app-text mt-1 font-semibold">Aktif</p>
              </div>
              <div className="app-surface-2 rounded-xl border p-3">
                <span className="app-muted">Giriş e-postası</span>
                <p className="app-text mt-1 break-all font-semibold">
                  {userEmail}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button
                disabled={pendingKey === "password"}
                onClick={() => void handlePasswordReset()}
                type="button"
              >
                {pendingKey === "password" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Şifreyi Değiştir
              </Button>
              <LogoutButton />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="app-text text-base font-semibold">
              Yedekleme Hatırlatıcısı
            </h3>
            <p className="app-muted mt-1 text-xs leading-5">
              Şimdilik tercih olarak saklanır; karmaşık arka plan bildirimi
              başlatmaz.
            </p>
            <SegmentedControl
              ariaLabel="Yedekleme hatırlatıcısı"
              className="mt-4"
              disabled={pendingKey === "backup-reminder"}
              onChange={(value) =>
                void saveAppearancePatch(
                  "backup-reminder",
                  { backup_reminder: value },
                  "Yedekleme hatırlatıcısı kaydedildi.",
                )
              }
              options={backupOptions}
              value={backupReminder}
            />
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Bot className="app-primary mt-1 size-5" />
              <div>
                <h3 className="app-text text-base font-semibold">
                  AI Tercihleri
                </h3>
                <p className="app-muted mt-1 text-xs leading-5">
                  Kişisel asistanın cevap tonunu ve günlük özet stilini seç.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="app-muted mb-2 text-xs">AI cevap tonu</p>
                <SegmentedControl
                  ariaLabel="AI cevap tonu"
                  disabled={pendingKey === "ai-tone"}
                  onChange={(value) =>
                    void saveAppearancePatch(
                      "ai-tone",
                      { ai_response_tone: value as AiResponseTone },
                      "AI cevap tonu kaydedildi.",
                    )
                  }
                  options={aiToneOptions}
                  value={appearance?.ai_response_tone ?? "professional"}
                />
              </div>
              <div>
                <p className="app-muted mb-2 text-xs">Günlük özet stili</p>
                <SegmentedControl
                  ariaLabel="Günlük özet stili"
                  disabled={pendingKey === "daily-style"}
                  onChange={(value) =>
                    void saveAppearancePatch(
                      "daily-style",
                      { daily_summary_style: value as DailySummaryStyle },
                      "Günlük özet stili kaydedildi.",
                    )
                  }
                  options={dailySummaryOptions}
                  value={appearance?.daily_summary_style ?? "balanced"}
                />
              </div>
              <Button onClick={onOpenAi} type="button" variant="secondary">
                AI Tercihlerini Aç
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="app-text text-base font-semibold">
              Son Kullanım Özeti
            </h3>
            <div className="mt-4 space-y-2">
              {activities.map(([label, value]) => (
                <div
                  className="app-surface-2 rounded-xl border p-3 text-xs"
                  key={label}
                >
                  <p className="app-muted">{label}</p>
                  <p className="app-text mt-1 font-semibold">
                    {formatDateTime(value ?? "")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="app-primary mt-1 size-5" />
            <div>
              <h3 className="app-text text-base font-semibold">
                Destek ve Yardım
              </h3>
              <p className="app-muted mt-1 text-xs leading-5">
                Bir sorun yaşarsan hata notunu veya ekran görüntüsünü
                geliştiriciye iletebilirsin.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void handleCopyStatus()} type="button">
              <ClipboardCopy className="size-4" />
              Sistem Durumunu Kopyala
            </Button>
            <Button
              disabled={pendingKey === "feedback"}
              onClick={() => void handleFeedbackNote()}
              type="button"
              variant="secondary"
            >
              {pendingKey === "feedback" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              Geri Bildirim Notu Oluştur
            </Button>
          </div>
        </Card>

        <Card className="border-[color-mix(in_srgb,var(--danger)_24%,var(--border))] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 size-5 text-[var(--danger)]" />
            <div>
              <h3 className="app-text text-base font-semibold">
                Hesap İşlemleri
              </h3>
              <p className="app-muted mt-1 text-xs leading-5">
                Hesap silme talebi gerçek silme işlemi başlatmaz. Önce güvenli
                bir talep notu oluşturur ve yedek almanı önerir.
              </p>
            </div>
          </div>
          <Button
            className="mt-4 border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] text-[var(--danger)]"
            onClick={() => setIsDeleteModalOpen(true)}
            type="button"
            variant="secondary"
          >
            <Trash2 className="size-4" />
            Hesabımı Silme Talebi
          </Button>
        </Card>
      </div>

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            aria-label="Hesap silme talebi penceresini kapat"
            className="absolute inset-0 bg-black/70"
            disabled={pendingKey === "delete-request"}
            onClick={() => setIsDeleteModalOpen(false)}
            type="button"
          />
          <Card
            aria-modal="true"
            className="relative w-full max-w-lg p-5"
            role="dialog"
          >
            <div className="flex items-start gap-3">
              <Trash2 className="mt-1 size-5 text-[var(--danger)]" />
              <div>
                <h2 className="app-text text-lg font-semibold">
                  Hesap Silme Talebi
                </h2>
                <p className="app-muted mt-2 text-sm leading-6">
                  Bu işlem hesabın ve kayıtların için kalıcı sonuçlar
                  doğurabilir. Devam etmeden önce verilerini dışa aktarman
                  önerilir.
                </p>
              </div>
            </div>
            <label className="app-muted mt-4 block text-xs font-medium">
              Devam etmek için SİLME TALEBİ yaz
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                onChange={(event) =>
                  setDeleteConfirm(event.target.value.toLocaleUpperCase("tr-TR"))
                }
                value={deleteConfirm}
              />
            </label>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button
                disabled={pendingKey === "delete-request"}
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
                variant="secondary"
              >
                Vazgeç
              </Button>
              <Button
                disabled={
                  deleteConfirm !== "SİLME TALEBİ" ||
                  pendingKey === "delete-request"
                }
                onClick={() => void handleDeletionRequest()}
                type="button"
              >
                {pendingKey === "delete-request" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Talebi Oluştur
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
