"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CalendarRange, CheckCircle2, Plus } from "lucide-react";
import {
  CalendarToolbar,
  type CalendarView,
} from "@/components/calendar/calendar-toolbar";
import { DeletePlannerEventDialog } from "@/components/calendar/delete-planner-event-dialog";
import { ListView } from "@/components/calendar/list-view";
import { PlannerEventDetail } from "@/components/calendar/planner-event-detail";
import { PlannerEventForm } from "@/components/calendar/planner-event-form";
import { TodayView } from "@/components/calendar/today-view";
import { TodayTodoList } from "@/components/calendar/today-todo-list";
import { WeekView } from "@/components/calendar/week-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { trackRecentItem } from "@/lib/recent-items";
import { getIstanbulTodayDueDate } from "@/lib/dates/istanbul";
import {
  createPlannerEvent,
  deletePlannerEvent,
  getPlannerEvents,
  getTodayPlannerEvents,
  getUpcomingPlannerEvents,
  markPlannerEventDone,
  updatePlannerEvent,
} from "@/services/planner-service";
import { createTask, updateTaskStatus } from "@/services/tasks-service";
import type {
  CreatePlannerEventInput,
  NoteWithRelations,
  PlannerEventPriority,
  PlannerEventStatus,
  PlannerEventType,
  PlannerEventWithLinks,
  PlannerStats,
  TaskWithCategory,
} from "@/types";

interface CalendarClientProps {
  initialError: string;
  initialEventId: string;
  initialEvents: PlannerEventWithLinks[];
  initialOpen: boolean;
  initialStats: PlannerStats;
  initialTodayTasks: TaskWithCategory[];
  initialTodoError: string;
  initialTodoOpen: boolean;
  initialView: CalendarView;
  notes: NoteWithRelations[];
  tasks: TaskWithCategory[];
}

