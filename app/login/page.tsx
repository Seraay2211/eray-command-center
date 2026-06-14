import { Command, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  hasSupabaseEnv,
  SUPABASE_ENV_ERROR,
  SUPABASE_ENV_INVALID_ERROR,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Giriş Yap",
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

const initialErrors: Record<string, string> = {
  auth: "Oturum doğrulanamadı. Lütfen tekrar giriş yap.",
  callback: "E-posta doğrulama bağlantısı tamamlanamadı.",
  config: SUPABASE_ENV_INVALID_ERROR,
  connection:
    "Supabase bağlantısı kurulamadı. Proje URL’sini, anahtarı ve internet bağlantısını kontrol et.",
};

const initialMessages: Record<string, string> = {
  "password-updated": "Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const isConfigured = hasSupabaseEnv();
  const query = await searchParams;
  let isAuthenticated = false;

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getClaims();
      isAuthenticated = Boolean(!error && data?.claims);
    } catch {
      // The form below presents a useful connection error.
    }
  }

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  const configurationError = isConfigured
    ? undefined
    : process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? SUPABASE_ENV_INVALID_ERROR
      : SUPABASE_ENV_ERROR;
  const initialError = query.error ? initialErrors[query.error] : undefined;
  const initialMessage = query.message
    ? initialMessages[query.message]
    : undefined;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18rem] size-[38rem] -translate-x-1/2 rounded-full bg-violet-600/[0.13] blur-[110px]" />
        <div className="absolute bottom-[-12rem] right-[-10rem] size-[30rem] rounded-full bg-indigo-600/[0.08] blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101013]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden border-r border-white/[0.06] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 top-20 size-80 rounded-full bg-violet-600/[0.12] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500 text-white shadow-[0_0_32px_rgba(139,92,246,0.28)]">
                <Command className="size-5" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Eray Command Center
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                  Secure workspace
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                <ShieldCheck className="size-3.5" />
                Güvenli erişim
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white">
                Operasyon merkezine güvenli giriş.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-500">
                Notlarını, görevlerini ve kişisel iş akışını yalnızca sana ait
                güvenli çalışma alanında yönet.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <LockKeyhole className="size-4 text-violet-400" />
              <p className="mt-3 text-xs font-semibold text-zinc-300">
                Güvenli oturum
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-700">
                Supabase Auth ile cookie tabanlı SSR oturumu.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <Sparkles className="size-4 text-violet-400" />
              <p className="mt-3 text-xs font-semibold text-zinc-300">
                Kişisel alan
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-700">
                Yalnızca doğrulanmış kullanıcı erişimi.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[620px] items-center px-5 py-8 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-[0_0_32px_rgba(139,92,246,0.25)]">
                <Command className="size-5" />
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400">
              Eray Command Center
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {query.error ? "Tekrar giriş yap" : "Çalışma alanına giriş yap"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Kişisel operasyon paneline güvenli giriş yap.
            </p>

            <div className="mt-8">
              <LoginForm
                configurationError={configurationError}
                initialError={initialError}
                initialMessage={initialMessage}
              />
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-zinc-700">
              <ShieldCheck className="size-3.5" />
              Oturum bilgileri güvenli cookie ile korunur.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
