"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { DarkSelect } from "@/components/ui/dark-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  CreatePlannerEventInput,
  NoteWithRelations,
  PlannerEventWithLinks,
  TaskWithCategory,
} from "@/types";

interface PlannerEventFormProps {
  error: string;
  event: PlannerEventWithLinks | null;
  initialStartAt?: string;
  isOpen: boolean;
  isSaving: boolean;
  notes: NoteWithRelations[];
  onClose: () => void;
  onSubmit: (input: CreatePlannerEventInput) => void;
  tasks: TaskWithCategory[];
}

interface FormState {
  allDay: boolean;
  color: string;
  description: string;
  endAt: string;
  eventType: CreatePlannerEventInput["event_type"];
  noteId: string;
  priority: CreatePlannerEventInput["priority"];
  startAt: string;
  status: CreatePlannerEventInput["status"];
  taskId: string;
  title: string;
}

function getDefaultDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  return toDateTimeValue(date.toISOString());
}

function toDateValue(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toDateTimeValue(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function normalizeDateInput(value: string, allDay: boolean, isEnd = false) {
  if (!value) return null;

  if (allDay) {
    return new Date(`${value}T${isEnd ? "23:59:00" : "00:00:00"}`).toISOString();
  }

  return new Date(value).toISOString();
}

function createInitialState(
  event: PlannerEventWithLinks | null,
  initialStartAt?: string,
): FormState {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    eventType: event?.event_type ?? "plan",
    status: event?.status ?? "scheduled",
    priority: event?.priority ?? "medium",
    startAt: event
      ? event.all_day
        ? toDateValue(event.start_at)
        : toDateTimeValue(event.start_at)
      : initialStartAt ?? getDefaultDateTime(),
    endAt: event
      ? event.all_day
        ? toDateValue(event.end_at ?? event.start_at)
        : toDateTimeValue(event.end_at)
      : "",
    allDay: event?.all_day ?? false,
    taskId: event?.task_id ?? "",
    noteId: event?.note_id ?? "",
    color: event?.color ?? "#8b5cf6",
  };
}

export function PlannerEventForm({
  error,
  event,
  initialStartAt,
  isOpen,
  isSaving,
  notes,
  onClose,
  onSubmit,
  tasks,
}: PlannerEventFormProps) {
  const [state, setState] = useState<FormState>(
    createInitialState(event, initialStartAt),
  );

  const taskOptions = useMemo(
    () => [
      { label: "Görev baglama", value: "" },
      ...tasks.map((task) => ({
        label: task.title,
        value: task.id,
      })),
    ],
    [tasks],
  );

  const noteOptions = useMemo(
    () => [
      { label: "Not baglama", value: "" },
      ...notes.map((note) => ({
        label: note.title,
        value: note.id,
      })),
    ],
    [notes],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[145] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        aria-label="Plan formunu kapat"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <Card className="safe-bottom relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-b-none p-4 sm:max-h-[92vh] sm:rounded-[14px] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400">
              Takvim
            </p>
            <h2 className="mt-2 text-xl font-semibold app-text">
              {event ? "Planı düzenle" : "Yeni plan oluştur"}
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

        <form
          className="mt-6 space-y-4"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            onSubmit({
              title: state.title,
              description: state.description,
              event_type: state.eventType,
              status: state.status,
              priority: state.priority,
              start_at:
                normalizeDateInput(state.startAt, state.allDay) ??
                new Date().toISOString(),
              end_at: normalizeDateInput(state.endAt, state.allDay, true),
              all_day: state.allDay,
              task_id: state.taskId || null,
              note_id: state.noteId || null,
              color: state.color || null,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium app-muted sm:col-span-2">
              Başlık
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                maxLength={200}
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    title: inputEvent.target.value,
                  }))
                }
                placeholder="Sabah operasyon kontrolü"
                required
                type="text"
                value={state.title}
              />
            </label>

            <label className="text-xs font-medium app-muted sm:col-span-2">
              Açıklama
              <textarea
                className="app-input mt-2 min-h-28 w-full rounded-xl border px-3 py-3 text-sm outline-none"
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    description: inputEvent.target.value,
                  }))
                }
                placeholder="Planın amacı, notu veya takip bilgisi..."
                value={state.description}
              />
            </label>

            <div>
              <p className="mb-2 text-xs font-medium app-muted">Tür</p>
              <DarkSelect
                ariaLabel="Plan tipi"
                onChange={(value) =>
                  setState((current) => ({
                    ...current,
                    eventType: value as FormState["eventType"],
                  }))
                }
                options={[
                  { label: "Plan", value: "plan" },
                  { label: "Odak", value: "focus" },
                  { label: "Hatırlatma", value: "reminder" },
                  { label: "Toplantı", value: "meeting" },
                  { label: "Görev", value: "task" },
                  { label: "Not", value: "note" },
                  { label: "Kişisel", value: "personal" },
                ]}
                value={state.eventType ?? "plan"}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium app-muted">Durum</p>
              <DarkSelect
                ariaLabel="Plan durumu"
                onChange={(value) =>
                  setState((current) => ({
                    ...current,
                    status: value as FormState["status"],
                  }))
                }
                options={[
                  { label: "Planlandı", value: "scheduled" },
                  { label: "Devam ediyor", value: "in_progress" },
                  { label: "Tamamlandı", value: "done" },
                  { label: "İptal", value: "cancelled" },
                ]}
                value={state.status ?? "scheduled"}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium app-muted">Öncelik</p>
              <DarkSelect
                ariaLabel="Plan onceligi"
                onChange={(value) =>
                  setState((current) => ({
                    ...current,
                    priority: value as FormState["priority"],
                  }))
                }
                options={[
                  { label: "Düşük", value: "low" },
                  { label: "Orta", value: "medium" },
                  { label: "Yüksek", value: "high" },
                  { label: "Kritik", value: "critical" },
                ]}
                value={state.priority ?? "medium"}
              />
            </div>

            <label className="text-xs font-medium app-muted">
              Renk
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border p-2"
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    color: inputEvent.target.value,
                  }))
                }
                type="color"
                value={state.color}
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm app-border app-surface-2 app-text sm:col-span-2">
              <input
                checked={state.allDay}
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    allDay: inputEvent.target.checked,
                    endAt: "",
                    startAt: inputEvent.target.checked
                      ? toDateValue(current.startAt)
                      : getDefaultDateTime(),
                  }))
                }
                type="checkbox"
              />
              Tüm gün etkinliği
            </label>

            <label className="text-xs font-medium app-muted">
              Başlangıç
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    startAt: inputEvent.target.value,
                  }))
                }
                required
                type={state.allDay ? "date" : "datetime-local"}
                value={state.startAt}
              />
            </label>

            <label className="text-xs font-medium app-muted">
              Bitiş
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                onChange={(inputEvent) =>
                  setState((current) => ({
                    ...current,
                    endAt: inputEvent.target.value,
                  }))
                }
                type={state.allDay ? "date" : "datetime-local"}
                value={state.endAt}
              />
            </label>

            <div>
              <p className="mb-2 text-xs font-medium app-muted">
                Bağlı görev
              </p>
              <DarkSelect
                ariaLabel="Bağlı görev"
                onChange={(value) =>
                  setState((current) => ({
                    ...current,
                    taskId: value,
                  }))
                }
                options={taskOptions}
                value={state.taskId}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium app-muted">
                Bağlı not
              </p>
              <DarkSelect
                ariaLabel="Bağlı not"
                onChange={(value) =>
                  setState((current) => ({
                    ...current,
                    noteId: value,
                  }))
                }
                options={noteOptions}
                value={state.noteId}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button disabled={isSaving} onClick={onClose} variant="secondary">
              İptal
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              Kaydet
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
