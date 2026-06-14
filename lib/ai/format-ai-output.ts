const TABLE_SEPARATOR_CELL = /^:?-{3,}:?$/;

export const AI_PLAIN_TEXT_INSTRUCTION = [
  "Yanıtı Türkçe ve sade düz metin olarak yaz.",
  "Markdown başlık işaretleri (#, ##), kalın yazı işaretleri (**), kod bloğu ve markdown tablosu kullanma.",
  "Tablo yerine her kaydı ayrı, kısa ve okunabilir satırlar halinde yaz.",
  "Ham JSON gösterme.",
].join(" ");

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/^\s{0,3}#{1,6}\s*/u, "")
    .replace(/\*\*(.*?)\*\*/gu, "$1")
    .replace(/__(.*?)__/gu, "$1")
    .replace(/~~(.*?)~~/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/^\s*[*+]\s+/u, "- ")
    .trimEnd();
}

function getTableCells(value: string): string[] {
  return value
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cleanInlineMarkdown(cell.trim()))
    .filter(Boolean);
}

function isTableSeparator(value: string): boolean {
  const cells = getTableCells(value);
  return cells.length > 0 && cells.every((cell) => TABLE_SEPARATOR_CELL.test(cell));
}

function wrapLongLine(value: string, maxLength = 160): string[] {
  if (value.length <= maxLength || !value.includes(" ")) return [value];

  const words = value.split(/\s+/u);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function formatOutput(value: string): string {
  if (!value.trim()) return "";

  const sourceLines = value
    .replace(/\r\n?/gu, "\n")
    .replace(/```(?:json|markdown|md|text)?/giu, "")
    .split("\n");
  const outputLines: string[] = [];

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();

    if (isTableSeparator(trimmed)) continue;

    if (trimmed.includes("|")) {
      const cells = getTableCells(trimmed);
      if (cells.length > 1) {
        outputLines.push(...wrapLongLine(cells.join(" — ")));
        continue;
      }
    }

    const cleaned = cleanInlineMarkdown(sourceLine);
    outputLines.push(...wrapLongLine(cleaned));
  }

  return outputLines
    .join("\n")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function formatAiOutputForDisplay(value: string): string {
  return formatOutput(value);
}

export function formatAiOutputForNote(value: string): string {
  return formatOutput(value);
}
