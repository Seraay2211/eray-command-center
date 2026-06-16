import type {
  AppearancePreferences,
  AppCardStyle,
  AppLineHeight,
  AppTextSize,
} from "@/types";

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  card_style: "modern",
  line_height: "normal",
  text_size: "normal",
};

const textSizes: AppTextSize[] = ["small", "normal", "large"];
const lineHeights: AppLineHeight[] = ["tight", "normal", "relaxed"];
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
    text_size: textSizes.includes(value.text_size as AppTextSize)
      ? (value.text_size as AppTextSize)
      : DEFAULT_APPEARANCE_PREFERENCES.text_size,
    line_height: lineHeights.includes(value.line_height as AppLineHeight)
      ? (value.line_height as AppLineHeight)
      : DEFAULT_APPEARANCE_PREFERENCES.line_height,
    card_style: cardStyles.includes(value.card_style as AppCardStyle)
      ? (value.card_style as AppCardStyle)
      : DEFAULT_APPEARANCE_PREFERENCES.card_style,
  };
}
