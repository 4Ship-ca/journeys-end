import { describe, expect, it } from "vitest";
import { getEntry, isKnownId, visitMinutes, type Entry } from "../app/data";
import {
  addToJourney,
  EMPTY_JOURNEY,
  formatHours,
  journeyFileName,
  journeyToText,
  MAX_SAVED,
  moveInJourney,
  parseJourney,
  removeFromJourney,
  serializeJourney,
  summariseJourney,
  unresolvedChecks,
  visitHour,
} from "../lib/detour/journey";

const entriesFor = (ids: string[]) => ids.map((id) => getEntry(id) as Entry);

describe("parseJourney", () => {
  it("returns an empty journey for missing or corrupt storage", () => {
    expect(parseJourney(null, isKnownId)).toEqual(EMPTY_JOURNEY);
    expect(parseJourney("{not json", isKnownId)).toEqual(EMPTY_JOURNEY);
    expect(parseJourney("[1,2]", isKnownId)).toEqual(EMPTY_JOURNEY);
    expect(parseJourney("null", isKnownId)).toEqual(EMPTY_JOURNEY);
  });

  it("loads the first release's stored shape", () => {
    expect(parseJourney('{"saved":["lancaster","warplane"],"date":"2026-10-10","pace":"Unhurried"}', isKnownId)).toEqual({
      saved: ["lancaster", "warplane"],
      date: "2026-10-10",
      pace: "Unhurried",
      visitTime: "midday",
    });
  });

  it("drops unknown IDs, duplicates, non-strings, invalid dates and unknown options", () => {
    const raw = JSON.stringify({
      saved: ["warplane", "nope", 7, "warplane", "honda"],
      date: "2026-02-30",
      pace: "Sprint",
      visitTime: "midnight",
    });
    expect(parseJourney(raw, isKnownId)).toEqual({ saved: ["warplane", "honda"], date: "", pace: "Unhurried", visitTime: "midday" });
  });

  it("caps the number of saved items", () => {
    const raw = JSON.stringify({ saved: Array.from({ length: MAX_SAVED + 10 }, (_, index) => `id-${index}`) });
    expect(parseJourney(raw, () => true).saved).toHaveLength(MAX_SAVED);
  });

  it("round-trips through serialisation", () => {
    const state = { saved: ["cars", "honda"], date: "2026-11-01", pace: "A full day" as const, visitTime: "morning" as const };
    expect(parseJourney(serializeJourney(state), isKnownId)).toEqual(state);
  });
});

describe("journey edits", () => {
  const base = { ...EMPTY_JOURNEY, saved: ["lancaster", "warplane", "honda"] };

  it("adds once and ignores duplicates", () => {
    const added = addToJourney(base, "cars");
    expect(added.saved).toEqual(["lancaster", "warplane", "honda", "cars"]);
    expect(addToJourney(added, "cars")).toBe(added);
  });

  it("removes and ignores missing items", () => {
    expect(removeFromJourney(base, "warplane").saved).toEqual(["lancaster", "honda"]);
    expect(removeFromJourney(base, "cars")).toBe(base);
  });

  it("moves within bounds only", () => {
    expect(moveInJourney(base, 0, 1).saved).toEqual(["warplane", "lancaster", "honda"]);
    expect(moveInJourney(base, 2, -1).saved).toEqual(["lancaster", "honda", "warplane"]);
    expect(moveInJourney(base, 0, -1)).toBe(base);
    expect(moveInJourney(base, 2, 1)).toBe(base);
    expect(moveInJourney(base, 9, -1)).toBe(base);
  });
});

describe("journey summary and export", () => {
  it("sums suggested minutes only and flags mixed regions and overload", () => {
    const saved = entriesFor(["lancaster", "warplane", "honda", "cars"]);
    const summary = summariseJourney(saved, "Unhurried", visitMinutes);
    expect(summary.minutes).toBe(150 + 120 + 240);
    expect(summary.regions).toEqual(["Ontario", "Japan"]);
    expect(summary.multiRegion).toBe(true);
    expect(summary.overloaded).toBe(true);
    expect(summariseJourney(entriesFor(["warplane"]), "Unhurried", visitMinutes)).toMatchObject({
      multiRegion: false,
      overloaded: false,
    });
    expect(summariseJourney(saved, "A full day", visitMinutes).overloaded).toBe(true);
    expect(summariseJourney(entriesFor(["warplane", "honda"]), "A full day", visitMinutes).overloaded).toBe(false);
  });

  it("formats hours to one decimal place", () => {
    expect(formatHours(150)).toBe("2.5h");
    expect(formatHours(0)).toBe("0h");
  });

  it("maps visit times to hours", () => {
    expect(visitHour("morning")).toBe(9);
    expect(visitHour("evening")).toBe(18);
  });

  it("lists unresolved checks by record kind", () => {
    expect(unresolvedChecks(getEntry("warplane")!).join(" ")).toMatch(/not confirmed/);
    expect(unresolvedChecks(getEntry("cars")!).join(" ")).toMatch(/No booking has been made/);
    expect(unresolvedChecks(getEntry("lancaster")!).join(" ")).toMatch(/not a physical stop/);
  });

  it("exports selections, sources, checks and warnings", () => {
    const state = { ...EMPTY_JOURNEY, saved: ["warplane", "cars"], date: "2026-10-10" };
    const saved = entriesFor(state.saved);
    const summary = summariseJourney(saved, state.pace, visitMinutes);
    const text = journeyToText(state, saved, summary, visitMinutes, new Date("2026-10-03T12:00:00Z"));
    expect(text).toContain("Date: 2026-10-10 · Pace: Unhurried");
    expect(text).toContain("Exported: 2026-10-03T12:00:00.000Z");
    expect(text).toContain("1. Meet the aircraft in Hamilton");
    expect(text).toContain("Source: https://www.warplane.com/visit/museum-hours-and-prices.aspx");
    expect(text).toContain("Suggested time: 150 minutes, excluding travel.");
    expect(text).toContain("Check: No booking has been made.");
    expect(text).toContain("Treat these as separate trips.");
    expect(text).toContain("more than a relaxed day");
  });

  it("names the export after the journey date when set", () => {
    const now = new Date("2026-10-03T12:00:00Z");
    expect(journeyFileName({ ...EMPTY_JOURNEY, date: "2026-12-01" }, now)).toBe("my-detour-2026-12-01.txt");
    expect(journeyFileName(EMPTY_JOURNEY, now)).toBe("my-detour-2026-10-03.txt");
  });
});
