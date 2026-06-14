import Link from "next/link";
import { CalendarClock, CheckCircle2, Pencil, StickyNote, Trash2, X } from "lucide-react";
import { EventPriorityBadge } from "@/components/calendar/event-priority-badge";
import { EventStatusBadge } from "@/components/calendar/event-status-badge";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlannerEventWithLinks } from "@/types";

interface PlannerEventDetailProps {
  event: PlannerEventWithLinks | null;
  isBusy: boolean;
  onClose: () => void;
  onDelete: (event: PlannerEventWithLinks) => void;
  onDone: (event: PlannerEventWithLinks) => void;
  onEdit: (event: PlannerEventWithLinks) => void;
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function PlannerEventDetail({
  event,
  isBusy,
  onClose,
  onDelete,
  onDone,
  onEdit,
}: PlannerEventDetailProps) {
  return (
    <Card className="p-4 sm:p-5 xl:sticky xl:top-24 xl:min-h-[420px]">
      {event ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400">
                Plan detayı
              </p>
              <h2 className="mt-2 text-xl font-semibold app-text">
                {event.title}
              </h2>
            </div>
            <button
              className="flex size-9 items-center justify-center rounded-lg transition app-muted hover:app-surface-2 hover:app-text"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <EventTypeBadge eventType={event.event_type} />
            <EventPriorityBadge priority={event.priority} />
            <EventStatusBadge status={event.status} />
          </div>

          <div className="mt-5 space-y-3 text-sm app-muted">
            <p className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 app-muted" />
              <span>
                <strong className="app-text">Başlangıç:</strong>{" "}
                {formatEventDate(event.start_at)}
                {event.end_at ? (
                  <>
                    <br />
                    <strong className="app-text">Bitiş:</strong>{" "}
                    {formatEventDate(event.end_at)}
                  </>
                ) : null}
              </span>
            </p>
            <p className="rounded-xl border p-3 leading-6 app-border app-surface-2">
              {event.description?.trim() || "Bu plan için açıklama eklenmedi."}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {event.task ? (
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] p-3 text-xs text-emerald-200">
                Bağlı görev: <span className="font-semibold">{event.task.title}</span>
              </div>
            ) : null}
            {event.note ? (
              <Link
                className="flex items-center gap-2 rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/[0.06] p-3 text-xs text-fuchsia-200 transition hover:bg-fuchsia-500/[0.09]"
                href={`/notes?note=${encodeURIComponent(event.note.id)}`}
              >
                <StickyNote className="size-3.5" />
                Bağlı not: <span className="font-semibold">{event.note.title}</span>
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" disabled={isBusy} onClick={() => onEdit(event)} variant="secondary">
              <Pencil className="size-4" />
              Düzenle
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={isBusy || event.status === "done"}
              onClick={() => onDone(event)}
              variant="secondary"
            >
              <CheckCircle2 className="size-4" />
              Tamamla
            </Button>
            <Button className="col-span-2 w-full sm:w-auto" disabled={isBusy} onClick={() => onDelete(event)}>
              <Trash2 className="size-4" />
              Sil
            </Button>
          </div>
        </>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center text-center xl:min-h-[340px]">
          <p className="text-sm font-semibold app-text">
            Bir plan seç
          </p>
          <p className="mt-2 text-sm leading-6 app-muted">
            Detayları görmek veya hızlı düzenleme yapmak için listeden bir kayıt seç.
          </p>
        </div>
      )}
    </Card>
  );
}
