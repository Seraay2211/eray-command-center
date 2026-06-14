import { CalendarDays, CheckSquare2, List, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarView = "today" | "week" | "list";

interface CalendarToolbarProps {
  onGoToday: () => void;
  onNewEvent: () => void;
  onNewTodo: () => void;
  onViewChange: (view: CalendarView) => void;
  view: CalendarView;
}

const views: Array<{
  icon: typeof SunMedium;
  label: string;
  value: CalendarView;
}> = [
  { value: "today", label: "Bugün", icon: SunMedium },
  { value: "week", label: "Hafta", icon: CalendarDays },
  { value: "list", label: "Liste", icon: List },
];

export function CalendarToolbar({
  onGoToday,
  onNewEvent,
  onNewTodo,
  onViewChange,
  view,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4 app-border app-surface lg:flex-row lg:items-center lg:justify-between">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {views.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={cn(
                "mobile-tap-target inline-flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-medium transition sm:px-3",
                view === item.value
                  ? "border-violet-400/25 bg-violet-500/10 text-violet-200"
                  : "app-border app-muted hover:app-surface-2 hover:app-text",
              )}
              key={item.value}
              onClick={() => onViewChange(item.value)}
              type="button"
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button className="w-full sm:w-auto" onClick={onGoToday} variant="secondary">
          Bugüne Git
        </Button>
        <Button className="w-full sm:w-auto" onClick={onNewTodo} variant="secondary">
          <CheckSquare2 className="size-4" />
          Yeni To-Do
        </Button>
        <Button className="col-span-2 w-full sm:w-auto" onClick={onNewEvent}>Yeni Plan</Button>
      </div>
    </div>
  );
}
