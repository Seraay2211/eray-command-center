const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

export function getIstanbulDateKey(value = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: ISTANBUL_TIME_ZONE,
    year: "numeric",
  }).formatToParts(value);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function getIstanbulDayRange(value = new Date()) {
  const dateKey = getIstanbulDateKey(value);
  const start = new Date(`${dateKey}T00:00:00+03:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    endIso: end.toISOString(),
    startIso: start.toISOString(),
  };
}

export function getIstanbulTodayDueDate(): string {
  return new Date(`${getIstanbulDateKey()}T12:00:00+03:00`).toISOString();
}
