import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getInitialNotificationSnapshot } from "@/lib/notifications/initial-snapshot";
import { getInitialUserSettings } from "@/lib/settings/initial-settings";

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
  const settingsResult = await getInitialUserSettings();
  const notificationSnapshot = settingsResult.data?.notifications_enabled
    ? await getInitialNotificationSnapshot()
    : { data: { notifications: [], unreadCount: 0 }, error: null };

  return (
    <SettingsProvider
      initialSettings={settingsResult.data!}
    >
      <AppShell
        initialNotifications={notificationSnapshot.data?.notifications ?? []}
        initialUnreadCount={notificationSnapshot.data?.unreadCount ?? 0}
        userEmail={userEmail}
      >
        {children}
      </AppShell>
    </SettingsProvider>
  );
}
