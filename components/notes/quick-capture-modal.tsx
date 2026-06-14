"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickCaptureModalProps {
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: { content: string; title?: string }) => Promise<boolean>;
}

export function QuickCaptureModal({
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: QuickCaptureModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const isDirty = useMemo(
    () => Boolean(title.trim() || content.trim()),
    [content, title],
  );

  const attemptClose = useCallback(() => {
    if (
      isDirty &&
      !window.confirm("Kaydedilmemis degisiklikler var.")
    ) {
      return;
    }

    onClose();
  }, [isDirty, onClose]);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!content.trim()) {
        return false;
      }

      return onSubmit({
        content,
        title: title.trim() || undefined,
      });
    },
    [content, onSubmit, title],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
      }

      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        attemptClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attemptClose, handleSubmit, isOpen, isSaving]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        aria-label="Hızlı kayıt modalini kapat"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={attemptClose}
        type="button"
      />
      <div className="absolute inset-x-0 top-12 flex justify-center px-4">
        <form
          className="app-card relative w-full max-w-2xl rounded-3xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:p-6"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Hızlı Kayıt
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                Hızlı kayıt notu yakala
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Kaydettiğinde not otomatik olarak Hızlı Kayıtlar alanına düşer.
              </p>
            </div>
            <button
              className="text-zinc-600 transition hover:text-zinc-200"
              onClick={attemptClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10"
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Başlık (opsiyonel)"
              value={title}
            />
            <textarea
              autoFocus
              className="min-h-72 w-full resize-none rounded-[28px] border border-white/[0.08] bg-black/20 px-5 py-5 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10"
              onChange={(event) => setContent(event.target.value)}
              placeholder="Aklina geleni hizla yaz..."
              value={content}
            />
            {error ? (
              <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button onClick={attemptClose} type="button" variant="secondary">
              Kapat
            </Button>
            <Button disabled={isSaving || !content.trim()} type="submit">
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isSaving ? "Kaydediliyor..." : "Hızlı Kayda Ekle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
