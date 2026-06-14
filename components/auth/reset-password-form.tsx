"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsPending(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      router.replace("/login?message=password-updated");
      router.refresh();
    } catch {
      setError(
        "Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir; yeni bir sıfırlama bağlantısı iste.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="app-muted block text-xs font-medium">
        Yeni Şifre
        <span className="relative mt-2 block">
          <LockKeyhole className="app-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <input
            autoComplete="new-password"
            className="app-input h-11 w-full rounded-xl border pl-10 pr-4 text-sm outline-none"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="En az 6 karakter"
            required
            type="password"
            value={password}
          />
        </span>
      </label>
      <label className="app-muted block text-xs font-medium">
        Yeni Şifre Tekrar
        <input
          autoComplete="new-password"
          className="app-input mt-2 h-11 w-full rounded-xl border px-4 text-sm outline-none"
          minLength={6}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </label>
      {error ? (
        <div
          className="flex gap-2 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] p-3 text-xs text-[var(--danger)]"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {isPending ? "Şifre güncelleniyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
