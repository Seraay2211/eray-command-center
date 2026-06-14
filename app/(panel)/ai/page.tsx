import { AiWorkspace } from "@/components/ai/ai-workspace";
import { isAiActionKey } from "@/lib/ai/actions";
import { hasGeminiApiKey } from "@/lib/ai/config";
import { getUserSettings } from "@/services/settings-service";
import type { AiActionKey } from "@/types";

export const metadata = {
  title: "AI Asistan",
};

interface AiPageProps {
  searchParams: Promise<{
    action?: string;
  }>;
}

export default async function AiPage({ searchParams }: AiPageProps) {
  const [query, settingsResult] = await Promise.all([
    searchParams,
    getUserSettings(),
  ]);
  const initialAction: AiActionKey = isAiActionKey(query.action)
    ? query.action
    : (settingsResult.data?.ai_default_action ?? "summarize");

  return (
    <AiWorkspace
      initialAction={initialAction}
      isAiConfigured={hasGeminiApiKey()}
      key={initialAction}
      showSensitiveWarning={
        settingsResult.data?.ai_sensitive_warning ?? true
      }
    />
  );
}
