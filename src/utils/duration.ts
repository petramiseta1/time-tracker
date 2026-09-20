export const DAILY_TARGET_MINUTES = 8 * 60;

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

// Inverse of parseDuration's h:mm form so an untouched edit field round-trips.
export function formatDurationInput(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

const HOURS_MINUTES_PATTERN = /^(\d+):([0-5]?\d)$/;
const MINUTES_SUFFIX_PATTERN = /^(\d+(?:\.\d+)?)m$/i;
const HOURS_SUFFIX_PATTERN = /^(\d+(?:\.\d+)?)h$/i;
const DECIMAL_HOURS_PATTERN = /^(\d+(?:\.\d+)?)$/;

// Accepts 1:30, 1.5, 1.5h, or 90m. Returns whole minutes, or null if unrecognized.
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
