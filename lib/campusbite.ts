import "server-only";

export const CURRENT_STUDENT_ID = "S001";

export function formatSlot(value: string): string {
  const [hoursText, minutes = "00"] = value.split(":");
  const hours = Number(hoursText);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return value;
  const suffix = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.padStart(2, "0")} ${suffix}`;
}

export function relatedRow<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}
