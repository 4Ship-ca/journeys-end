import { isTransportEvent } from "../anniversary";
import type { AnniversaryEvent, ResearchResult } from "../api";

export const MAX_QUERY_LENGTH = 100;
export const MAX_EVENTS = 8;
export const ARCHIVE_ROWS = 5;
export const WIKIPEDIA_ROWS = 4;

/**
 * Plain search terms only: control characters and query-syntax characters are
 * removed, boolean operators are lowercased and leading negation is dropped.
 */
export function sanitizeQuery(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/["\\{}:()[\]^~*?!<>=&|+/]/g, " ")
    .replace(/\b(AND|OR|NOT|TO)\b/g, (word) => word.toLowerCase())
    .replace(/(^|\s)-+/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseYear(value: unknown): number | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const match = /\b(1[0-9]{3}|20[0-9]{2})\b/.exec(String(first ?? ""));
  return match ? Number(match[1]) : undefined;
}

function textOf(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.trim() ? first.trim().slice(0, 300) : undefined;
}

export function mapArchiveDocs(data: unknown): ResearchResult[] {
  const docs = isRecord(data) && isRecord(data.response) && Array.isArray(data.response.docs) ? data.response.docs : [];
  const results: ResearchResult[] = [];
  for (const doc of docs) {
    if (!isRecord(doc)) continue;
    const identifier = textOf(doc.identifier);
    const title = textOf(doc.title);
    if (!identifier || !title || !/^[A-Za-z0-9._-]{1,120}$/.test(identifier)) continue;
    const year = parseYear(doc.year);
    results.push({
      title,
      url: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      type: "Internet Archive",
      ...(year ? { year } : {}),
    });
  }
  return results.slice(0, ARCHIVE_ROWS);
}

export function mapWikipediaSearch(data: unknown): ResearchResult[] {
  const search = isRecord(data) && isRecord(data.query) && Array.isArray(data.query.search) ? data.query.search : [];
  const results: ResearchResult[] = [];
  for (const item of search) {
    if (!isRecord(item) || !Number.isInteger(item.pageid) || typeof item.title !== "string") continue;
    results.push({
      title: item.title.slice(0, 300),
      url: `https://en.wikipedia.org/?curid=${item.pageid as number}`,
      type: "Background · Wikipedia",
    });
  }
  return results.slice(0, WIKIPEDIA_ROWS);
}

export function mapOnThisDay(data: unknown): AnniversaryEvent[] {
  const events = isRecord(data) && Array.isArray(data.events) ? data.events : [];
  const mapped: AnniversaryEvent[] = [];
  for (const event of events) {
    if (!isRecord(event) || !Number.isInteger(event.year) || typeof event.text !== "string") continue;
    if (!isTransportEvent(event.text)) continue;
    const pages = Array.isArray(event.pages) ? event.pages : [];
    const first = isRecord(pages[0]) ? pages[0] : undefined;
    const urls = first && isRecord(first.content_urls) && isRecord(first.content_urls.desktop) ? first.content_urls.desktop : undefined;
    const page = urls && typeof urls.page === "string" && urls.page.startsWith("https://en.wikipedia.org/") ? urls.page : undefined;
    mapped.push({ year: event.year as number, text: event.text.slice(0, 600), url: page ?? "https://en.wikipedia.org/wiki/Main_Page" });
    if (mapped.length >= MAX_EVENTS) break;
  }
  return mapped;
}

/** The human-readable Wikipedia page for a MM-DD date, e.g. October_3. */
export function onThisDayPageUrl(day: string): string {
  const [month, date] = day.split("-").map(Number);
  const name = new Date(Date.UTC(2000, month - 1, date)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `https://en.wikipedia.org/wiki/${name}_${date}`;
}
