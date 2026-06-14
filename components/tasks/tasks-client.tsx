"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCopy,
  Plus,
  RefreshCw,
  SearchX,
  SquareCheckBig,
} from "lucide-react";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import {
  TasksToolbar,
  type TasksSort,
  type TasksView,
} from "@/components/tasks/tasks-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { trackRecentItem } from "@/lib/recent-items";
import { getIstanbulDateKey } from "@/lib/dates/istanbul";
import { cn } from "@/lib/utils";
import {
  archiveTask,
  createTask,
  getTasks,
  deleteTask,
  restoreArchivedTask,
  updateTask,
  updateTaskStatus,
} from "@/services/tasks-service";
import type {
  Category,
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
  TaskWithCategory,
} from "@/types";

interface TasksClientProps {
  initialCategories: Category[];
  initialDefaultPriority: TaskPriority;
  initialDefaultStatus: TaskStatus;
  initialError: string;
  initialNow: string;
  initialOpen: boolean;
  initialTaskId: string;
  initialTasks: TaskWithCategory[];
}

type TaskCollectionTab =
  | "active"
  | "today"
  | "completed"
  | "archive"
  | "all";

const taskCollectionTabs: Array<{
  id: TaskCollectionTab;
  label: string;
}> = [
  { id: "active", label: "Aktif" },
  { id: "today", label: "Bugün" },
  { id: "completed", label: "Tamamlanan" },
  { id: "archive", label: "Arşiv" },
  { id: "all", label: "Tümü" },
];

function isTaskAutoArchived(task: TaskWithCategory, todayKey: string) {
  return Boolean(
    task.status === "done" &&
      task.completed_at &&
      getIstanbulDateKey(new Date(task.completed_at)) < todayKey,
  );
}

