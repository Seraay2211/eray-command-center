import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlannerEventWithLinks } from "@/types";

interface WeekViewProps {
  events: PlannerEventWithLinks[];
  onSelect: (event: PlannerEventWithLinks) => void;
  selectedEventId: string | null;
}

function getWeekDays() {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayLabel(date: Date) {
  return {
    day: new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
      timeZone: "Europe/Istanbul",
    }).format(date),
    name: new Intl.DateTimeFormat("tr-TR", {
      weekday: "short",
      timeZone: "Europe/Istanbul",
    }).format(date),
  };
}

function formatEventTime(event: PlannerEventWithLinks) {
  if (event.all_day) {
    return "Tüm gün";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(event.start_at));
}

export function WeekView({
  events,
  onSelect,
  selectedEventId,
}: WeekViewProps) {
  const weekDays = getWeekDays();
  const today = new Date();

  return (
    <div className="md:overflow-x-auto">
      <div className="grid grid-cols-1 gap-3 md:min-w-[940px] md:grid-cols-7">
        {weekDays.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameCalendarDay(new Date(event.start_at), day),
          );
          const label = formatDayLabel(day);

          return (
            <Card
              className={cn(
                "p-3 md:min-h-[320px]",
                isSameCalendarDay(day, today) && "border-violet-400/25 bg-violet-500/[0.04]",
              )}
              key={day.toISOString()}
            >
              <div className="border-b pb-3 app-border">
                <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
                  {label.name}
                </p>
                <p className="mt-1 text-sm font-semibold app-text">
                  {label.day}
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:block md:space-y-2">
                {dayEvents.length ? (
                  dayEvents.map((event) => (
                    <button
                      className={cn(
                        "w-full rounded-xl border p-2 text-left transition app-border app-surface-2 hover:border-[var(--primary)]",
                        selectedEventId === event.id && "border-violet-400/25 bg-violet-500/[0.06]",
                      )}
                      key={event.id}
                      onClick={() => onSelect(event)}
                      type="button"
                    >
                      <p className="text-[10px] font-medium app-muted">
                        {formatEventTime(event)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold app-text">
                        {event.title}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-xs app-muted">Plan yok</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
