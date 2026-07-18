import type { AppFontFamily } from "@/types";

export interface AppFontOption {
  label: string;
  value: AppFontFamily;
}

const SYSTEM_FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const APP_FONT_OPTIONS: AppFontOption[] = [
  { label: "Sistem", value: "system" },
  { label: "Inter", value: "inter" },
  { label: "Manrope", value: "manrope" },
  { label: "Plus Jakarta Sans", value: "jakarta" },
  { label: "Nunito Sans", value: "nunito" },
  { label: "Roboto", value: "roboto" },
  { label: "IBM Plex Sans", value: "ibm-plex" },
  { label: "Outfit", value: "outfit" },
  { label: "Space Grotesk", value: "space-grotesk" },
];

const APP_FONT_STACKS: Record<AppFontFamily, string> = {
  system: SYSTEM_FONT_STACK,
  inter: 'Inter, "Segoe UI", Arial, ui-sans-serif, system-ui, sans-serif',
  geist:
    '"ECC Geist", Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  manrope:
    'Manrope, "Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  jakarta:
    '"Plus Jakarta Sans", Aptos, "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  nunito:
    '"Nunito Sans", Verdana, "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  roboto: 'Roboto, Arial, "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  "ibm-plex":
    '"IBM Plex Sans", "Segoe UI", Tahoma, ui-sans-serif, system-ui, sans-serif',
  outfit:
    'Outfit, "Aptos Display", "Century Gothic", "Segoe UI", ui-sans-serif, sans-serif',
  "space-grotesk":
    '"Space Grotesk", Bahnschrift, "Trebuchet MS", "Segoe UI", ui-sans-serif, sans-serif',
};

export function normalizeAppFontFamily(
  value: AppFontFamily | null | undefined,
): AppFontFamily {
  return value === "geist" || !value ? "system" : value;
}

export function getAppFontStack(value: AppFontFamily): string {
  return APP_FONT_STACKS[value] ?? SYSTEM_FONT_STACK;
}

export function getAppFontLabel(value: AppFontFamily): string {
  return (
    APP_FONT_OPTIONS.find((option) => option.value === value)?.label ??
    "Sistem"
  );
}
