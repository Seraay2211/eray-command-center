"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FilePlus2,
  FileText,
  ListTodo,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { formatSensitiveTRY } from "@/lib/privacy";
import type {
  DailyArchiveActivity,
  DailyArchiveActivityType,
  DailyArchiveData,
} from "@/types";

type ArchiveRange = "today" | "week" | "yesterday";

interface DailyArchiveCardProps {
  archive: DailyArchiveData;
  todayDateKey: string;
}

const rangeLabels: Record<ArchiveRange, string> = {
  today: "Bugün",
  yesterday: "Dün",
  week: "Son 7 Gün",
};

const activityMeta: Record<
  DailyArchiveActivityType,
  { icon: typeof FileText; label: string }
> = {
  calendar: { icon: CalendarDays, label: "Planlı kayıt" },
  finance_due: { icon: CircleDollarSign, label: "Yaklaşan ödeme" },
  note_created: { icon: FileText, label: "Not oluşturuldu" },
  payment: { icon: CircleDollarSign, label: "Ödeme kaydı" },
  task_completed: { icon: CheckCircle2, label: "Görev tamamlandı" },
  task_created: { icon: ListTodo, label: "Görev eklendi" },
};

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00+03:00`);
  return getIstanbulDateKey(new Date(date.getTime() + days * 86_400_000));
}

function getActivityDateKey(activity: DailyArchiveActivity): string {
  return getIstanbulDateKey(new Date(activity.occurredAt));
}

function formatActivityDate(value: string, range: ArchiveRange): string {
  return new Intl.DateTimeFormat("tr-TR", {
    ...(range === "week" ? { day: "2-digit", month: "2-digit" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function DailyArchiveCard({
  archive,
  todayDateKey,
}: DailyArchiveCardProps) {
  const { settings } = useSettings();
  const [range, setRange] = useState<ArchiveRange>("today");
  const yesterdayKey = addDays(todayDateKey, -1);
  const weekStartKey = addDays(todayDateKey, -6);
  const visibleActivities = useMemo(
    () =>
      archive.activities
        .filter((activity) => {
          const dateKey = getActivityDateKey(activity);
          if (range === "today") return dateKey === todayDateKey;
          if (range === "yesterday") return dateKey === yesterdayKey;
          return dateKey >= weekStartKey && dateKey <= todayDateKey;
        })
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime(),
        )
        .slice(0, 6),
    [archive.activities, range, todayDateKey, weekStartKey, yesterdayKey],
  );
  const todayDailyNote = archive.activities.find(
    (activity) =>
      activity.type === "note_created" &&
      getActivityDateKey(activity) === todayDateKey &&
      ["gün sonu notu", "günlük not", "hızlı not"].some((keyword) =>
        activity.title.toLocaleLowerCase("tr-TR").includes(keyword),
      ),
  );
  const metrics = {
    notes: visibleActivities.filter((item) => item.type === "note_created")
      .length,
    tasks: visibleActivities.filter(
      (item) => item.type === "task_created" || item.type === "task_completed",
    ).length,
    payments: visibleActivities.filter((item) => item.type === "payment").length,
    plans: visibleActivities.filter((item) => item.type === "calendar").length,
  };

  return (
    <Card className="h-full min-w-0 p-4 sm:p-5" id="daily-archive">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Clock3 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
              Günlük Akış
            </p>
            <h2 className="app-text mt-1 text-base font-semibold">Günlük Arşiv</h2>
            <p className="app-muted mt-1 text-[11px] leading-5">
              Bugün ve son günlerde neler biriktiğini kısa özetle gör.
            </p>
          </div>
        </div>
        <div className="app-surface-2 grid grid-cols-3 rounded-xl border p-1">
          {(Object.keys(rangeLabels) as ArchiveRange[]).map((item) => (
            <button
              className={`min-h-8 rounded-lg px-2 text-[10px] font-semibold transition ${
                range === item
                  ? "app-primary-bg"
                  : "app-muted hover:text-[var(--text)]"
              }`}
              key={item}
              onClick={() => setRange(item)}
              type="button"
            >
              {rangeLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <p className="app-muted mt-4 text-xs leading-5">
        {rangeLabels[range]} {metrics.notes} not, {metrics.tasks} görev, {metrics.payments} ödeme ve {metrics.plans} plan kaydı var.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Not", metrics.notes],
          ["Görev", metrics.tasks],
          ["Ödeme", metrics.payments],
          ["Plan", metrics.plans],
        ].map(([label, value]) => (
          <div className="app-surface-2 rounded-xl border p-3" key={label}>
            <p className="app-text text-sm font-semibold">{value}</p>
            <p className="app-muted mt-1 text-[9px]">{label}</p>
          </div>
        ))}
      </div>

      {visibleActivities.length > 0 ? (
        <div className="mt-3 space-y-2">
          {visibleActivities.map((activity) => {
            const meta = activityMeta[activity.type];
            const Icon = meta.icon;
            return (
              <Link
                className="app-surface-2 flex min-w-0 items-start gap-3 rounded-xl border p-3 transition hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
                href={activity.href}
                key={activity.id}
              >
                <Icon className="app-primary mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="app-primary block text-[9px] font-semibold uppercase tracking-[0.08em]">
                    {meta.label}
                  </span>
                  <span className="app-text mt-1 block truncate text-xs font-semibold">
                    {activity.title}
                  </span>
                  {activity.amount !== undefined ? (
                    <span className="app-muted mt-1 block text-[10px]">
                      {formatSensitiveTRY(activity.amount, settings)}
                    </span>
                  ) : null}
                </span>
                <span className="app-muted shrink-0 text-[9px]">
                  {formatActivityDate(activity.occurredAt, range)}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="app-surface-2 app-muted mt-3 rounded-xl border border-dashed p-5 text-center text-xs">
          {rangeLabels[range]} için henüz kayıt oluşmamış.
        </p>
      )}

      <div className="app-surface mt-3 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="app-text text-xs font-semibold">
            {todayDailyNote ? "Bugünün notu hazır." : "Bugünü kısa bir notla kapat."}
          </p>
          <p className="app-muted mt-1 text-[10px]">
            Günlük ilerlemeni tek bir kısa kayıtla tamamla.
          </p>
        </div>
        <Link
          className={buttonClassName({
            className: "w-full shrink-0 sm:w-auto",
            size: "sm",
            variant: "secondary",
          })}
          href={todayDailyNote?.href ?? "/notes?editor=new"}
        >
          {todayDailyNote ? <FileText className="size-3.5" /> : <FilePlus2 className="size-3.5" />}
          {todayDailyNote ? "Notu Aç" : "Gün Sonu Notu Yaz"}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}
