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

export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT);
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

// parseISO accepts malformed input as Invalid Date.
export function isValidDateKey(key: string | undefined): key is string {
  return (
    key !== undefined && DATE_KEY_PATTERN.test(key) && isValid(parseISO(key))
  );
}

export function addDays(date: Date, amount: number): Date {
  return addDaysFns(date, amount);
}

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
