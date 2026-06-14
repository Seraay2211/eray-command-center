export function formatTRY(
  value: number | string | null | undefined,
): string {
  const numericValue =
    typeof value === "string"
      ? parseMoneyInput(value)
      : typeof value === "number"
        ? value
        : 0;

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatNumberTR(
  value: number | string | null | undefined,
): string {
  const numericValue =
    typeof value === "string"
      ? parseMoneyInput(value)
      : typeof value === "number"
        ? value
        : 0;

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function parseMoneyInput(
  input: string | number | null | undefined,
): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : 0;
  }

  const normalized = input
    .toString()
    .trim()
    .replace(/\s/g, "")
    .replace(/₺|TRY/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isValidMoneyInput(input: string): boolean {
  return parseMoneyInput(input) > 0;
}