function isToday(value: string) {
  const current = new Date();
  const date = new Date(value);

  return (
    current.getFullYear() === date.getFullYear() &&
    current.getMonth() === date.getMonth() &&
    current.getDate() === date.getDate()
  );
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

export function CalendarClient({
  initialError,
  initialEventId,
  initialEvents,
  initialOpen,
  initialStats,
  initialTodayTasks,
  initialTodoError,
  initialTodoOpen,
  initialView,
  notes,
  tasks,
}: CalendarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const isEnglish = settings.language === "en";
  const [events, setEvents] = useState(initialEvents);
  const [todayTasks, setTodayTasks] = useState(initialTodayTasks);
  const [stats, setStats] = useState(initialStats);
  const [view, setView] = useState<CalendarView>(initialView);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PlannerEventType | "all">("all");
  const [status, setStatus] = useState<PlannerEventStatus | "all">("all");
  const [priority, setPriority] = useState<PlannerEventPriority | "all">("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEventId || null,
  );
  const [editingEvent, setEditingEvent] = useState<PlannerEventWithLinks | null>(
    null,
  );
  const [deletingEvent, setDeletingEvent] =
    useState<PlannerEventWithLinks | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(initialOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyEventId, setBusyEventId] = useState("");
  const [pageError, setPageError] = useState(initialError);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [initialTimestamp] = useState(() => Date.now());
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [todoFocusRequest, setTodoFocusRequest] = useState(
    initialTodoOpen ? 1 : 0,
  );
  const hasMountedRef = useRef(false);
  const debouncedQuery = useDebounce(query, 250);

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    trackRecentItem({
      href: `/calendar?event=${encodeURIComponent(selectedEvent.id)}`,
      id: selectedEvent.id,
      title: selectedEvent.title,
      type: "calendar",
    });
  }, [selectedEvent]);

  const filteredEvents = useMemo(() => {
    const normalized = debouncedQuery.trim().toLocaleLowerCase("tr-TR");

    return events
      .filter((event) => {
        const matchesQuery =
          !normalized ||
          event.title.toLocaleLowerCase("tr-TR").includes(normalized) ||
          event.description?.toLocaleLowerCase("tr-TR").includes(normalized);
        const matchesType = type === "all" || event.event_type === type;
        const matchesStatus = status === "all" || event.status === status;
        const matchesPriority =
          priority === "all" || event.priority === priority;

        return (
          matchesQuery &&
          matchesType &&
          matchesStatus &&
          matchesPriority
        );
      })
      .sort(
        (left, right) =>
          new Date(left.start_at).getTime() - new Date(right.start_at).getTime(),
      );
  }, [debouncedQuery, events, priority, status, type]);

  const todayEvents = useMemo(
    () => filteredEvents.filter((event) => isToday(event.start_at)),
    [filteredEvents],
  );

  const upcomingEvents = useMemo(
    () =>
      filteredEvents.filter(
        (event) =>
          new Date(event.start_at).getTime() >= initialTimestamp - 60_000,
      ),
    [filteredEvents, initialTimestamp],
  );

  const replaceParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        {
          scroll: false,
        },
      );
    },
    [pathname, router, searchParams],
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function openNewEvent() {
    setEditingEvent(null);
    setFormError("");
    setIsFormOpen(true);
    replaceParams({ new: "1", event: null });
  }

  function focusNewTodo() {
    setTodoFocusRequest((current) => current + 1);
    replaceParams({ todo: "1" });
  }

  function openEditEvent(event: PlannerEventWithLinks) {
    setEditingEvent(event);
    setFormError("");
    setIsFormOpen(true);
    replaceParams({ event: event.id, new: null });
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    setFormError("");
    replaceParams({ new: null });
  }

  function selectEvent(event: PlannerEventWithLinks) {
    setSelectedEventId(event.id);
    trackRecentItem({
      href: `/calendar?event=${encodeURIComponent(event.id)}`,
      id: event.id,
      title: event.title,
      type: "calendar",
    });
    replaceParams({ event: event.id });
  }

  function closeDetail() {
    setSelectedEventId(null);
    replaceParams({ event: null });
  }

  function updateStats(nextEvents: PlannerEventWithLinks[]) {
    const todayCount = nextEvents.filter((event) => isToday(event.start_at)).length;
    const completed = nextEvents.filter((event) => event.status === "done").length;
    const upcoming = nextEvents.filter((event) => {
      const time = new Date(event.start_at).getTime();
      return time >= Date.now() - 60_000 && event.status !== "done" && event.status !== "cancelled";
    }).length;

    setStats({
      total: nextEvents.length,
      today: todayCount,
      completed,
      upcoming,
    });
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    let isCancelled = false;

    async function syncEventsForView() {
      setIsLoadingView(true);
      setPageError("");

      const result =
        view === "week"
          ? await getPlannerEvents({ ...getWeekRange(), limit: 70 })
          : view === "list"
            ? await getUpcomingPlannerEvents(50)
            : await getTodayPlannerEvents(50);

      if (isCancelled) {
        return;
      }

      setIsLoadingView(false);

      if (result.error || !result.data) {
        setPageError(result.error ?? "Takvim verileri alinamadi.");
        return;
      }

      const nextEvents = result.data;

      setEvents(nextEvents);
      updateStats(nextEvents);

      setSelectedEventId((current) =>
        current && !nextEvents.some((event) => event.id === current)
          ? null
          : current,
      );
    }

    void syncEventsForView();

    return () => {
      isCancelled = true;
    };
  }, [view]);

  async function handleSave(input: CreatePlannerEventInput) {
    setIsSaving(true);
    setFormError("");

    const result = editingEvent
      ? await updatePlannerEvent(editingEvent.id, input)
      : await createPlannerEvent(input);

    setIsSaving(false);

    if (result.error || !result.data) {
      setFormError(result.error ?? "Plan kaydedilemedi.");
      return;
    }

    const savedEvent = result.data;
    const nextEvents = editingEvent
      ? events.map((event) => (event.id === savedEvent.id ? savedEvent : event))
      : [...events, savedEvent];

    setEvents(nextEvents);
    updateStats(nextEvents);
    setSelectedEventId(savedEvent.id);
    setPageError("");
    closeForm();
    replaceParams({ event: savedEvent.id, new: null });
    showNotice(editingEvent ? "Plan güncellendi." : "Plan oluşturuldu.");
  }

  async function handleDone(event: PlannerEventWithLinks) {
    if (event.status === "done") return;

    setBusyEventId(event.id);
    const result = await markPlannerEventDone(event.id);
    setBusyEventId("");

    if (result.error || !result.data) {
      setPageError(result.error ?? "Plan tamamlanamadi.");
      return;
    }

    const nextEvents = events.map((item) =>
      item.id === result.data?.id ? result.data : item,
    );
    setEvents(nextEvents);
    updateStats(nextEvents);
    showNotice("Plan tamamlandi.");
  }

  async function handleCreateTodo(title: string): Promise<boolean> {
    setIsCreatingTodo(true);
    setPageError("");
    const result = await createTask({
      description: "",
      due_date: getIstanbulTodayDueDate(),
      priority: "medium",
      status: "todo",
      title,
    });
    setIsCreatingTodo(false);

    if (result.error || !result.data) {
      setPageError(result.error ?? "To-Do eklenemedi.");
      return false;
    }

    setTodayTasks((current) => [result.data as TaskWithCategory, ...current].slice(0, 20));
    replaceParams({ todo: null });
    showNotice("To-Do eklendi.");
    return true;
  }

  async function handleToggleTodo(task: TaskWithCategory) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const previousTasks = todayTasks;
    const optimisticTask: TaskWithCategory = {
      ...task,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      status: nextStatus,
    };

    setBusyTaskId(task.id);
    setPageError("");
    setTodayTasks((current) =>
      current.map((item) => (item.id === task.id ? optimisticTask : item)),
    );

    const result = await updateTaskStatus(task.id, nextStatus);
    setBusyTaskId("");

    if (result.error || !result.data) {
      setTodayTasks(previousTasks);
      setPageError(result.error ?? "To-Do durumu güncellenemedi.");
      return;
    }

    setTodayTasks((current) =>
      current.map((item) => (item.id === task.id ? result.data! : item)),
    );
    showNotice(nextStatus === "done" ? "To-Do tamamlandı." : "To-Do bekleyenlere taşındı.");
  }

  async function confirmDelete() {
    if (!deletingEvent) return;

    setIsDeleting(true);
    const result = await deletePlannerEvent(deletingEvent.id);
    setIsDeleting(false);

    if (result.error) {
      setPageError(result.error);
      setDeletingEvent(null);
      return;
    }

    const nextEvents = events.filter((event) => event.id !== deletingEvent.id);
    setEvents(nextEvents);
    updateStats(nextEvents);

    if (selectedEventId === deletingEvent.id) {
      closeDetail();
    }

    setDeletingEvent(null);
    showNotice("Plan silindi.");
  }

  return (
    <div className="space-y-6">
      <section className="app-card relative overflow-hidden rounded-2xl border px-5 py-6 sm:px-7 sm:py-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/[0.12] blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              {isEnglish ? "Planning" : "Planlama"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight app-text">
              {isEnglish ? "Calendar" : "Takvim"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 app-muted">
              Günlük planlarını, odak bloklarını ve hatırlatmalarını buradan yönet.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
                Toplam
              </p>
              <p className="mt-2 text-2xl font-semibold app-text">
                {stats.total}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
                Bugün
              </p>
              <p className="mt-2 text-2xl font-semibold text-violet-300">
                {stats.today}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
                Yaklaşan
              </p>
              <p className="mt-2 text-2xl font-semibold text-sky-300">
                {stats.upcoming}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] app-muted">
                Tamamlanan
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {stats.completed}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {notice ? (
        <div className="app-card fixed inset-x-3 top-20 z-[130] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium text-emerald-500 shadow-2xl sm:left-auto sm:right-4">
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      ) : null}

      {pageError ? (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-sm leading-6 text-rose-200">
          <span className="flex gap-2">
            <AlertCircle className="mt-1 size-4 shrink-0 text-rose-400" />
            {pageError}
          </span>
          <button
            className="text-rose-300/70 transition hover:text-rose-200"
            onClick={() => setPageError("")}
            type="button"
          >
            Kapat
          </button>
        </div>
      ) : null}

      <CalendarToolbar
        onGoToday={() => {
          setView("today");
          setType("all");
          setStatus("all");
          setPriority("all");
          setQuery("");
          replaceParams({ view: "today" });
        }}
        onNewEvent={openNewEvent}
        onNewTodo={focusNewTodo}
        onViewChange={(nextView) => {
          setView(nextView);
          replaceParams({ view: nextView });
        }}
        view={view}
      />

      <TodayTodoList
        busyTaskId={busyTaskId}
        error={initialTodoError}
        focusRequest={todoFocusRequest}
        isCreating={isCreatingTodo}
        onCreate={handleCreateTodo}
        onToggle={handleToggleTodo}
        tasks={todayTasks}
      />

      {isLoadingView ? (
        <div className="rounded-xl border px-4 py-3 text-sm app-border app-surface-2 app-muted">
          Takvim görünümü güncelleniyor...
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {view === "today" ? (
            <TodayView
              busyEventId={busyEventId}
              events={todayEvents}
              onDelete={setDeletingEvent}
              onDone={(event) => void handleDone(event)}
              onEdit={openEditEvent}
              onNewEvent={openNewEvent}
              onSelect={selectEvent}
              selectedEventId={selectedEventId}
            />
          ) : null}

          {view === "week" ? (
            <WeekView
              events={filteredEvents}
              onSelect={selectEvent}
              selectedEventId={selectedEventId}
            />
          ) : null}

          {view === "list" ? (
            <ListView
              busyEventId={busyEventId}
              events={upcomingEvents}
              onDelete={setDeletingEvent}
              onDone={(event) => void handleDone(event)}
              onEdit={openEditEvent}
              onPriorityChange={setPriority}
              onQueryChange={setQuery}
              onSelect={selectEvent}
              onStatusChange={setStatus}
              onTypeChange={setType}
              priority={priority}
              query={query}
              selectedEventId={selectedEventId}
              status={status}
              type={type}
            />
          ) : null}
        </div>

        <div className="space-y-4" data-dashboard-section="calendar">
          <PlannerEventDetail
            event={selectedEvent}
            isBusy={busyEventId === selectedEvent?.id}
            onClose={closeDetail}
            onDelete={setDeletingEvent}
            onDone={(event) => void handleDone(event)}
            onEdit={openEditEvent}
          />
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <CalendarRange className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold app-text">
                  Hızlı aksiyon
                </h3>
                <p className="text-[11px] app-muted">
                  Yeni bir odak bloğu veya hatırlatma ekle.
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={openNewEvent}>
              <Plus className="size-4" />
              Yeni Plan
            </Button>
          </Card>
        </div>
      </div>

      <PlannerEventForm
        error={formError}
        event={editingEvent}
        isOpen={isFormOpen}
        isSaving={isSaving}
        key={`${isFormOpen}-${editingEvent?.id ?? "new"}-${initialEventId}`}
        notes={notes}
        onClose={closeForm}
        onSubmit={(input) => void handleSave(input)}
        tasks={tasks}
      />
      <DeletePlannerEventDialog
        event={deletingEvent}
        isDeleting={isDeleting}
        onCancel={() => setDeletingEvent(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
