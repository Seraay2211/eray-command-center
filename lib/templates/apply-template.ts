import type { TemplateVariable } from "@/types";

export interface ApplyTemplateContext {
  category?: string | null;
  date?: Date;
  time?: Date;
  title?: string | null;
  user?: string | null;
  variables?: Record<string, string | undefined>;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function getTemplatePlaceholderValues(
  context: ApplyTemplateContext = {},
): Record<string, string> {
  const dateValue = context.date ?? new Date();
  const timeValue = context.time ?? new Date();
  const customVariables = Object.fromEntries(
    Object.entries(context.variables ?? {}).map(([key, value]) => [
      key,
      value ?? "",
    ]),
  ) as Record<string, string>;

  return {
    ...customVariables,
    category: context.category?.trim() || "",
    date: formatDate(dateValue),
    time: formatTime(timeValue),
    title: context.title?.trim() || "",
    user: context.user?.trim() || "",
  };
}

export function applyTemplateVariables(
  templateContent: string,
  context: ApplyTemplateContext = {},
): string {
  const values = getTemplatePlaceholderValues(context);

  return templateContent.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return key in values ? values[key] : match;
  });
}

export function cleanSystemTemplateContent(templateContent: string): string {
  return templateContent
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s*/, "").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getTemplateVariableDefaults(
  variables: TemplateVariable[] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (variables ?? []).map((variable) => [
      variable.key,
      variable.defaultValue ?? "",
    ]),
  );
}
