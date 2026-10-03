import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAnniversaryResponse, isDiscoverResponse, readApiError } from "../lib/detour/api";
import { mapArchiveDocs, mapOnThisDay, mapWikipediaSearch, onThisDayPageUrl, sanitizeQuery } from "../lib/detour/server/research";
import { ARCHIVE_SEARCH, json, mockFetch, ON_THIS_DAY, WIKIPEDIA_SEARCH, readBody } from "./helpers";

type Route = typeof import("../app/api/discover/route");
let route: Route;

beforeEach(async () => {
  // Fresh module state, so each test starts with empty caches.
  vi.resetModules();
  route = await import("../app/api/discover/route");
});

const call = (query: string) => route.GET(new Request(`https://detour.test/api/discover${query}`));

describe("GET /api/discover validation", () => {
  it.each([
    ["?day=13-40", "invalid_date"],
    ["?day=02-30", "invalid_date"],
    ["?day=2026-10-03", "invalid_date"],
    ["", "missing_query"],
    ["?q=%20%20", "missing_query"],
    ["?q=%22%7B%7D%3A", "invalid_query"],
  ])("%s -> 400 %s", async (query, code) => {
    const fetchMock = mockFetch({});
    const response = await call(query);
    expect(response.status).toBe(400);
    expect(readApiError(await readBody(response))?.code).toBe(code);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/discover research", () => {
  it("combines archive and background results and caches complete answers", async () => {
    const fetchMock = mockFetch({
      "archive.org": () => json(ARCHIVE_SEARCH),
      "en.wikipedia.org": () => json(WIKIPEDIA_SEARCH),
    });
    const response = await call("?q=Avro%20Lancaster");
    expect(response.status).toBe(200);
    const body = await readBody(response);
    expect(isDiscoverResponse(body)).toBe(true);
    expect(body.results).toEqual([
      { title: "6 1/2 Magic Hours", url: "https://archive.org/details/612Magic1958", type: "Internet Archive", year: 1958 },
      { title: "Lancaster newsreel", url: "https://archive.org/details/lancaster-newsreel", type: "Internet Archive", year: 1944 },
      { title: "Avro Lancaster", url: "https://en.wikipedia.org/?curid=1234", type: "Background · Wikipedia" },
    ]);
    expect(body.partial).toBe(false);
    expect(body.cached).toBe(false);

    const archiveUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(archiveUrl.searchParams.get("q")).toBe("(Avro Lancaster) AND mediatype:(movies OR texts)");

    const again = await readBody(await call("?q=avro%20lancaster"));
    expect(again.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns partial results when one source fails, without caching them", async () => {
    const fetchMock = mockFetch({ "en.wikipedia.org": () => json(WIKIPEDIA_SEARCH) });
    const response = await call("?q=hornet");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await readBody(response);
    expect(body.partial).toBe(true);
    expect(body.sources).toEqual([
      { name: "Internet Archive", status: "unavailable", count: 0 },
      { name: "Wikipedia", status: "ok", count: 1 },
    ]);
    await call("?q=hornet");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("returns 502 with a structured error when every source fails", async () => {
    mockFetch({});
    const response = await call("?q=hornet");
    expect(response.status).toBe(502);
    const body = await readBody(response);
    expect(readApiError(body)?.code).toBe("upstream_unavailable");
    expect(body.results).toEqual([]);
  });

  it("treats malformed upstream data as an empty source rather than crashing", async () => {
    mockFetch({ "archive.org": () => json({ response: "nope" }), "en.wikipedia.org": () => json([1, 2, 3]) });
    const body = await readBody(await call("?q=jet%20age"));
    expect(body.results).toEqual([]);
    expect(body.partial).toBe(false);
  });
});

describe("GET /api/discover anniversaries", () => {
  it("filters, validates and caches the date feed", async () => {
    const fetchMock = mockFetch({ "en.wikipedia.org": () => json(ON_THIS_DAY) });
    const response = await call("?day=10-03");
    expect(response.status).toBe(200);
    const body = await readBody(response);
    expect(isAnniversaryResponse(body)).toBe(true);
    expect(body.events).toEqual([
      {
        year: 1976,
        text: "Test pilots complete the first flight of an experimental jet aircraft.",
        url: "https://en.wikipedia.org/wiki/Experimental_aircraft",
      },
      { year: 2016, text: "A new railway line opens between two coastal towns.", url: "https://en.wikipedia.org/wiki/Rail_transport" },
      { year: 1958, text: "The airline begins scheduled transatlantic service.", url: "https://en.wikipedia.org/wiki/Main_Page" },
    ]);
    expect(body.sourceUrl).toBe("https://en.wikipedia.org/wiki/October_3");
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/10/03");
    expect((await readBody(await call("?day=10-03"))).cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when the feed is unavailable", async () => {
    mockFetch({ "en.wikipedia.org": () => json({}, { status: 503 }) });
    const response = await call("?day=02-29");
    expect(response.status).toBe(502);
    const body = await readBody(response);
    expect(readApiError(body)?.code).toBe("upstream_unavailable");
    expect(body.events).toEqual([]);
  });
});

describe("research helpers", () => {
  it("reduces queries to plain search terms", () => {
    expect(sanitizeQuery('  "CF-18" AND {Hornet}: (Canada) ')).toBe("CF-18 and Hornet Canada");
    expect(sanitizeQuery("-excluded words")).toBe("excluded words");
    expect(sanitizeQuery("a\u0000b")).toBe("a b");
    expect(sanitizeQuery("x".repeat(150))).toHaveLength(100);
  });

  it("maps only well-formed upstream records", () => {
    expect(mapArchiveDocs(ARCHIVE_SEARCH)).toHaveLength(2);
    expect(mapArchiveDocs(null)).toEqual([]);
    expect(mapWikipediaSearch(WIKIPEDIA_SEARCH)).toHaveLength(1);
    expect(mapOnThisDay(ON_THIS_DAY).map((event) => event.year)).toEqual([1976, 2016, 1958]);
  });

  it("links to the human-readable date page", () => {
    expect(onThisDayPageUrl("02-29")).toBe("https://en.wikipedia.org/wiki/February_29");
  });
});
