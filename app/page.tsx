import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/services/settings-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=config");
  }

  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(!error && data?.claims);
  } catch {
    redirect("/login?error=connection");
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  const settingsResult = await getUserSettings();
  const landingPage = settingsResult.data?.default_landing_page ?? "dashboard";
  const landingRoutes = {
    dashboard: "/dashboard",
    today: "/today",
    notes: "/notes",
    finance: "/finance",
    tasks: "/tasks",
  } as const;

  redirect(landingRoutes[landingPage]);
}
