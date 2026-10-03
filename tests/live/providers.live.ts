import { describe, expect, it } from "vitest";
import { GET as conditions } from "../../app/api/conditions/route";
import { GET as discover } from "../../app/api/discover/route";
import { places } from "../../app/data";
import { isAnniversaryResponse, isConditionsResponse, isDiscoverResponse, readApiError } from "../../lib/detour/api";

// Calls the real route handlers with no mocks. Each failure message names the provider involved.

async function get(handler: (request: Request) => Promise<Response>, path: string) {
  const response = await handler(new Request(`https://detour.test${path}`));
  const body: unknown = await response.json();
  return { status: response.status, body, error: readApiError(body)?.message ?? "" };
}

describe("MET Norway and official visitor pages", () => {
  for (const place of places) {
    it(`returns a current forecast for ${place.id} (api.met.no)`, async () => {
      const { status, body } = await get(conditions, `/api/conditions?id=${place.id}`);
      expect(status).toBe(200);
      expect(isConditionsResponse(body)).toBe(true);
      if (!isConditionsResponse(body)) return;
      expect(body.access).toBe("unconfirmed");
      expect(body.weather?.state, body.weatherError ?? "").toBe("current");
      expect(body.weather?.points.length).toBeGreaterThan(24);
      console.info(
        `${place.id}: ${body.weather?.points.length} forecast points, model updated ${body.weather?.updatedAt}; notices ${JSON.stringify(body.notices)}`,
      );
    });

    it(`reads the official page for ${place.id} (${new URL(place.source).hostname})`, async () => {
      // Served from the route's cache after the forecast test, so the page is not fetched twice.
      const { body } = await get(conditions, `/api/conditions?id=${place.id}`);
      expect(isConditionsResponse(body) && body.sourceFetched, `${place.source} could not be retrieved`).toBe(true);
    });
  }
});

describe("Internet Archive and Wikipedia research", () => {
  it("returns results from both sources for a known subject (archive.org, en.wikipedia.org)", async () => {
    const { status, body, error } = await get(discover, "/api/discover?q=Avro%20Lancaster");
    expect(status, error).toBe(200);
    expect(isDiscoverResponse(body)).toBe(true);
    if (!isDiscoverResponse(body)) return;
    expect(body.sources).toEqual([
      { name: "Internet Archive", status: "ok", count: expect.any(Number) },
      { name: "Wikipedia", status: "ok", count: expect.any(Number) },
    ]);
    expect(body.results.some((result) => result.type === "Internet Archive")).toBe(true);
    expect(body.results.some((result) => result.type === "Background · Wikipedia")).toBe(true);
    console.info(`research: ${body.results.map((result) => `${result.type}: ${result.title}`).join(" | ")}`);
  });
});

describe("Wikipedia on-this-day feed", () => {
  it("returns the filtered events feed for 3 October (en.wikipedia.org)", async () => {
    const { status, body, error } = await get(discover, "/api/discover?day=10-03");
    expect(status, error).toBe(200);
    expect(isAnniversaryResponse(body)).toBe(true);
    if (!isAnniversaryResponse(body)) return;
    console.info(`on this day: ${body.events.length} transport events — ${body.events.map((event) => event.year).join(", ")}`);
  });
});
