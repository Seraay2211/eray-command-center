import type {
  AiResponseTone,
  AppearancePreferences,
  AppCardStyle,
  AppLineHeight,
  AppTextSize,
  BackupReminderPreference,
  DailySummaryStyle,
} from "@/types";

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  ai_response_tone: "professional",
  backup_reminder: "off",
  card_style: "modern",
  daily_summary_style: "balanced",
  hide_sensitive_amounts: false,
  line_height: "normal",
  text_size: "normal",
};

const textSizes: AppTextSize[] = ["small", "normal", "large"];
const lineHeights: AppLineHeight[] = ["tight", "normal", "relaxed"];
const backupReminders: BackupReminderPreference[] = [
  "off",
  "weekly",
  "monthly",
];
const aiResponseTones: AiResponseTone[] = [
  "professional",
  "simple",
  "detailed",
];
const dailySummaryStyles: DailySummaryStyle[] = [
  "short",
  "balanced",
  "detailed",
];
const cardStyles: AppCardStyle[] = [
  "sharp",
  "modern",
  "rounded",
  "soft",
  "glass",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeAppearancePreferences(
  value: unknown,
): AppearancePreferences {
  if (!isRecord(value)) return { ...DEFAULT_APPEARANCE_PREFERENCES };

  return {
    ai_response_tone: aiResponseTones.includes(
      value.ai_response_tone as AiResponseTone,
    )
      ? (value.ai_response_tone as AiResponseTone)
      : DEFAULT_APPEARANCE_PREFERENCES.ai_response_tone,
    backup_reminder: backupReminders.includes(
      value.backup_reminder as BackupReminderPreference,
    )
      ? (value.backup_reminder as BackupReminderPreference)
      : DEFAULT_APPEARANCE_PREFERENCES.backup_reminder,
    text_size: textSizes.includes(value.text_size as AppTextSize)
      ? (value.text_size as AppTextSize)
      : DEFAULT_APPEARANCE_PREFERENCES.text_size,
    line_height: lineHeights.includes(value.line_height as AppLineHeight)
      ? (value.line_height as AppLineHeight)
      : DEFAULT_APPEARANCE_PREFERENCES.line_height,
    card_style: cardStyles.includes(value.card_style as AppCardStyle)
      ? (value.card_style as AppCardStyle)
      : DEFAULT_APPEARANCE_PREFERENCES.card_style,
    daily_summary_style: dailySummaryStyles.includes(
      value.daily_summary_style as DailySummaryStyle,
    )
      ? (value.daily_summary_style as DailySummaryStyle)
      : DEFAULT_APPEARANCE_PREFERENCES.daily_summary_style,
    hide_sensitive_amounts:
      typeof value.hide_sensitive_amounts === "boolean"
        ? value.hide_sensitive_amounts
        : DEFAULT_APPEARANCE_PREFERENCES.hide_sensitive_amounts,
  };
}
