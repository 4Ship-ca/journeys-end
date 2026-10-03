export const NOTICE_SCOPE =
  "English wording only and not date-specific. A missing notice is not proof that a place is open.";

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&#160;": " ",
  "&amp;": "&",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ndash;": "–",
  "&mdash;": "—",
  "&lt;": " ",
  "&gt;": " ",
};

/** Reduces an HTML page to visible-ish plain text. The output is never rendered as HTML. */
export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|head)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NOTICE_PATTERN =
  /.{0,35}\b(?:temporarily closed|closure|closures|closed today|closed until|cancelled|canceled|maintenance)\b.{0,85}/gi;

/**
 * Finds up to two short snippets of closure-like wording. This is deliberately
 * weak evidence: it cannot establish opening status for any date.
 */
export function extractNotices(html: string, limit = 2): string[] {
  const text = htmlToText(html);
  const notices: string[] = [];
  for (const match of text.match(NOTICE_PATTERN) ?? []) {
    const snippet = match.trim().split(" ").slice(0, 12).join(" ");
    if (snippet && !notices.includes(snippet)) notices.push(snippet);
    if (notices.length >= limit) break;
  }
  return notices;
}
