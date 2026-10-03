import { describe, expect, it } from "vitest";
import { describeSymbol, pickForecastPoint, type ForecastPoint } from "../lib/detour/weather";

function hourly(startIso: string, hours: number): ForecastPoint[] {
  const start = Date.parse(startIso);
  return Array.from({ length: hours }, (_, index) => ({
    time: new Date(start + index * 3_600_000).toISOString(),
    temp: index,
    wind: 10,
    symbol: "cloudy",
  }));
}

describe("pickForecastPoint", () => {
  // 48 hourly points from 2026-10-03 16:00 UTC (12:00 in Toronto).
  const points = hourly("2026-10-03T16:00:00Z", 48);
  const now = new Date("2026-10-03T16:10:00Z");

  it("uses the next available point when no date is chosen", () => {
    const pick = pickForecastPoint(points, "America/Toronto", "", 12, now);
    expect(pick).toMatchObject({ status: "found", localDate: "2026-10-03", localHour: 12 });
  });

  it("chooses the point nearest the visit hour on the chosen local date", () => {
    const pick = pickForecastPoint(points, "America/Toronto", "2026-10-04", 9, now);
    expect(pick.status).toBe("found");
    if (pick.status === "found") {
      expect(pick.localDate).toBe("2026-10-04");
      expect(pick.localHour).toBe(9);
      expect(pick.point.time).toBe("2026-10-04T13:00:00.000Z");
    }
  });

  it("uses the place's time zone, not UTC, to decide the date", () => {
    const pick = pickForecastPoint(points, "Asia/Tokyo", "2026-10-04", 12, now);
    expect(pick).toMatchObject({ status: "found", localDate: "2026-10-04", localHour: 12 });
    if (pick.status === "found") expect(pick.point.time).toBe("2026-10-04T03:00:00.000Z");
  });

  it("picks the closest available hour when the exact hour is missing", () => {
    const sparse = [
      { time: "2026-10-10T10:00:00Z", temp: 1, wind: 1, symbol: "" },
      { time: "2026-10-10T16:00:00Z", temp: 2, wind: 1, symbol: "" },
      { time: "2026-10-10T22:00:00Z", temp: 3, wind: 1, symbol: "" },
    ];
    const pick = pickForecastPoint(sparse, "America/Toronto", "2026-10-10", 18, now);
    expect(pick).toMatchObject({ status: "found", localHour: 18 });
    const morning = pickForecastPoint(sparse, "America/Toronto", "2026-10-10", 9, now);
    expect(morning).toMatchObject({ status: "found", localHour: 12 });
  });

  it("does not substitute another day for a date outside the forecast", () => {
    expect(pickForecastPoint(points, "America/Toronto", "2026-10-20", 12, now)).toEqual({
      status: "beyond-range",
      lastDate: "2026-10-05",
    });
  });

  it("reports a chosen date that has already passed", () => {
    expect(pickForecastPoint(points, "America/Toronto", "2026-10-01", 12, now)).toEqual({ status: "date-passed" });
  });

  it("reports an empty forecast", () => {
    expect(pickForecastPoint([], "America/Toronto", "", 12, now)).toEqual({ status: "no-forecast" });
  });
});

describe("describeSymbol", () => {
  it("turns MET Norway symbol codes into words", () => {
    expect(describeSymbol("partlycloudy_day")).toBe("Partly cloudy");
    expect(describeSymbol("clearsky_night")).toBe("Clear sky");
    expect(describeSymbol("lightrainshowersandthunder_day")).toBe("Light rain showers and thunder");
    expect(describeSymbol("heavysnow")).toBe("Heavy snow");
    expect(describeSymbol("lightssleetshowersandthunder_polartwilight")).toBe("Light sleet showers and thunder");
    expect(describeSymbol("lightsnowshowers_day")).toBe("Light snow showers");
    expect(describeSymbol("fog")).toBe("Fog");
  });

  it("falls back gracefully for unknown or empty codes", () => {
    expect(describeSymbol("")).toBe("Conditions not described");
    expect(describeSymbol("volcanic_ash")).toBe("volcanic ash");
  });
});
