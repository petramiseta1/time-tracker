// Per the mockup's own note: "The 8 h target belongs in one constant, ready
// to become a setting later."
export const DAILY_TARGET_MINUTES = 8 * 60;

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

const HOURS_MINUTES_PATTERN = /^(\d+):([0-5]?\d)$/;
const MINUTES_SUFFIX_PATTERN = /^(\d+(?:\.\d+)?)m$/i;
const HOURS_SUFFIX_PATTERN = /^(\d+(?:\.\d+)?)h$/i;
const DECIMAL_HOURS_PATTERN = /^(\d+(?:\.\d+)?)$/;

// Parses the flexible duration field (docs/adr/0005-flexible-duration-field.md):
// `1:30` (h:mm), `1.5` or `1.5h` (decimal hours), `90m` (minutes). Returns
// whole minutes, or null if the input doesn't match any accepted form —
// callers treat null the same as a non-positive result for validation.
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }

  const hoursMinutes = HOURS_MINUTES_PATTERN.exec(trimmed);
  if (hoursMinutes) {
    return Number(hoursMinutes[1]) * 60 + Number(hoursMinutes[2]);
  }

  const minutesSuffix = MINUTES_SUFFIX_PATTERN.exec(trimmed);
  if (minutesSuffix) {
    return Math.round(Number(minutesSuffix[1]));
  }

  const hoursSuffix = HOURS_SUFFIX_PATTERN.exec(trimmed);
  if (hoursSuffix) {
    return Math.round(Number(hoursSuffix[1]) * 60);
  }

  const decimalHours = DECIMAL_HOURS_PATTERN.exec(trimmed);
  if (decimalHours) {
    return Math.round(Number(decimalHours[1]) * 60);
  }

  return null;
}
