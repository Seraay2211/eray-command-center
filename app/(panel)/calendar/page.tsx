import { CalendarClient } from "@/components/calendar/calendar-client";
import { getNotes } from "@/features/notes/actions";
import {
  getPlannerEvents,
  getPlannerStats,
  getTodayPlannerEvents,
  getUpcomingPlannerEvents,
} from "@/services/planner-service";
import { getTasks, getTodayTasks } from "@/services/tasks-service";
import type { CalendarView } from "@/components/calendar/calendar-toolbar";

export const metadata = {
  title: "Takvim",
};

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{
    event?: string;
    new?: string;
    todo?: string;
    view?: string;
  }>;
}

function getWeekRange() {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    endAt: sunday.toISOString(),
    startAt: monday.toISOString(),
  };
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const query = await searchParams;
  const initialView: CalendarView =
    query.view === "week" || query.view === "list" ? query.view : "today";
  const eventsPromise =
    initialView === "week"
      ? getPlannerEvents({ ...getWeekRange(), limit: 70 })
      : initialView === "list"
        ? getUpcomingPlannerEvents(50)
        : getTodayPlannerEvents(50);
  const [eventsResult, statsResult, notesResult, tasksResult, todayTasksResult] =
    await Promise.all([
      eventsPromise,
      getPlannerStats(),
      getNotes({ limit: 50 }),
      getTasks({ limit: 50 }),
      getTodayTasks(20),
    ]);
  const selectedEventMissing =
    Boolean(query.event) &&
    !(eventsResult.data ?? []).some((event) => event.id === query.event);
  const selectedEventResult =
    selectedEventMissing && query.event
      ? await getPlannerEvents({ eventId: query.event, limit: 1 })
      : null;
  const initialEvents = selectedEventResult?.data?.[0]
    ? [selectedEventResult.data[0], ...(eventsResult.data ?? [])]
    : (eventsResult.data ?? []);

  return (
    <CalendarClient
      initialError={
        eventsResult.error ??
        statsResult.error ??
        notesResult.error ??
        ""
      }
      initialEventId={query.event ?? ""}
      initialEvents={initialEvents}
      initialOpen={query.new === "1"}
      initialStats={
        statsResult.data ?? {
          total: initialEvents.length,
          today: 0,
          completed: 0,
          upcoming: 0,
        }
      }
      initialView={initialView}
      initialTodayTasks={todayTasksResult.data ?? []}
      initialTodoError={todayTasksResult.error ?? ""}
      initialTodoOpen={query.todo === "1"}
      notes={notesResult.data ?? []}
      tasks={tasksResult.data ?? []}
    />
  );
}
