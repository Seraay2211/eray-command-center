"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CheckSquare2,
  CircleDollarSign,
  Eraser,
  FileText,
  LoaderCircle,
  ScanText,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createQuickCaptureNote } from "@/features/notes/actions";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { isPrivacyModeEnabled, MASKED_TRY_VALUE } from "@/lib/privacy";
import { getUserFacingError } from "@/lib/user-facing-error";
import { createTask } from "@/services/tasks-service";

type CaptureType = "calendar" | "finance" | "note" | "task";

interface CaptureDraft {
  id: string;
  text: string;
  type: CaptureType;
}

const financeKeywords = [
  "tl",
  "₺",
  "ödeme",
  "ödedim",
  "borç",
  "taksit",
  "kredi",
  "kart",
  "fatura",
];
const taskKeywords = [
  "ara",
  "yap",
  "hazırla",
  "gönder",
  "kontrol et",
  "unutma",
  "bak",
  "yaz",
];
const calendarKeywords = [
  "yarın",
  "bugün",
  "akşam",
  "sabah",
  "öğlen",
  "hafta",
  "pazartesi",
  "salı",
  "çarşamba",
  "perşembe",
  "cuma",
  "cumartesi",
  "pazar",
  "saat",
];

const draftMeta: Record<
  CaptureType,
  { action: string; label: string; icon: typeof FileText }
