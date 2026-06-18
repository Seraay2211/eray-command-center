import { SettingsClient } from "@/components/settings/settings-client";
import {
  getAiProviderLabel,
  resolveAiProvider,
} from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/features/notes/actions";
import { getAccountCenterData } from "@/services/account-service";
import { getUserSettings } from "@/services/settings-service";
import type { AccountCenterData } from "@/types";

export const metadata = {
  title: "Ayarlar",
};

export const dynamic = "force-dynamic";

const emptyAccountData: AccountCenterData = {
  activity: {
    lastCalendarActivity: null,
    lastFinanceActivity: null,
    lastNoteActivity: null,
    lastReportActivity: null,
    lastTaskActivity: null,
  },
  counts: {
    calendarCount: 0,
    financeCount: 0,
    installmentCount: 0,
    noteCount: 0,
    reportCount: 0,
    taskCount: 0,
  },
};

export default async function SettingsPage() {
  const [settingsResult, categoriesResult, accountResult] = await Promise.all([
    getUserSettings(),
    getCategories(),
    getAccountCenterData(),
  ]);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <SettingsClient
      accountData={accountResult.data ?? emptyAccountData}
      aiProviderLabel={getAiProviderLabel(resolveAiProvider())}
      categories={categoriesResult.data ?? []}
      initialError={
        settingsResult.error ?? categoriesResult.error ?? accountResult.error ?? ""
      }
      userCreatedAt={data.user?.created_at ?? ""}
      userEmail={data.user?.email ?? "Kullanıcı"}
      userLastSignInAt={data.user?.last_sign_in_at ?? ""}
    />
  );
}
