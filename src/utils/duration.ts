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
