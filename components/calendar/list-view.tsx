import { Search } from "lucide-react";
import { PlannerEventCard } from "@/components/calendar/planner-event-card";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { Card } from "@/components/ui/card";
import type {
  PlannerEventPriority,
  PlannerEventStatus,
  PlannerEventType,
  PlannerEventWithLinks,
} from "@/types";

interface ListViewProps {
  busyEventId: string;
  events: PlannerEventWithLinks[];
  onDelete: (event: PlannerEventWithLinks) => void;
  onDone: (event: PlannerEventWithLinks) => void;
  onEdit: (event: PlannerEventWithLinks) => void;
  onPriorityChange: (value: PlannerEventPriority | "all") => void;
  onQueryChange: (value: string) => void;
  onSelect: (event: PlannerEventWithLinks) => void;
  onStatusChange: (value: PlannerEventStatus | "all") => void;
  onTypeChange: (value: PlannerEventType | "all") => void;
  priority: PlannerEventPriority | "all";
  query: string;
  selectedEventId: string | null;
  status: PlannerEventStatus | "all";
  type: PlannerEventType | "all";
}

export function ListView({
  busyEventId,
  events,
  onDelete,
  onDone,
  onEdit,
  onPriorityChange,
  onQueryChange,
  onSelect,
  onStatusChange,
  onTypeChange,
  priority,
  query,
  selectedEventId,
  status,
  type,
}: ListViewProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.7fr))]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 app-muted" />
            <input
              className="app-input h-11 w-full rounded-xl border pl-9 pr-3 text-sm outline-none transition"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Başlık veya açıklamada ara..."
              type="search"
              value={query}
            />
          </label>
          <DarkSelect
            ariaLabel="Plan tipi"
            onChange={(value) => onTypeChange(value as PlannerEventType | "all")}
            options={[
              { label: "Tüm tipler", value: "all" },
              { label: "Plan", value: "plan" },
              { label: "Odak", value: "focus" },
              { label: "Hatırlatma", value: "reminder" },
              { label: "Toplantı", value: "meeting" },
              { label: "Görev", value: "task" },
              { label: "Not", value: "note" },
              { label: "Kişisel", value: "personal" },
            ]}
            value={type}
          />
          <DarkSelect
            ariaLabel="Plan durumu"
            onChange={(value) =>
              onStatusChange(value as PlannerEventStatus | "all")
            }
            options={[
              { label: "Tüm durumlar", value: "all" },
              { label: "Planlandı", value: "scheduled" },
              { label: "Devam Ediyor", value: "in_progress" },
              { label: "Tamamlandı", value: "done" },
              { label: "İptal", value: "cancelled" },
            ]}
            value={status}
          />
          <DarkSelect
            ariaLabel="Plan onceligi"
            onChange={(value) =>
              onPriorityChange(value as PlannerEventPriority | "all")
            }
            options={[
              { label: "Tüm Öncelikler", value: "all" },
              { label: "Düşük", value: "low" },
              { label: "Orta", value: "medium" },
              { label: "Yüksek", value: "high" },
              { label: "Kritik", value: "critical" },
            ]}
            value={priority}
          />
        </div>
      </Card>

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
          <p className="app-text text-sm font-semibold">
            Seçilen filtrelere uygun plan bulunamadı
          </p>
          <p className="app-muted mt-2 text-sm leading-6">
            Arama metnini veya filtreleri değiştirerek tekrar deneyebilirsin.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              onQueryChange("");
              onTypeChange("all");
              onStatusChange("all");
              onPriorityChange("all");
            }}
            variant="secondary"
          >
            Filtreleri Temizle
          </Button>
        </Card>
      )}
    </div>
  );
}
