"use client";

import {
  CalendarDays,
  Paintbrush,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AccountCardProps {
  activeTheme: string;
  createdAt: string;
  email: string;
  isOnboardingPending: boolean;
  onShowOnboarding: () => void;
}

function formatAccountDate(value: string): string {
  if (!value) return "Bilgi bulunamadı";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AccountCard({
  activeTheme,
  createdAt,
  email,
  isOnboardingPending,
  onShowOnboarding,
}: AccountCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="app-surface-2 app-border border-b p-5">
        <div className="flex items-start gap-3">
          <span className="app-primary-bg flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="app-text truncate text-sm font-semibold">{email}</p>
            <p className="app-muted mt-1 text-xs">
              Tercihlerin ve çalışma verilerin hesabınla eşitlenir.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="app-surface-2 app-border rounded-xl border p-3">
          <CalendarDays className="app-primary size-4" />
          <p className="app-muted mt-2 text-[10px] uppercase tracking-[0.12em]">
            Hesap Oluşturma
          </p>
          <p className="app-text mt-1 text-xs font-medium">
            {formatAccountDate(createdAt)}
          </p>
        </div>
        <div className="app-surface-2 app-border rounded-xl border p-3">
          <Paintbrush className="app-primary size-4" />
          <p className="app-muted mt-2 text-[10px] uppercase tracking-[0.12em]">
            Aktif Tema
          </p>
          <p className="app-text mt-1 text-xs font-medium">{activeTheme}</p>
        </div>
        <div className="app-surface-2 app-border rounded-xl border p-3 sm:col-span-2">
          <div className="flex items-start gap-3">
            <Smartphone className="app-primary mt-0.5 size-4 shrink-0" />
            <div>
              <p className="app-text text-xs font-medium">
                Telefonda uygulama gibi kullan
              </p>
              <p className="app-muted mt-1 text-[11px] leading-5">
                Tarayıcı menüsündeki “Ana ekrana ekle” seçeneğiyle panele daha
                hızlı erişebilirsin.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="app-border border-t p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="sm:flex-1"
            disabled={isOnboardingPending}
            onClick={onShowOnboarding}
            variant="secondary"
          >
            <PlayCircle className="size-4" />
            Tanıtımı Tekrar Göster
          </Button>
          <div className="sm:flex-1">
            <LogoutButton />
          </div>
        </div>
        <p className="app-muted mt-3 flex items-center gap-2 text-[10px]">
          <ShieldCheck className="size-3.5 text-[var(--success)]" />
          Oturumun ve kişisel verilerin güvenli erişim kurallarıyla korunur.
        </p>
      </div>
    </Card>
  );
}
