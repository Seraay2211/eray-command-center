"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

interface LoginFormProps {
  configurationError?: string;
  initialError?: string;
  initialMessage?: string;
}

function getAuthErrorMessage(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Geçersiz giriş bilgileri. E-posta adresini ve şifreni kontrol et.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Giriş yapmadan önce e-posta adresini doğrulamalısın.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "Bu e-posta adresiyle daha önce hesap oluşturulmuş.";
  }

  if (normalizedMessage.includes("password")) {
    return "Şifre en az 6 karakter olmalı.";
  }

  if (
    normalizedMessage.includes("fetch") ||
    normalizedMessage.includes("network")
  ) {
    return "Giriş bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.";
  }

  return message || "Beklenmeyen bir kimlik doğrulama hatası oluştu.";
}

export function LoginForm({
  configurationError,
  initialError,
  initialMessage,
}: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isResetPending, setIsResetPending] = useState(false);
  const [error, setError] = useState(initialError ?? configurationError ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");

  const isConfigured = !configurationError;

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(configurationError ?? "");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsPending(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          throw signInError;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(window.location.origin),
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMessage(
        "Hesap oluşturuldu. Giriş yapmadan önce e-posta adresine gönderilen doğrulama bağlantısını aç.",
      );
      setMode("login");
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : String(authError);
      setError(getAuthErrorMessage(message));
    } finally {
      setIsPending(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Şifre sıfırlama bağlantısı için e-posta adresini yaz.");
      return;
    }

    setIsResetPending(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: getAuthCallbackUrl(
            window.location.origin,
            "/reset-password",
          ),
        },
      );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Şifre sıfırlama bağlantısı gönderildi. E-posta adresini kontrol et.",
      );
    } catch (resetError) {
      const resetMessage =
        resetError instanceof Error ? resetError.message : String(resetError);
      setError(getAuthErrorMessage(resetMessage));
    } finally {
      setIsResetPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[0.07] bg-black/20 p-1">
        <button
          className={`h-9 rounded-lg text-xs font-semibold transition ${
            mode === "login"
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-300"
          }`}
          onClick={() => changeMode("login")}
          type="button"
        >
          Giriş Yap
        </button>
        <button
          className={`h-9 rounded-lg text-xs font-semibold transition ${
            mode === "signup"
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-300"
          }`}
          onClick={() => changeMode("signup")}
          type="button"
        >
          Hesap Oluştur
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-xs font-medium text-zinc-400"
            htmlFor="auth-email"
          >
            E-posta
          </label>
          <span className="relative block">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10"
              disabled={!isConfigured || isPending}
              id="auth-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="eray@example.com"
              required
              type="email"
              value={email}
            />
          </span>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              className="block text-xs font-medium text-zinc-400"
              htmlFor="auth-password"
            >
              Şifre
            </label>
            {mode === "login" ? (
              <button
                className="text-[11px] font-medium text-violet-400 transition hover:text-violet-300 disabled:opacity-50"
                disabled={!isConfigured || isPending || isResetPending}
                onClick={() => void handleForgotPassword()}
                type="button"
              >
                {isResetPending
                  ? "Bağlantı gönderiliyor..."
                  : "Şifremi unuttum"}
              </button>
            ) : null}
          </div>
          <span className="relative block">
            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-11 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/10"
              disabled={!isConfigured || isPending}
              id="auth-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="En az 6 karakter"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </span>
        </div>

        {error ? (
          <div
            className="flex gap-2.5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : null}

        {message ? (
          <div
            className="flex gap-2.5 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.07] p-3 text-xs leading-5 text-emerald-200"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        ) : null}

        <Button
          className="mt-2 w-full"
          disabled={!isConfigured || isPending}
          type="submit"
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {isPending
            ? mode === "login"
              ? "Giriş yapılıyor..."
              : "Hesap oluşturuluyor..."
            : mode === "login"
              ? "Giriş Yap"
              : "Hesap Oluştur"}
          {!isPending ? <ArrowRight className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-5 text-zinc-700">
        {mode === "login" ? "Henüz hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
        <button
          className="font-semibold text-violet-400 transition hover:text-violet-300"
          onClick={() => changeMode(mode === "login" ? "signup" : "login")}
          type="button"
        >
          {mode === "login" ? "Hesap oluştur" : "Giriş yap"}
        </button>
      </p>
    </div>
  );
}
