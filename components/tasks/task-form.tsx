"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CalendarClock,
  Check,
  Flag,
  LoaderCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/tasks";
import type {
  Category,
  CreateTaskInput,
  TaskPriority,
  TaskStatus,
  TaskWithCategory,
} from "@/types";

interface TaskFormProps {
  categories: Category[];
  defaultPriority: TaskPriority;
  defaultStatus: TaskStatus;
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => void;
  task: TaskWithCategory | null;
}

const fieldClassName =
  "app-input w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 disabled:cursor-wait disabled:opacity-60";

function formatDateTimeInput(value: string | null): string {
  if (!value) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Istanbul",
  }).formatToParts(new Date(value));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}

export function TaskForm({
  categories,
  defaultPriority,
  defaultStatus,
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  task,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaultStatus,
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? defaultPriority,
  );
  const [categoryId, setCategoryId] = useState(task?.category_id ?? "");
  const [dueDate, setDueDate] = useState(
    formatDateTimeInput(task?.due_date ?? null),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      title,
      description,
      category_id: categoryId || null,
      status,
      priority,
      due_date: dueDate ? `${dueDate}:00+03:00` : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Görev formunu kapat"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        disabled={isSaving}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="app-surface safe-bottom absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l shadow-[-30px_0_80px_rgba(0,0,0,0.28)]"
        role="dialog"
      >
        <div className="app-border flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              {task ? "Görev düzenleme" : "Yeni görev"}
            </p>
            <h2
              className="app-text mt-1 text-lg font-semibold"
              id="task-form-title"
            >
              {task ? "Görevi düzenle" : "Yeni görev oluştur"}
            </h2>
          </div>
          <button
            aria-label="Görev formunu kapat"
            className="app-button-ghost flex size-9 items-center justify-center rounded-lg transition"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            <div>
              <label
                className="app-muted mb-2 block text-xs font-medium"
                htmlFor="task-title"
              >
                Başlık <span className="text-rose-400">*</span>
              </label>
              <input
                autoFocus
                className={`${fieldClassName} h-11`}
                disabled={isSaving}
                id="task-title"
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Görev başlığını yaz..."
                required
                value={title}
              />
              <span className="app-muted mt-1.5 block text-right font-mono text-[9px]">
                {title.length}/200
              </span>
            </div>

            <div>
              <label
                className="app-muted mb-2 block text-xs font-medium"
                htmlFor="task-description"
              >
                Açıklama
              </label>
              <textarea
                className={`${fieldClassName} min-h-40 resize-y py-3 leading-6`}
                disabled={isSaving}
                id="task-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Görevin kapsamını veya sonraki adımları yaz..."
                value={description}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="app-muted mb-2 text-xs font-medium">Durum</p>
                <DarkSelect
                  ariaLabel="Görev durumu"
                  disabled={isSaving}
                  onChange={(value) => setStatus(value as TaskStatus)}
                  options={TASK_STATUS_OPTIONS}
                  value={status}
                />
              </div>
              <div>
                <p className="app-muted mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <Flag className="size-3.5" />
                  Öncelik
                </p>
                <DarkSelect
                  ariaLabel="Görev önceliği"
                  disabled={isSaving}
                  onChange={(value) => setPriority(value as TaskPriority)}
                  options={TASK_PRIORITY_OPTIONS}
                  value={priority}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="app-muted mb-2 text-xs font-medium">
                  Kategori
                </p>
                <DarkSelect
                  ariaLabel="Görev kategorisi"
                  disabled={isSaving}
                  onChange={setCategoryId}
                  options={[
                    { label: "Kategorisiz", value: "" },
                    ...categories.map((category) => ({
                      label:
                        category.slug === "inbox"
                          ? "H\u0131zl\u0131 Kay\u0131t"
                          : category.name,
                      value: category.id,
                    })),
                  ]}
                  value={categoryId}
                />
              </div>
              <div>
                <label
                  className="app-muted mb-2 flex items-center gap-1.5 text-xs font-medium"
                  htmlFor="task-due-date"
                >
                  <CalendarClock className="size-3.5" />
                  Son tarih
                </label>
                <input
                  className={`${fieldClassName} h-11`}
                  disabled={isSaving}
                  id="task-due-date"
                  onChange={(event) => setDueDate(event.target.value)}
                  type="datetime-local"
                  value={dueDate}
                />
              </div>
            </div>

            {error ? (
              <div
                className="flex gap-2.5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                {error}
              </div>
            ) : null}
          </div>

          <div className="app-surface app-border flex justify-end gap-2 border-t px-5 py-4 sm:px-6">
            <Button
              disabled={isSaving}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              İptal
            </Button>
            <Button disabled={isSaving || !title.trim()} type="submit">
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isSaving ? "Kaydediliyor..." : "Görevi Kaydet"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
