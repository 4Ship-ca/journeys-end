import { describe, expect, it } from "vitest";
import { isKnownId } from "../app/data";
import { cleanResearch, extendTrail, HOME, MAX_TRAIL, navHref, parseNav } from "../lib/detour/navigation";

describe("parseNav", () => {
  it("treats an empty search as home", () => {
    expect(parseNav("", isKnownId)).toEqual(HOME);
  });

  it("keeps the first release's single-record trail links working", () => {
    expect(parseNav("?trail=lancaster", isKnownId)).toEqual({ ...HOME, trail: ["lancaster"] });
  });

  it("reads multi-step trails, dropping unknown IDs and immediate repeats", () => {
    expect(parseNav("?trail=lancaster,nope,warplane,warplane,memorials", isKnownId).trail).toEqual([
      "lancaster",
      "warplane",
      "memorials",
    ]);
    expect(parseNav("?trail=lancaster%2Cwarplane", isKnownId).trail).toEqual(["lancaster", "warplane"]);
  });

  it("caps long trails to the most recent steps", () => {
    const ids = Array.from({ length: MAX_TRAIL + 5 }, (_, index) => (index % 2 ? "lancaster" : "warplane"));
    expect(parseNav(`?trail=${ids.join(",")}`, isKnownId).trail).toHaveLength(MAX_TRAIL);
  });

  it("reads views and ignores unknown ones", () => {
    expect(parseNav("?view=day", isKnownId).view).toBe("day");
    expect(parseNav("?view=places", isKnownId).view).toBe("places");
    expect(parseNav("?view=admin", isKnownId).view).toBe("explore");
  });

  it("only accepts a real date for the on-this-day view", () => {
    expect(parseNav("?view=day&on=2026-10-03", isKnownId).on).toBe("2026-10-03");
    expect(parseNav("?view=day&on=2026-02-30", isKnownId).on).toBe("");
    expect(parseNav("?on=2026-10-03", isKnownId).on).toBe("");
  });

  it("reads a cleaned research subject only on the explore home", () => {
    expect(parseNav("?research=%20Avro%0ALancaster%20", isKnownId).research).toBe("Avro Lancaster");
    expect(parseNav("?trail=lancaster&research=x", isKnownId).research).toBe("");
    expect(parseNav("?view=about&research=x", isKnownId).research).toBe("");
  });
});

describe("navHref", () => {
  it("builds readable, round-trippable links", () => {
    expect(navHref({})).toBe("/");
    expect(navHref({ trail: ["lancaster", "warplane"] })).toBe("/?trail=lancaster,warplane");
    expect(navHref({ view: "day", on: "2026-10-03" })).toBe("/?view=day&on=2026-10-03");
    expect(navHref({ view: "about" })).toBe("/?view=about");
    expect(navHref({ research: "CF-18 Hornet" })).toBe("/?research=CF-18+Hornet");
    for (const state of [
      { ...HOME, trail: ["lancaster", "jetage", "hornet"] },
      { ...HOME, view: "day" as const, on: "2026-02-28" },
      { ...HOME, research: "jet age" },
    ]) {
      expect(parseNav(navHref(state).slice(1), isKnownId)).toEqual(state);
    }
  });
});

describe("extendTrail", () => {
  it("appends new steps and returns to an earlier step instead of looping", () => {
    expect(extendTrail(["lancaster"], "warplane")).toEqual(["lancaster", "warplane"]);
    expect(extendTrail(["lancaster", "warplane", "spotting"], "warplane")).toEqual(["lancaster", "warplane"]);
  });

  it("keeps the trail within the cap", () => {
    const trail = Array.from({ length: MAX_TRAIL }, (_, index) => `id-${index}`);
    expect(extendTrail(trail, "next")).toHaveLength(MAX_TRAIL);
    expect(extendTrail(trail, "next").at(-1)).toBe("next");
  });
});

describe("cleanResearch", () => {
  it("removes control characters and bounds length", () => {
    expect(cleanResearch("a\u0000b\tc")).toBe("a b c");
    expect(cleanResearch("x".repeat(150))).toHaveLength(100);
  });
});
