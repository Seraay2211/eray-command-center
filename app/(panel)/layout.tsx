import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/services/notifications-service";
import { getOrCreateUserSettings } from "@/services/settings-service";

export const dynamic = "force-dynamic";

interface PanelLayoutProps {
  children: ReactNode;
}

export default async function PanelLayout({ children }: PanelLayoutProps) {
  const isSupabaseConfigured = hasSupabaseEnv();

  if (!isSupabaseConfigured) {
    redirect("/login?error=config");
  }

  let claims: Record<string, unknown> | undefined;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (!error) {
      claims = data?.claims;
    }
  } catch {
    redirect("/login?error=connection");
  }

  if (!claims) {
    redirect("/login");
  }

  const userEmail =
    typeof claims.email === "string" ? claims.email : "Kullanıcı";
  const settingsResult = await getOrCreateUserSettings();
  const [notificationsResult, unreadResult] =
    settingsResult.data?.notifications_enabled
      ? await Promise.all([
          getNotifications(30),
          getUnreadNotificationCount(),
        ])
      : [
          { data: [], error: null },
          { data: 0, error: null },
        ];

  return (
    <SettingsProvider
      initialSettings={settingsResult.data!}
      key={`${settingsResult.data!.user_id}:${settingsResult.data!.updated_at}`}
    >
      <AppShell
        initialNotifications={notificationsResult.data ?? []}
        initialUnreadCount={unreadResult.data ?? 0}
        isSupabaseConfigured={isSupabaseConfigured}
        userEmail={userEmail}
      >
        {children}
      </AppShell>
    </SettingsProvider>
  );
}
