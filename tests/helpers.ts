import { vi } from "vitest";

export type FetchHandler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/**
 * Replaces global fetch with per-host handlers. Unknown hosts fail the way a
 * blocked network does. Returns the mock so tests can inspect calls.
 */
export function mockFetch(handlers: Record<string, FetchHandler>) {
  const mock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const handler = handlers[url.hostname];
    if (!handler) throw new TypeError("fetch failed");
    return handler(url, init);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

/** Any JSON value, loosely typed so assertions can reach into nested fields. */
export type JsonBody = { [key: string]: JsonBody };

/** Reads a route response body; tests check its shape with the client guards separately. */
export async function readBody(response: Response): Promise<JsonBody> {
  return (await response.json()) as JsonBody;
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

export function html(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    ...init,
    headers: { "content-type": "text/html; charset=utf-8", ...(init.headers ?? {}) },
  });
}

export function hangUntilAborted(_url: URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
  });
}

/** A MET Norway compact document with hourly steps starting at `start`. */
export function metForecast(start: string, hours: number, updatedAt = "2026-10-03T12:00:00Z") {
  const base = Date.parse(start);
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [-79.9246, 43.1603, 200] },
    properties: {
      meta: { updated_at: updatedAt, units: { air_temperature: "celsius", wind_speed: "m/s" } },
      timeseries: Array.from({ length: hours }, (_, index) => ({
        time: new Date(base + index * 3_600_000).toISOString().replace(".000Z", "Z"),
        data: {
          instant: { details: { air_temperature: 10 + (index % 12), wind_speed: 5 } },
          next_1_hours: { summary: { symbol_code: index % 2 ? "partlycloudy_day" : "lightrainshowers_day" } },
        },
      })),
    },
  };
}

/** A trimmed Wikipedia on-this-day events document with fictional event text. */
export const ON_THIS_DAY = {
  events: [
    {
      text: "Test pilots complete the first flight of an experimental jet aircraft.",
      year: 1976,
      pages: [{ content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Experimental_aircraft" } } }],
    },
    { text: "A treaty is signed between two neighbouring kingdoms.", year: 1801, pages: [] },
    {
      text: "A new railway line opens between two coastal towns.",
      year: 2016,
      pages: [{ content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Rail_transport" } } }],
    },
    {
      text: "The airline begins scheduled transatlantic service.",
      year: 1958,
      pages: [{ content_urls: { desktop: { page: "https://evil.example/phish" } } }],
    },
    { text: "An aircraft lands with no year recorded.", year: "unknown", pages: [] },
  ],
};

export const ARCHIVE_SEARCH = {
  responseHeader: { status: 0 },
  response: {
    numFound: 3,
    docs: [
      { identifier: "612Magic1958", title: "6 1/2 Magic Hours", year: "1958" },
      { identifier: "bad identifier/../x", title: "Unsafe identifier" },
      { identifier: "lancaster-newsreel", title: ["Lancaster newsreel"], year: ["1944"] },
    ],
  },
};

export const WIKIPEDIA_SEARCH = {
  query: {
    search: [
      { ns: 0, title: "Avro Lancaster", pageid: 1234 },
      { ns: 0, title: "No page id" },
    ],
  },
};
