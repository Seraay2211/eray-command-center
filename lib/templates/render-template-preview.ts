import {
  applyTemplateVariables,
  type ApplyTemplateContext,
} from "@/lib/templates/apply-template";

export type TemplatePreviewLine = {
  kind: "heading" | "subheading" | "paragraph" | "spacer";
  text: string;
};

const DEFAULT_PREVIEW_CONTEXT: ApplyTemplateContext = {
  category: "Örnek Kategori",
  title: "Örnek Başlık",
  user: "Eray",
};

export function renderTemplateForPreview(
  content: string,
  context: ApplyTemplateContext = {},
): TemplatePreviewLine[] {
  const rendered = applyTemplateVariables(content, {
    ...context,
    category:
      context.category?.trim() || DEFAULT_PREVIEW_CONTEXT.category,
    title: context.title?.trim() || DEFAULT_PREVIEW_CONTEXT.title,
    user: context.user?.trim() || DEFAULT_PREVIEW_CONTEXT.user,
  });

  return rendered.split(/\r?\n/).map((line) => {
    const value = line.trimEnd();

    if (!value.trim()) {
      return { kind: "spacer", text: "" };
    }

    const markdownHeading = value.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (markdownHeading) {
      return {
        kind: markdownHeading[1].length === 1 ? "heading" : "subheading",
        text: markdownHeading[2].trim(),
      };
    }

    if (value === value.toLocaleUpperCase("tr-TR") && /[A-ZÇĞİÖŞÜ]/.test(value)) {
      return { kind: "heading", text: value.trim() };
    }

    if (value.trim().endsWith(":")) {
      return { kind: "subheading", text: value.trim() };
    }

    return {
      kind: "paragraph",
      text: value.replace(/^[-*]\s+/, "• "),
    };
  });
}

export function cleanTemplatePreview(
  content: string,
  context: ApplyTemplateContext = {},
  maxLength = 180,
): string {
  const cleaned = renderTemplateForPreview(content, context)
    .filter((line) => line.kind !== "spacer")
    .slice(0, 5)
    .map((line) => line.text)
    .join(" · ")
    .replace(/\{\{\s*([^}]+)\s*\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength - 3).trimEnd()}...`
    : cleaned;
}
