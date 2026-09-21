import { describe, expect, it } from "vitest";
import {
  fromDateKey,
  getWeekEnd,
  getWeekStart,
  isValidDateKey,
  toDateKey,
} from "./date";

describe("toDateKey / fromDateKey", () => {
  it("round-trips a date through a YYYY-MM-DD key", () => {
    const date = new Date(2026, 2, 5); // 2026-03-05
    expect(toDateKey(date)).toBe("2026-03-05");
    expect(toDateKey(fromDateKey("2026-03-05"))).toBe("2026-03-05");
  });
});

describe("isValidDateKey", () => {
  it("accepts a well-formed date key", () => {
    expect(isValidDateKey("2026-03-05")).toBe(true);
  });

  it("rejects undefined", () => {
    expect(isValidDateKey(undefined)).toBe(false);
  });

  it("rejects a malformed string", () => {
    expect(isValidDateKey("not-a-date")).toBe(false);
  });

  it("rejects a calendar date that doesn't exist", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
  });
});

describe("getWeekStart / getWeekEnd", () => {
  it("treats Monday as the first day of the week", () => {
    const wednesday = fromDateKey("2026-03-04");
    expect(toDateKey(getWeekStart(wednesday))).toBe("2026-03-02");
    expect(toDateKey(getWeekEnd(wednesday))).toBe("2026-03-08");
  });
});
