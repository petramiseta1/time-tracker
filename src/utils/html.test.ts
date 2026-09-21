import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./html";

describe("htmlToPlainText", () => {
  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
  });

  it("strips tags from plain paragraph HTML", () => {
    expect(htmlToPlainText("<p>Fixed the login bug</p>")).toBe(
      "Fixed the login bug",
    );
  });

  it("converts list items to bulleted lines", () => {
    const html = "<ul><li>Wrote tests</li><li>Fixed a bug</li></ul>";
    expect(htmlToPlainText(html)).toBe("• Wrote tests\n• Fixed a bug");
  });

  it("skips empty list items", () => {
    const html = "<ul><li>Wrote tests</li><li></li></ul>";
    expect(htmlToPlainText(html)).toBe("• Wrote tests");
  });
});
