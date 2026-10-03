import type { AnniversaryResponse, DiscoverResponse, SourceStatus } from "../../../lib/detour/api";
import { isValidMonthDay } from "../../../lib/detour/dates";
import { TtlCache } from "../../../lib/detour/server/cache";
import {
  ARCHIVE_ROWS,
  WIKIPEDIA_ROWS,
  mapArchiveDocs,
  mapOnThisDay,
  mapWikipediaSearch,
  onThisDayPageUrl,
  sanitizeQuery,
} from "../../../lib/detour/server/research";
import { jsonError, jsonOk } from "../../../lib/detour/server/responses";
import { fetchJson } from "../../../lib/detour/server/upstream";

const ARCHIVE_HOSTS = ["archive.org"];
const WIKIPEDIA_HOSTS = ["en.wikipedia.org"];

const researchCache = new TtlCache<Omit<DiscoverResponse, "cached">>(10 * 60 * 1000, 10 * 60 * 1000, 200);
const dayCache = new TtlCache<Omit<AnniversaryResponse, "cached">>(6 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 400);

async function anniversaries(day: string): Promise<Response> {
  const now = Date.now();
  const hit = dayCache.get(day, now);
  if (hit?.fresh) return jsonOk({ ...hit.value, cached: true }, "public, max-age=3600");
  const [month, date] = day.split("-");
  try {
    const { data } = await fetchJson(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${date}`, {
      timeoutMs: 10_000,
      maxBytes: 4_000_000,
      allowedHosts: WIKIPEDIA_HOSTS,
    });
    const body: Omit<AnniversaryResponse, "cached"> = {
      day,
      events: mapOnThisDay(data),
      source: "Wikipedia · On this day",
      sourceUrl: onThisDayPageUrl(day),
      checkedAt: new Date(now).toISOString(),
    };
    dayCache.set(day, body, now);
    return jsonOk({ ...body, cached: false }, "public, max-age=3600");
  } catch {
    return jsonError(
      502,
      { code: "upstream_unavailable", message: "The anniversary source could not be reached. Try a subject instead." },
      { day, events: [] },
    );
  }
}

async function research(query: string): Promise<Response> {
  const now = Date.now();
  const key = query.toLowerCase();
  const hit = researchCache.get(key, now);
  if (hit?.fresh) return jsonOk({ ...hit.value, cached: true }, "public, max-age=300");
  const archiveQuery = encodeURIComponent(`(${query}) AND mediatype:(movies OR texts)`);
  const [archive, wikipedia] = await Promise.allSettled([
    fetchJson(
      `https://archive.org/advancedsearch.php?q=${archiveQuery}&fl[]=identifier&fl[]=title&fl[]=year&rows=${ARCHIVE_ROWS}&output=json`,
      { timeoutMs: 10_000, maxBytes: 1_000_000, allowedHosts: ARCHIVE_HOSTS },
    ),
    fetchJson(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${WIKIPEDIA_ROWS}&format=json`,
      { timeoutMs: 10_000, maxBytes: 1_000_000, allowedHosts: WIKIPEDIA_HOSTS },
    ),
  ]);
  const archiveResults = archive.status === "fulfilled" ? mapArchiveDocs(archive.value.data) : [];
  const wikipediaResults = wikipedia.status === "fulfilled" ? mapWikipediaSearch(wikipedia.value.data) : [];
  const sources: SourceStatus[] = [
    { name: "Internet Archive", status: archive.status === "fulfilled" ? "ok" : "unavailable", count: archiveResults.length },
    { name: "Wikipedia", status: wikipedia.status === "fulfilled" ? "ok" : "unavailable", count: wikipediaResults.length },
  ];
  const checkedAt = new Date(now).toISOString();
  if (archive.status === "rejected" && wikipedia.status === "rejected") {
    return jsonError(
      502,
      { code: "upstream_unavailable", message: "Live research is unavailable. You can still open the source searches." },
      { query, results: [], sources, partial: true },
    );
  }
  const body: Omit<DiscoverResponse, "cached"> = {
    query,
    results: [...archiveResults, ...wikipediaResults],
    sources,
    partial: archive.status === "rejected" || wikipedia.status === "rejected",
    checkedAt,
  };
  if (!body.partial) researchCache.set(key, body, now);
  return jsonOk({ ...body, cached: false }, body.partial ? "no-store" : "public, max-age=300");
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const day = params.get("day");
  if (day !== null) {
    if (!isValidMonthDay(day)) {
      return jsonError(400, { code: "invalid_date", message: "Use a real calendar date in MM-DD form." }, { events: [] });
    }
    return anniversaries(day);
  }
  const raw = params.get("q");
  if (raw === null || !raw.trim()) {
    return jsonError(400, { code: "missing_query", message: "Enter a subject to research." }, { results: [] });
  }
  const query = sanitizeQuery(raw);
  if (!query) {
    return jsonError(400, { code: "invalid_query", message: "Use plain words to describe the subject." }, { results: [] });
  }
  return research(query);
}
