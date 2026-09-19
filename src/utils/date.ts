import {
  addDays as addDaysFns,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isValid,
  parseISO,
  startOfWeek,
} from "date-fns";

const DATE_KEY_FORMAT = "yyyy-MM-dd";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// The API's own date format (YYYY-MM-DD) — used as the canonical key for
// comparing/grouping entries by day everywhere in the app.
export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT);
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

// Guards the `/day/:date` route param — parseISO doesn't reject malformed
// input, it just returns an Invalid Date, so a bad URL (typo, garbage,
// missing param) needs to be caught before it reaches the rest of the page.
export function isValidDateKey(key: string | undefined): key is string {
  return (
    key !== undefined && DATE_KEY_PATTERN.test(key) && isValid(parseISO(key))
  );
}

export function addDays(date: Date, amount: number): Date {
  return addDaysFns(date, amount);
}

// Monday-Sunday week containing `date`, per docs/adr/0006-week-strip-in-day-view.md.
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDates(date: Date): Date[] {
  return eachDayOfInterval({
    start: getWeekStart(date),
    end: getWeekEnd(date),
  });
}

export function formatDayLabel(date: Date): string {
  return format(date, "EEE").toUpperCase();
}

export function formatDayOfMonth(date: Date): string {
  return format(date, "d");
}

export function formatFullDate(date: Date): string {
  return format(date, "EEE, d MMM yyyy");
}

export function formatShortDate(date: Date): string {
  return format(date, "d MMM");
}

export { isSameDay, isToday };