export function TasksClient({
  initialCategories,
  initialDefaultPriority,
  initialDefaultStatus,
  initialError,
  initialNow,
  initialOpen,
  initialTaskId,
  initialTasks,
}: TasksClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const isEnglish = settings.language === "en";
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<TasksSort>("newest");
  const [view, setView] = useState<TasksView>("list");
  const [collectionTab, setCollectionTab] =
    useState<TaskCollectionTab>("active");
  const selectedTaskFromRoute = initialTaskId
    ? initialTasks.find((task) => task.id === initialTaskId) ?? null
    : null;
  const [isFormOpen, setIsFormOpen] = useState(
    initialOpen || Boolean(selectedTaskFromRoute),
  );
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(
    selectedTaskFromRoute ?? null,
  );
  const [deletingTask, setDeletingTask] =
    useState<TaskWithCategory | null>(null);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [visibleState, setVisibleState] = useState({
    count: 50,
    key: "",
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTasks.length >= 50);
  const debouncedQuery = useDebounce(query, 250);
  const todayKey = getIstanbulDateKey(new Date(initialNow));

  const schemaMissing =
    pageError.includes("phase-6-tasks.sql") ||
    pageError.includes("phase-19.1-task-archive.sql");
  const isTaskArchived = useCallback(
    (task: TaskWithCategory) =>
      Boolean(task.archived_at) || isTaskAutoArchived(task, todayKey),
    [todayKey],
  );
  const openTaskCount = tasks.filter(
    (task) => !isTaskArchived(task) && task.status !== "done",
  ).length;
  const completedTaskCount = tasks.filter(
    (task) => !isTaskArchived(task) && task.status === "done",
  ).length;
  const archivedTaskCount = tasks.filter(isTaskArchived).length;

  const filteredTasks = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase("tr-TR");

    return tasks
      .filter((task) => {
        const taskArchived = isTaskArchived(task);
        const dueToday =
          Boolean(task.due_date) &&
          getIstanbulDateKey(new Date(task.due_date as string)) === todayKey;
        const matchesCollection =
          collectionTab === "all" ||
          (collectionTab === "active" &&
            !taskArchived &&
            task.status !== "done") ||
          (collectionTab === "today" && !taskArchived && dueToday) ||
          (collectionTab === "completed" &&
            !taskArchived &&
            task.status === "done") ||
          (collectionTab === "archive" && taskArchived);
        const matchesQuery =
          !normalizedQuery ||
          task.title.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
          task.description
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedQuery);
        const matchesStatus = status === "all" || task.status === status;
        const matchesPriority =
          priority === "all" || task.priority === priority;
        const matchesCategory =
          categoryId === "all" ||
          (categoryId === "uncategorized" && !task.category_id) ||
          task.category_id === categoryId;

        return (
          matchesCollection &&
          matchesQuery &&
          matchesStatus &&
          matchesPriority &&
          matchesCategory
        );
      })
      .sort((first, second) => {
        if (sort === "oldest") {
          return (
            new Date(first.created_at).getTime() -
            new Date(second.created_at).getTime()
          );
        }

        if (sort === "due_date") {
          if (!first.due_date && !second.due_date) {
            return (
              new Date(second.created_at).getTime() -
              new Date(first.created_at).getTime()
            );
          }
          if (!first.due_date) return 1;
          if (!second.due_date) return -1;

          return (
            new Date(first.due_date).getTime() -
            new Date(second.due_date).getTime()
          );
        }

        return (
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime()
        );
      });
  }, [
    categoryId,
    collectionTab,
    debouncedQuery,
    isTaskArchived,
    priority,
    sort,
    status,
    tasks,
    todayKey,
  ]);
  const filterKey = useMemo(
    () =>
      [categoryId, collectionTab, debouncedQuery, priority, sort, status].join(
        "|",
      ),
    [categoryId, collectionTab, debouncedQuery, priority, sort, status],
  );
  const visibleCount =
    visibleState.key === filterKey ? visibleState.count : 50;
  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, visibleCount),
    [filteredTasks, visibleCount],
  );

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTask(null);
    setFormError("");

    if (searchParams.get("new") === "1" || searchParams.get("task")) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("new");
      nextParams.delete("task");

      router.replace(
        nextParams.toString()
          ? `${pathname}?${nextParams.toString()}`
          : pathname,
        { scroll: false },
      );
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!selectedTaskFromRoute) {
      return;
    }

    trackRecentItem({
      href: `/tasks?task=${encodeURIComponent(selectedTaskFromRoute.id)}`,
      id: selectedTaskFromRoute.id,
      title: selectedTaskFromRoute.title,
      type: "task",
    });
  }, [selectedTaskFromRoute]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function openNewTask() {
    setEditingTask(null);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditTask(task: TaskWithCategory) {
    setEditingTask(task);
    setFormError("");
    setIsFormOpen(true);
    trackRecentItem({
      href: `/tasks?task=${encodeURIComponent(task.id)}`,
      id: task.id,
      title: task.title,
      type: "task",
    });
  }

  async function handleSave(input: CreateTaskInput) {
    setIsSaving(true);
    setFormError("");

    const result = editingTask
      ? await updateTask(editingTask.id, input)
      : await createTask(input);

    setIsSaving(false);

    if (result.error || !result.data) {
      setFormError(result.error ?? "Görev kaydedilemedi.");
      return;
    }

    const savedTask = result.data;

    if (editingTask) {
      setTasks((current) =>
        current.map((task) =>
          task.id === savedTask.id ? savedTask : task,
        ),
      );
      showNotice("Görev güncellendi.");
    } else {
      setTasks((current) => [savedTask, ...current]);
      showNotice("Yeni görev oluşturuldu.");
    }

    setPageError("");
    closeForm();
  }

  async function handleStatusChange(
    task: TaskWithCategory,
    nextStatus: TaskStatus,
  ) {
    if (task.status === nextStatus) return;

    setBusyTaskId(task.id);
    setPageError("");
    const result = await updateTaskStatus(task.id, nextStatus);
    setBusyTaskId("");

    if (result.error || !result.data) {
      setPageError(result.error ?? "Görev durumu değiştirilemedi.");
      return;
    }

    const updatedTask = result.data;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updatedTask : item)),
    );
    showNotice(
      nextStatus === "done"
        ? "Görev tamamlandı."
        : "Görev durumu güncellendi.",
    );
  }

  async function handleArchive(task: TaskWithCategory) {
    setBusyTaskId(task.id);
    setPageError("");
    const result = await archiveTask(task.id);
    setBusyTaskId("");

    if (result.error || !result.data) {
      setPageError(result.error ?? "Görev arşivlenemedi.");
      return;
    }

    setTasks((current) =>
      current.map((item) => (item.id === task.id ? result.data! : item)),
    );
    showNotice("Görev arşivlendi.");
  }

  async function handleRestore(task: TaskWithCategory) {
    setBusyTaskId(task.id);
    setPageError("");
    const result = await restoreArchivedTask(task.id);
    setBusyTaskId("");

    if (result.error || !result.data) {
      setPageError(result.error ?? "Görev arşivden çıkarılamadı.");
      return;
    }

    setTasks((current) =>
      current.map((item) => (item.id === task.id ? result.data! : item)),
    );
    showNotice("Görev yeniden aktif listeye alındı.");
  }

  async function performDelete(taskToDelete: TaskWithCategory) {
    setIsDeleting(true);
    setPageError("");
    const result = await deleteTask(taskToDelete.id);
    setIsDeleting(false);

    if (result.error) {
      setPageError(result.error);
      setDeletingTask(null);
      return;
    }

    setTasks((current) =>
      current.filter((task) => task.id !== taskToDelete.id),
    );
    setDeletingTask(null);
    showNotice("Görev silindi.");
  }

  function requestDelete(task: TaskWithCategory) {
    if (settings.confirm_before_delete) {
      setDeletingTask(task);
      return;
    }

    void performDelete(task);
  }

  async function handleDelete() {
    if (deletingTask) await performDelete(deletingTask);
  }

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setPriority("all");
    setCategoryId("all");
    setSort("newest");
    setCollectionTab("active");
  }

  const isFiltered = Boolean(
    query ||
      status !== "all" ||
      priority !== "all" ||
      categoryId !== "all" ||
      collectionTab !== "active",
  );

  async function handleLoadMore() {
    setIsLoadingMore(true);
    const result = await getTasks({
      limit: 50,
      offset: tasks.length,
    });
    setIsLoadingMore(false);

    if (result.error || !result.data) {
      setPageError(result.error ?? "Daha fazla görev yüklenemedi.");
      return;
    }

    const nextTasks = result.data;

    setTasks((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...nextTasks.filter((item) => !existingIds.has(item.id)),
      ];
    });
    setHasMore(nextTasks.length === 50);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
            {isEnglish ? "Workspace" : "Çalışma alanı"}
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
            {isEnglish ? "Tasks" : "Görevler"}
          </h1>
          <p className="app-muted mt-2 text-sm">
            {isEnglish
              ? "Track upcoming, active, waiting and completed work."
              : "Yapılacak, devam eden, bekleyen ve tamamlanan işleri buradan takip et."}
          </p>
        </div>
        <Button disabled={schemaMissing} onClick={openNewTask}>
          <Plus className="size-4" />
          {isEnglish ? "New Task" : "Yeni Görev"}
        </Button>
      </div>

      {notice ? (
        <div
          className="app-surface fixed inset-x-3 top-20 z-[100] flex items-center gap-2 rounded-xl border border-emerald-400/20 px-4 py-3 text-xs font-medium text-emerald-500 shadow-2xl sm:left-auto sm:right-4"
          role="status"
        >
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      ) : null}

      {schemaMissing ? (
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="flex size-11 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-500/[0.08] text-amber-300">
              <AlertCircle className="size-5" />
            </span>
            <h2 className="app-text mt-5 text-lg font-semibold">
              Görev veritabanı kurulumu gerekiyor
            </h2>
            <p className="app-muted mt-2 text-sm leading-6">
              Supabase SQL Editor içinde{" "}
              <code className="app-surface-2 app-primary rounded px-1.5 py-0.5 font-mono text-xs">
                {pageError.includes("phase-19.1")
                  ? "database/phase-19.1-task-archive.sql"
                  : "database/phase-6-tasks.sql"}
              </code>{" "}
              dosyasının tamamını çalıştırın. Bu işlem mevcut notları veya
              kullanıcıları silmez.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(
                    pageError.includes("phase-19.1")
                      ? "database/phase-19.1-task-archive.sql"
                      : "database/phase-6-tasks.sql",
                  );
                  showNotice("SQL dosya yolu kopyalandı.");
                }}
                variant="secondary"
              >
                <ClipboardCopy className="size-4" />
                Dosya yolunu kopyala
              </Button>
              <Button onClick={() => router.refresh()}>
                <RefreshCw className="size-4" />
                Kurulumu tekrar kontrol et
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {pageError ? (
            <div
              className="flex items-start justify-between gap-4 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-5 text-rose-200"
              role="alert"
            >
              <span className="flex gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                {pageError}
              </span>
              <button
                className="shrink-0 text-rose-300/60 hover:text-rose-200"
                onClick={() => setPageError("")}
                type="button"
              >
                Kapat
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="app-muted text-[10px] uppercase tracking-[0.16em]">
                Toplam
              </p>
              <p className="app-text mt-2 text-2xl font-semibold">
                {tasks.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="app-muted text-[10px] uppercase tracking-[0.16em]">
                Açık
              </p>
              <p className="mt-2 text-2xl font-semibold text-violet-300">
                {openTaskCount}
              </p>
            </Card>
            <Card className="p-4">
              <p className="app-muted text-[10px] uppercase tracking-[0.16em]">
                Tamamlandı
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {completedTaskCount}
              </p>
            </Card>
            <Card className="p-4">
              <p className="app-muted text-[10px] uppercase tracking-[0.16em]">
                Arşiv
              </p>
              <p className="app-text mt-2 text-2xl font-semibold">
                {archivedTaskCount}
              </p>
            </Card>
          </div>

          <div
            aria-label="Görev görünümü"
            className="app-card flex gap-1 overflow-x-auto rounded-xl border p-1.5"
            role="tablist"
          >
            {taskCollectionTabs.map((tab) => (
              <button
                aria-selected={collectionTab === tab.id}
                className={cn(
                  "min-h-9 shrink-0 rounded-lg px-3 text-xs font-medium transition",
                  collectionTab === tab.id
                    ? "app-primary-bg"
                    : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                )}
                key={tab.id}
                onClick={() => setCollectionTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <TasksToolbar
            categories={initialCategories}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            onPriorityChange={setPriority}
            onQueryChange={setQuery}
            onSortChange={setSort}
            onStatusChange={setStatus}
            onViewChange={setView}
            priority={priority}
            query={query}
            resultCount={filteredTasks.length}
            sort={sort}
            status={status}
            view={view}
          />

          {filteredTasks.length > 0 ? (
            view === "list" ? (
              <TaskList
                busyTaskId={busyTaskId}
                isArchived={isTaskArchived}
                onArchive={handleArchive}
                onDelete={requestDelete}
                onEdit={openEditTask}
                onRestore={handleRestore}
                onStatusChange={handleStatusChange}
                referenceTime={initialNow}
                tasks={visibleTasks}
              />
            ) : (
              <TaskBoard
                busyTaskId={busyTaskId}
                isArchived={isTaskArchived}
                onArchive={handleArchive}
                onDelete={requestDelete}
                onEdit={openEditTask}
                onRestore={handleRestore}
                onStatusChange={handleStatusChange}
                referenceTime={initialNow}
                tasks={visibleTasks}
              />
            )
          ) : (
            <Card className="relative min-h-80 overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_36%)]" />
              <div className="relative flex min-h-64 flex-col items-center justify-center text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                  {isFiltered ? (
                    <SearchX className="size-6" />
                  ) : (
                    <SquareCheckBig className="size-6" />
                  )}
                </span>
                <h2 className="app-text mt-5 text-lg font-semibold">
                  {isFiltered ? "Bu görünümde görev bulunamadı" : "Henüz görev yok"}
                </h2>
                <p className="app-muted mt-2 max-w-md text-sm leading-6">
                  {isFiltered
                    ? "Filtreleri temizleyebilir veya başka bir görev görünümüne geçebilirsin."
                    : "Günlük işleri ve operasyon adımlarını takip etmek için ilk görevini oluştur."}
                </p>
                <Button
                  className="mt-6"
                  onClick={isFiltered ? resetFilters : openNewTask}
                  variant="secondary"
                >
                  {isFiltered ? "Filtreleri Temizle" : "İlk Görevi Oluştur"}
                </Button>
              </div>
            </Card>
          )}
          {filteredTasks.length > visibleTasks.length ? (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() =>
                  setVisibleState({
                    count: visibleCount + 50,
                    key: filterKey,
                  })
                }
                size="sm"
                variant="secondary"
              >
                Daha fazla göster
              </Button>
            </div>
          ) : null}
          {filteredTasks.length === visibleTasks.length && hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button
                disabled={isLoadingMore}
                onClick={() => void handleLoadMore()}
                size="sm"
                variant="secondary"
              >
                {isLoadingMore ? "Yükleniyor..." : "50 görev daha yükle"}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <TaskForm
        categories={initialCategories}
        defaultPriority={initialDefaultPriority}
        defaultStatus={initialDefaultStatus}
        error={formError}
        isOpen={isFormOpen && !schemaMissing}
        isSaving={isSaving}
        key={`${isFormOpen}-${editingTask?.id ?? "new"}`}
        onClose={closeForm}
        onSubmit={handleSave}
        task={editingTask}
      />
      <DeleteTaskDialog
        isDeleting={isDeleting}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        task={deletingTask}
      />
    </div>
  );
}
