import { PlannerEventCard } from "@/components/calendar/planner-event-card";
import { Card } from "@/components/ui/card";
import type { PlannerEventWithLinks } from "@/types";

interface TodayViewProps {
  busyEventId: string;
  events: PlannerEventWithLinks[];
  onDelete: (event: PlannerEventWithLinks) => void;
  onDone: (event: PlannerEventWithLinks) => void;
  onEdit: (event: PlannerEventWithLinks) => void;
  onNewEvent: () => void;
  onSelect: (event: PlannerEventWithLinks) => void;
  selectedEventId: string | null;
}

function formatDateHeading(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

export function TodayView({
  busyEventId,
  events,
  onDelete,
  onDone,
  onEdit,
  onNewEvent,
  onSelect,
  selectedEventId,
}: TodayViewProps) {
  const completed = events.filter((event) => event.status === "done").length;
  const pending = Math.max(events.length - completed, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
            Tarih
          </p>
          <p className="mt-2 text-sm font-semibold app-text">
            {formatDateHeading()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
            Bekleyen
          </p>
          <p className="mt-2 text-2xl font-semibold text-violet-300">
            {pending}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
            Tamamlanan
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {completed}
          </p>
        </Card>
      </div>

      {events.length ? (
        <div className="space-y-3">
          {events.map((event) => (
            <PlannerEventCard
              event={event}
              isBusy={busyEventId === event.id}
              isSelected={selectedEventId === event.id}
              key={event.id}
              onDelete={onDelete}
              onDone={onDone}
              onEdit={onEdit}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold app-text">
            Bugün için plan yok
          </p>
          <p className="mt-2 text-sm leading-6 app-muted">
            Günlük akışını daha net görmek için ilk planını ekle.
          </p>
          <button
            className="mt-4 inline-flex rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/15"
            onClick={onNewEvent}
            type="button"
          >
            Hızlı plan ekle
          </button>
        </Card>
      )}
    </div>
  );
}
