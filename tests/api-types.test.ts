import { describe, expect, it } from "vitest";
import { isAnniversaryResponse, isConditionsResponse, isDiscoverResponse, readApiError } from "../lib/detour/api";

describe("client response guards", () => {
  it("reads structured API errors only", () => {
    expect(readApiError({ error: { code: "x", message: "y" } })).toEqual({ code: "x", message: "y" });
    expect(readApiError({ error: "Source unavailable" })).toBeNull();
    expect(readApiError(null)).toBeNull();
  });

  it("rejects research results with unsafe links", () => {
    const body = {
      query: "q",
      results: [{ title: "t", url: "javascript:alert(1)", type: "Internet Archive" }],
      sources: [],
      partial: false,
      cached: false,
      checkedAt: "2026-10-03T00:00:00Z",
    };
    expect(isDiscoverResponse(body)).toBe(false);
    expect(isDiscoverResponse({ ...body, results: [{ ...body.results[0], url: "https://archive.org/details/x" }] })).toBe(true);
  });

  it("requires integer event years", () => {
    const body = { day: "10-03", events: [{ year: 1958.5, text: "t", url: "https://en.wikipedia.org/" }], checkedAt: "x" };
    expect(isAnniversaryResponse(body)).toBe(false);
  });

  it("accepts only an unconfirmed access state", () => {
    const body = {
      id: "warplane",
      checkedAt: "2026-10-03T00:00:00Z",
      source: "https://www.warplane.com/",
      sourceFetched: true,
      access: "unconfirmed",
      notices: [],
      timeZone: "America/Toronto",
      weather: null,
      weatherError: "Weather is unavailable.",
    };
    expect(isConditionsResponse(body)).toBe(true);
    expect(isConditionsResponse({ ...body, access: "open" })).toBe(false);
  });
});