> = {
  calendar: {
    action: "Takvime git",
    icon: CalendarClock,
    label: "Takvim fikri",
  },
  finance: {
    action: "Finans bölümünde aç",
    icon: CircleDollarSign,
    label: "Finans fikri",
  },
  note: { action: "Not olarak kaydet", icon: FileText, label: "Not" },
  task: {
    action: "Görev olarak ekle",
    icon: CheckSquare2,
    label: "Görev fikri",
  },
};

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseCaptureText(value: string): CaptureDraft[] {
  return value
    .split(/[\n,;]+|[.!?]+(?=\s|$)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((text, index) => {
      const normalized = text.toLocaleLowerCase("tr-TR");
      const type: CaptureType = includesKeyword(normalized, financeKeywords)
        ? "finance"
        : includesKeyword(normalized, taskKeywords)
          ? "task"
          : includesKeyword(normalized, calendarKeywords)
            ? "calendar"
            : "note";

      return { id: `${index}-${text}`, text, type };
    });
}

function getQuickNoteTitle(): string {
  return `Hızlı Not — ${new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date())}`;
}

function getTaskDueDate(text: string): string | null {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const todayKey = getIstanbulDateKey();

  if (normalized.includes("bugün")) {
    return new Date(`${todayKey}T12:00:00+03:00`).toISOString();
  }

  if (normalized.includes("yarın")) {
    const today = new Date(`${todayKey}T12:00:00+03:00`);
    return new Date(today.getTime() + 86_400_000).toISOString();
  }

  return null;
}

function maskMoney(text: string): string {
  return text.replace(
    /(?:₺\s*\d[\d.\s]*(?:,\d{1,2})?|\d[\d.\s]*(?:,\d{1,2})?\s*(?:TL|₺))/giu,
    MASKED_TRY_VALUE,
  );
}

export function QuickCaptureCard() {
  const router = useRouter();
  const { settings } = useSettings();
  const [content, setContent] = useState("");
  const [drafts, setDrafts] = useState<CaptureDraft[]>([]);
  const [pendingAction, setPendingAction] = useState("");
  const [savedDraftIds, setSavedDraftIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const privacyEnabled = isPrivacyModeEnabled(settings);
  const savedDraftSet = useMemo(() => new Set(savedDraftIds), [savedDraftIds]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function handleParse() {
    clearMessages();
    const nextDrafts = parseCaptureText(content);

    if (nextDrafts.length === 0) {
      setError("Ayırmak istediğin kısa metni yaz.");
      return;
    }

    setDrafts(nextDrafts);
    setSavedDraftIds([]);
  }

  function handleClear() {
    setContent("");
    setDrafts([]);
    setSavedDraftIds([]);
    clearMessages();
  }

  async function saveNote(text: string, id: string, raw = false) {
    clearMessages();
    setPendingAction(id);
    const result = await createQuickCaptureNote({
      content: text,
      tags: ["dashboard"],
      title: raw ? getQuickNoteTitle() : undefined,
    });
    setPendingAction("");

    if (result.error) {
      setError(getUserFacingError(result.error, "Not kaydedilemedi."));
      return;
    }

    setSavedDraftIds((current) => [...current, id]);
    setNotice("Not kaydedildi.");
    router.refresh();
  }

  async function saveTask(draft: CaptureDraft) {
    clearMessages();
    setPendingAction(draft.id);
    const result = await createTask({
      description: "Hızlı Yakala ile eklendi.",
      due_date: getTaskDueDate(draft.text),
      priority: "medium",
      status: "todo",
      title: draft.text.slice(0, 200),
    });
    setPendingAction("");

    if (result.error) {
      setError(getUserFacingError(result.error, "Görev eklenemedi."));
      return;
    }

    setSavedDraftIds((current) => [...current, draft.id]);
    setNotice("Görev eklendi.");
    router.refresh();
  }

  async function handleDraftAction(draft: CaptureDraft) {
    if (draft.type === "finance") {
      router.push("/finance");
      return;
    }

    if (draft.type === "calendar") {
      router.push("/calendar?new=1");
      return;
    }

    if (draft.type === "task") {
      await saveTask(draft);
      return;
    }

    await saveNote(draft.text, draft.id);
  }

  return (
    <Card className="h-full min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="app-primary-bg flex size-9 shrink-0 items-center justify-center rounded-xl">
          <ScanText className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
            Günlük Girdi
          </p>
          <h2 className="app-text mt-1 text-base font-semibold">Hızlı Yakala</h2>
        </div>
      </div>
      <p className="app-muted mt-3 text-xs leading-5">
        Aklındakini yaz, uygulama not, görev ve finans fikrine ayırsın.
      </p>

      <textarea
        className="app-input mt-4 min-h-24 w-full resize-y rounded-xl border px-3 py-3 text-sm leading-6 outline-none"
        maxLength={1200}
        onChange={(event) => {
          setContent(event.target.value);
          if (drafts.length > 0) setDrafts([]);
          clearMessages();
        }}
        placeholder="Bugün ne oldu, ne yapman gerekiyor?"
        value={content}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button className="flex-1 sm:flex-none" onClick={handleParse} size="sm">
          <ScanText className="size-3.5" />
          Ayır
        </Button>
        <Button
          className="flex-1 sm:flex-none"
          onClick={handleClear}
          size="sm"
          variant="secondary"
        >
          <Eraser className="size-3.5" />
          Temizle
        </Button>
        <Button
          className="w-full sm:ml-auto sm:w-auto"
          disabled={!content.trim() || Boolean(pendingAction)}
          onClick={() => void saveNote(content, "raw-note", true)}
          size="sm"
          variant="ghost"
        >
          {pendingAction === "raw-note" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          Direkt Not Olarak Kaydet
        </Button>
      </div>

      {drafts.length > 0 ? (
        <div className="mt-4 space-y-2" aria-label="Algılanan taslaklar">
          {drafts.map((draft) => {
            const meta = draftMeta[draft.type];
            const Icon = meta.icon;
            const saved = savedDraftSet.has(draft.id);

            return (
              <div
                className="app-surface-2 min-w-0 rounded-xl border p-3"
                key={draft.id}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <Icon className="app-primary mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="app-primary text-[10px] font-semibold">
                      {meta.label}
                    </p>
                    <p className="app-text mt-1 break-words text-xs leading-5">
                      {privacyEnabled ? maskMoney(draft.text) : draft.text}
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-3 w-full sm:w-auto"
                  disabled={saved || Boolean(pendingAction)}
                  onClick={() => void handleDraftAction(draft)}
                  size="sm"
                  variant="secondary"
                >
                  {pendingAction === draft.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                  {saved ? "Kaydedildi" : meta.action}
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-[var(--success)]"
          role="status"
        >
          <CheckCircle2 className="size-3.5 shrink-0" />
          {notice}
        </p>
      ) : null}
    </Card>
  );
}
