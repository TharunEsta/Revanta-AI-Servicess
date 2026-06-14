export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function safeTimestamp(value: unknown): number {
  if (!value) return 0;

  try {
    const d =
      value instanceof Date
        ? value
        : new Date(String(value));

    const t = d.getTime();

    return Number.isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

function safeDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    const d =
      value instanceof Date
        ? value
        : new Date(String(value));

    const t = d.getTime();
    return Number.isNaN(t) ? null : d;
  } catch {
    return null;
  }
}

export function formatTimeInKolkata(value: unknown) {
  const d = safeDate(value);
  if (!d) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
}

export function formatDayGroupInKolkata(value: unknown) {
  const d = safeDate(value);
  if (!d) return "";

  const now = new Date();
  const nowStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yestStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(yest);

  const dStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);

  if (dStr === nowStr) return "Today";
  if (dStr === yestStr) return "Yesterday";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "short"
  }).format(d);
}


