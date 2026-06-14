import { memo } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Pencil, StickyNote, Trash2 } from "lucide-react";
import { EventPriorityBadge } from "@/components/calendar/event-priority-badge";
import { EventStatusBadge } from "@/components/calendar/event-status-badge";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlannerEventWithLinks } from "@/types";

interface PlannerEventCardProps {
  compact?: boolean;
  event: PlannerEventWithLinks;
  isBusy?: boolean;
  isSelected?: boolean;
  onDelete: (event: PlannerEventWithLinks) => void;
  onDone: (event: PlannerEventWithLinks) => void;
  onEdit: (event: PlannerEventWithLinks) => void;
  onSelect: (event: PlannerEventWithLinks) => void;
}

function formatEventTime(event: PlannerEventWithLinks): string {
  if (event.all_day) {
    return "Tüm gün";
  }

  const start = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(event.start_at));

  if (!event.end_at) {
    return start;
  }

  const end = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(event.end_at));

  return `${start} - ${end}`;
}

function buildPreview(text?: string | null): string {
  const normalized = text?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalized) {
    return "Açıklama eklenmedi.";
  }

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137).trimEnd()}...`;
}

function PlannerEventCardComponent({
  compact = false,
  event,
  isBusy = false,
  isSelected = false,
  onDelete,
  onDone,
  onEdit,
  onSelect,
}: PlannerEventCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 transition hover:border-[var(--primary)]",
        isSelected && "border-violet-400/35 bg-violet-500/[0.05]",
        compact && "rounded-xl p-3",
      )}
    >
      <button
        aria-label={`${event.title} planını aç`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70"
        onClick={() => onSelect(event)}
        type="button"
      />
      <div
        className="pointer-events-none absolute inset-y-3 left-3 w-1 rounded-full"
        style={{ backgroundColor: event.color || "var(--app-primary)" }}
      />
      <div className="pointer-events-none relative z-[1] pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium app-muted">
            <CalendarClock className="size-3.5" />
            {formatEventTime(event)}
          </span>
          <EventTypeBadge eventType={event.event_type} />
          <EventPriorityBadge priority={event.priority} />
          <EventStatusBadge status={event.status} />
          {event.task_id ? (
            <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
              Görev bağlı
            </span>
          ) : null}
          {event.note_id ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-semibold text-fuchsia-300">
              <StickyNote className="size-3" />
              Not bağlı
            </span>
          ) : null}
        </div>

        <h3 className={cn("mt-3 text-base font-semibold app-text", compact && "text-sm")}>
          {event.title}
        </h3>
        <p className={cn("mt-2 text-sm leading-6 app-muted", compact && "line-clamp-2 text-xs leading-5")}>
          {buildPreview(event.description)}
        </p>

        {event.note ? (
          <Link
            className="pointer-events-auto relative z-10 mt-3 inline-flex text-xs font-medium text-violet-300 transition hover:text-violet-200"
            href={`/notes?note=${encodeURIComponent(event.note.id)}`}
          >
            {event.note.title}
          </Link>
        ) : null}

        <div className="pointer-events-auto relative z-10 mt-4 flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition app-border app-text hover:app-surface-2"
            onClick={() => onEdit(event)}
            type="button"
          >
            <Pencil className="size-3.5" />
            Düzenle
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/15 px-2.5 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50"
            disabled={isBusy || event.status === "done"}
            onClick={() => onDone(event)}
            type="button"
          >
            <CheckCircle2 className="size-3.5" />
            Tamamla
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/15 px-2.5 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
            disabled={isBusy}
            onClick={() => onDelete(event)}
            type="button"
          >
            <Trash2 className="size-3.5" />
            Sil
          </button>
        </div>
      </div>
    </Card>
  );
}

export const PlannerEventCard = memo(
  PlannerEventCardComponent,
  (previous, next) =>
    previous.compact === next.compact &&
    previous.isBusy === next.isBusy &&
    previous.isSelected === next.isSelected &&
    previous.event === next.event,
);
