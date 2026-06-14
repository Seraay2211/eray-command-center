"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckSquare2,
  LoaderCircle,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TaskWithCategory } from "@/types";

interface TodayTodoListProps {
  busyTaskId: string;
  error: string;
  focusRequest: number;
  isCreating: boolean;
  onCreate: (title: string) => Promise<boolean>;
  onToggle: (task: TaskWithCategory) => Promise<void>;
  tasks: TaskWithCategory[];
}

export function TodayTodoList({
  busyTaskId,
  error,
  focusRequest,
  isCreating,
  onCreate,
  onToggle,
  tasks,
}: TodayTodoListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done"),
    [tasks],
  );

  useEffect(() => {
    if (focusRequest > 0) {
      inputRef.current?.focus();
    }
  }, [focusRequest]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle || isCreating) return;

    const created = await onCreate(normalizedTitle);
    if (created) {
      setTitle("");
      inputRef.current?.focus();
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckSquare2 className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-500">
                Günlük işler
              </p>
              <h2 className="mt-1 text-base font-semibold app-text">
                Bugünün To-Do Listesi
              </h2>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 app-muted">
            Bugün tamamlanması gereken işleri hızlıca ekle ve durumlarını buradan yönet.
          </p>
        </div>

        <form
          className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <input
            aria-label="Hızlı To-Do ekle"
            className="app-input h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
            disabled={Boolean(error)}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Hızlı To-Do ekle..."
            ref={inputRef}
            value={title}
          />
          <Button
            className="h-11 shrink-0"
            disabled={Boolean(error) || isCreating || !title.trim()}
            type="submit"
          >
            {isCreating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Yeni To-Do
          </Button>
        </form>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] p-3 text-xs leading-6 text-amber-600">
          <AlertCircle className="mt-1 size-4 shrink-0" />
          <span>Görev sistemi kullanılamıyor. {error}</span>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TodoSection
            busyTaskId={busyTaskId}
            emptyText="Bugün için bekleyen iş bulunmuyor."
            label="Bekleyenler"
            onToggle={onToggle}
            tasks={pendingTasks}
          />
          <TodoSection
            busyTaskId={busyTaskId}
            emptyText="Henüz tamamlanan iş yok."
            label="Tamamlananlar"
            onToggle={onToggle}
            tasks={completedTasks}
          />
        </div>
      )}
    </Card>
  );
}

function TodoSection({
  busyTaskId,
  emptyText,
  label,
  onToggle,
  tasks,
}: {
  busyTaskId: string;
  emptyText: string;
  label: string;
  onToggle: (task: TaskWithCategory) => Promise<void>;
  tasks: TaskWithCategory[];
}) {
  return (
    <section className="rounded-2xl border p-3 app-border app-surface-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-xs font-semibold app-text">{label}</h3>
        <span className="rounded-full border px-2 py-0.5 text-[10px] app-border app-muted">
          {tasks.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {tasks.length ? (
          tasks.map((task) => {
            const isDone = task.status === "done";
            const isBusy = busyTaskId === task.id;

            return (
              <button
                aria-label={
                  isDone
                    ? `${task.title} görevini bekleyene taşı`
                    : `${task.title} görevini tamamla`
                }
                className="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition app-border app-surface hover:border-[var(--primary)]"
                disabled={isBusy}
                key={task.id}
                onClick={() => void onToggle(task)}
                type="button"
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "app-border app-surface-2 app-muted"
                  }`}
                >
                  {isBusy ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : isDone ? (
                    <Check className="size-3" />
                  ) : (
                    <RotateCcw className="size-3 opacity-0" />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium ${
                      isDone ? "line-through app-muted" : "app-text"
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.category ? (
                    <span className="mt-1 block text-[10px] app-muted">
                      {task.category.name}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed p-3 text-xs leading-5 app-border app-muted">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}
