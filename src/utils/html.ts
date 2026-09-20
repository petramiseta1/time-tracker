// Productive stores notes as HTML; we display plain text. The parsed
// document is never attached to the page.
export function htmlToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const items = [...parsed.querySelectorAll("li")];
  if (items.length > 0) {
    return items
      .map((item) => item.textContent?.trim() ?? "")
      .filter(Boolean)
      .map((line) => `• ${line}`)
      .join("\n");
  }

  return (parsed.body.textContent ?? "").trim();
}
