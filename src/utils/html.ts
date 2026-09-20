// Productive's note field is HTML from its editor, e.g.
// "<ul><li><p>Testing</p></li></ul>". We only display plain text.
// DOMParser handles entities and broken markup; the parsed document is
// never attached to the page or assigned to innerHTML.
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
