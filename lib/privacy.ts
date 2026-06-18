import { formatTRY } from "@/lib/utils/currency";
import type { UserSettings } from "@/types";

export const MASKED_TRY_VALUE = "₺••••••";

export function isPrivacyModeEnabled(settings: UserSettings): boolean {
  return Boolean(settings.appearance_preferences?.hide_sensitive_amounts);
}

export function formatSensitiveTRY(
  value: number,
  settings: UserSettings,
): string {
  return isPrivacyModeEnabled(settings) ? MASKED_TRY_VALUE : formatTRY(value);
}
