import { SettingsClient } from "@/components/settings/settings-client";
import {
  getAiProviderLabel,
  resolveAiProvider,
} from "@/lib/ai/config";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/features/notes/actions";
import { getUserSettings } from "@/services/settings-service";

export const metadata = {
  title: "Ayarlar",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settingsResult, categoriesResult] = await Promise.all([
    getUserSettings(),
    getCategories(),
  ]);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <SettingsClient
      aiProviderLabel={getAiProviderLabel(resolveAiProvider())}
      categories={categoriesResult.data ?? []}
      initialError={settingsResult.error ?? categoriesResult.error ?? ""}
      isSupabaseConfigured={hasSupabaseEnv()}
      userCreatedAt={data.user?.created_at ?? ""}
      userEmail={data.user?.email ?? "Kullanıcı"}
    />
  );
}
