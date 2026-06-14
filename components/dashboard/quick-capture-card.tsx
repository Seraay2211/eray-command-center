"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  NotebookPen,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createQuickCaptureNote } from "@/features/notes/actions";

export function QuickCaptureCard() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!content.trim()) {
      setError("Kaydetmek istediğin kısa notu yaz.");
      return;
    }

    setIsPending(true);
    const result = await createQuickCaptureNote({
      content,
      tags: ["dashboard"],
    });
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setContent("");
    setNotice("Hızlı kayıt notlarına eklendi.");
    router.refresh();
  }

  return (
    <Card className="h-full p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="app-primary-bg flex size-9 items-center justify-center rounded-xl">
          <NotebookPen className="size-4" />
        </span>
        <div>
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
            Anında Not Al
          </p>
          <h2 className="app-text mt-1 text-base font-semibold">Hızlı Kayıt</h2>
        </div>
      </div>
      <p className="app-muted mt-3 text-xs leading-5">
        Aklındaki işi veya ödeme notunu kaydet. Kayıt “Hızlı Kayıtlar”
        kategorisine ve “dashboard” etiketine eklenir.
      </p>

      <form className="mt-4" onSubmit={handleSubmit}>
        <textarea
          className="app-input min-h-28 w-full resize-y rounded-xl border px-3 py-3 text-sm leading-6 outline-none"
          maxLength={1200}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Örn. Bugün QNB için ödeme planı yap..."
          value={content}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="app-muted text-[10px]">{content.length} / 1200</span>
          <Button disabled={isPending} size="sm" type="submit">
            {isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Kaydet
          </Button>
        </div>
      </form>

      {error ? (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-[var(--success)]"
          role="status"
        >
          <CheckCircle2 className="size-3.5" />
          {notice}
        </p>
      ) : null}
    </Card>
  );
}
