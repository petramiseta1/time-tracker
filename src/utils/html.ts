const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
]);

function nodeToPlainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const childText = Array.from(element.childNodes)
    .map(nodeToPlainText)
    .join("");

  if (tagName === "li") {
    // Leading newline guards against a sibling that ends without one — e.g.
    // a sub-list nested directly inside a <li> alongside its own leading
    // text (`<li>text<ul>...</ul></li>`), which would otherwise fuse onto
    // the preceding run with no separator. childText is trimmed so a block
    // child's own leading/trailing newline doesn't shove the bullet's text
    // onto its own line.
    return `\n• ${childText.trim()}\n`;
  }
  if (tagName === "br") {
    return "\n";
  }
  if (BLOCK_TAGS.has(tagName)) {
    return `\n${childText}\n`;
  }
  return childText;
}

// Productive's description field stores rich text as HTML (from its own
// editor) — e.g. "<ul><li><p>Testing</p></li></ul>". We only ever display
// plain text. Parsing with DOMParser (rather than a tag-stripping regex)
// gets correct entity decoding and malformed-markup handling for free, via
// the browser's real parser; the walk below only adds our own choice of
// how block elements and list items become newlines/bullets. The parsed
// document is never attached to the live page or rendered via innerHTML,
// so nothing in it executes or loads.
export function htmlToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  const text = nodeToPlainText(document.body);

  return text.replace(/\n{2,}/g, "\n").trim();
}
