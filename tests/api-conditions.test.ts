import { beforeEach, describe, expect, it, vi } from "vitest";
import { isConditionsResponse, readApiError } from "../lib/detour/api";
import { parseForecast } from "../lib/detour/server/forecast";
import { html, json, metForecast, mockFetch, readBody } from "./helpers";

type Route = typeof import("../app/api/conditions/route");
let route: Route;

beforeEach(async () => {
  vi.resetModules();
  route = await import("../app/api/conditions/route");
});

const call = (query: string) => route.GET(new Request(`https://detour.test/api/conditions${query}`));
const FORECAST = metForecast("2026-10-03T16:00:00Z", 90);
const MUSEUM_PAGE =
  "<html><body><h1>Hours</h1><p>Open daily.</p><p>The east gallery is temporarily closed while an exhibit is installed.</p></body></html>";

describe("GET /api/conditions validation", () => {
  it.each([
    ["", 400, "missing_id"],
    ["?id=nope", 400, "unknown_place"],
    ["?id=..%2F..%2Fetc", 400, "unknown_place"],
    ["?id=lancaster", 400, "not_a_place"],
    ["?id=cars", 400, "not_a_place"],
  ])("%s -> %i %s", async (query, status, code) => {
    const fetchMock = mockFetch({});
    const response = await call(query);
    expect(response.status).toBe(status);
    expect(readApiError(await readBody(response))?.code).toBe(code);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/conditions", () => {
  it("returns forecast points, notice wording and an unconfirmed access state", async () => {
    const fetchMock = mockFetch({
      "api.met.no": () => json(FORECAST),
      "www.warplane.com": () => html(MUSEUM_PAGE),
    });
    const response = await call("?id=warplane");
    expect(response.status).toBe(200);
    const body = await readBody(response);
    expect(isConditionsResponse(body)).toBe(true);
    expect(body.access).toBe("unconfirmed");
    expect(body.sourceFetched).toBe(true);
    expect(body.timeZone).toBe("America/Toronto");
    expect(body.notices).toHaveLength(1);
    expect(body.notices[0]).toMatch(/temporarily closed/);
    expect(body.weather.state).toBe("current");
    expect(body.weather.points).toHaveLength(90);
    expect(body.weather.points[0]).toEqual({ time: "2026-10-03T16:00:00.000Z", temp: 10, wind: 18, symbol: "lightrainshowers_day" });
    expect(body.weatherError).toBeNull();

    const metUrl = new URL(String(fetchMock.mock.calls.find(([url]) => String(url).includes("api.met.no"))?.[0]));
    expect(metUrl.searchParams.get("lat")).toBe("43.1603");
    expect(metUrl.searchParams.get("lon")).toBe("-79.9246");
  });

  it("never reports a place as open, even when the official page cannot be read", async () => {
    mockFetch({ "api.met.no": () => json(FORECAST), "www.warplane.com": () => html("down", { status: 500 }) });
    const body = await readBody(await call("?id=warplane"));
    expect(body.access).toBe("unconfirmed");
    expect(body.sourceFetched).toBe(false);
    expect(body.notices).toEqual([]);
  });

  it("does not follow an official page that redirects off its own site", async () => {
    const fetchMock = mockFetch({
      "api.met.no": () => json(FORECAST),
      "www.warplane.com": () => new Response(null, { status: 302, headers: { location: "https://tracker.example/" } }),
      "tracker.example": () => html("<p>temporarily closed</p>"),
    });
    const body = await readBody(await call("?id=warplane"));
    expect(body.sourceFetched).toBe(false);
    expect(body.notices).toEqual([]);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("tracker.example"))).toBe(false);
  });

  it("reports missing weather instead of inventing it", async () => {
    mockFetch({ "www.warplane.com": () => html(MUSEUM_PAGE) });
    const response = await call("?id=warplane");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await readBody(response);
    expect(body.weather).toBeNull();
    expect(body.weatherError).toMatch(/unavailable/);
  });

  it("serves a cached answer for 15 minutes, then labels an older forecast stale if a refresh fails", async () => {
    const start = Date.parse("2026-10-03T16:05:00Z");
    const clock = vi.spyOn(Date, "now").mockReturnValue(start);
    const fetchMock = mockFetch({ "api.met.no": () => json(FORECAST), "www.warplane.com": () => html(MUSEUM_PAGE) });
    const first = await readBody(await call("?id=warplane"));
    expect(first.cached).toBe(false);

    clock.mockReturnValue(start + 10 * 60 * 1000);
    expect((await readBody(await call("?id=warplane"))).cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    clock.mockReturnValue(start + 20 * 60 * 1000);
    mockFetch({ "www.warplane.com": () => html(MUSEUM_PAGE) });
    const stale = await readBody(await call("?id=warplane"));
    expect(stale.cached).toBe(false);
    expect(stale.weather.state).toBe("stale");
    expect(stale.weather.fetchedAt).toBe(first.weather.fetchedAt);
    expect(stale.weatherError).toBeNull();

    clock.mockReturnValue(start + 7 * 60 * 60 * 1000);
    const expired = await readBody(await call("?id=warplane"));
    expect(expired.weather).toBeNull();
  });
});

describe("parseForecast", () => {
  it("skips malformed steps and converts wind to km/h", () => {
    const parsed = parseForecast({
      properties: {
        meta: { updated_at: "2026-10-03T12:00:00Z" },
        timeseries: [
          { time: "2026-10-03T16:00:00Z", data: { instant: { details: { air_temperature: 12.4, wind_speed: 2.5 } } } },
          { time: "not a time", data: { instant: { details: { air_temperature: 1, wind_speed: 1 } } } },
          { time: "2026-10-03T17:00:00Z", data: { instant: { details: { air_temperature: "warm", wind_speed: 1 } } } },
          {
            time: "2026-10-03T18:00:00Z",
            data: {
              instant: { details: { air_temperature: 11, wind_speed: 0 } },
              next_6_hours: { summary: { symbol_code: "<script>" } },
            },
          },
        ],
      },
    });
    expect(parsed.updatedAt).toBe("2026-10-03T12:00:00Z");
    expect(parsed.points).toEqual([
      { time: "2026-10-03T16:00:00.000Z", temp: 12.4, wind: 9, symbol: "" },
      { time: "2026-10-03T18:00:00.000Z", temp: 11, wind: 0, symbol: "" },
    ]);
    expect(parseForecast("garbage")).toEqual({ updatedAt: null, points: [] });
  });
});
