export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function formatTimeInKolkata(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function formatDayGroupInKolkata(date: Date) {
  const d = new Date(date);

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

