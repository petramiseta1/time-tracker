import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first and last name's first letters", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("uses the first two letters of a single name", () => {
    expect(getInitials("Ada")).toBe("AD");
  });

  it("ignores extra whitespace between names", () => {
    expect(getInitials("  Ada   Lovelace  ")).toBe("AL");
  });

  it("returns an empty string for empty input", () => {
    expect(getInitials("")).toBe("");
  });
});
