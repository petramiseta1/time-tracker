import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatDurationInput,
  formatHoursDecimal,
  parseDuration,
} from "./duration";

describe("parseDuration", () => {
  it("parses h:mm form", () => {
    expect(parseDuration("1:30")).toBe(90);
  });

  it("parses decimal hours", () => {
    expect(parseDuration("1.5")).toBe(90);
  });

  it("parses hours with an h suffix", () => {
    expect(parseDuration("1.5h")).toBe(90);
  });

  it("parses minutes with an m suffix", () => {
    expect(parseDuration("90m")).toBe(90);
  });

  it("trims surrounding whitespace", () => {
    expect(parseDuration("  90m  ")).toBe(90);
  });

  it("returns null for empty input", () => {
    expect(parseDuration("")).toBeNull();
  });

  it("returns null for unrecognized input", () => {
    expect(parseDuration("not a duration")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats whole hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("pads single-digit minutes", () => {
    expect(formatDuration(65)).toBe("1h 05m");
  });

  it("formats zero minutes", () => {
    expect(formatDuration(0)).toBe("0h 00m");
  });
});

describe("formatDurationInput", () => {
  it("round-trips with parseDuration's h:mm form", () => {
    expect(formatDurationInput(90)).toBe("1:30");
    expect(parseDuration(formatDurationInput(90))).toBe(90);
  });
});

describe("formatHoursDecimal", () => {
  it("formats minutes as decimal hours", () => {
    expect(formatHoursDecimal(90)).toBe("1.5");
  });
});
