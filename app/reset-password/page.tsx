import Link from "next/link";
import { Command } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv, SUPABASE_ENV_ERROR } from "@/lib/supabase/env";

export const metadata = {
  title: "Şifreyi Yenile",
};

export default function ResetPasswordPage() {
  return (
    <main className="app-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <span className="app-primary-bg flex size-11 items-center justify-center rounded-xl">
          <Command className="size-5" />
        </span>
        <p className="app-primary mt-6 text-[10px] font-semibold uppercase tracking-[0.18em]">
          Eray Command Center
        </p>
        <h1 className="app-text mt-2 text-2xl font-semibold">
          Yeni şifreni belirle
        </h1>
        <p className="app-muted mt-2 text-sm leading-6">
          Hesabın için güçlü ve daha önce kullanmadığın bir şifre oluştur.
        </p>
        <div className="mt-6">
          {hasSupabaseEnv() ? (
            <ResetPasswordForm />
          ) : (
            <p className="text-sm text-[var(--danger)]">{SUPABASE_ENV_ERROR}</p>
          )}
        </div>
        <Link
          className="app-primary mt-5 block text-center text-xs font-medium"
          href="/login"
        >
          Giriş ekranına dön
        </Link>
      </Card>
    </main>
  );
}
