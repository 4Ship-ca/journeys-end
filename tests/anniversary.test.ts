import { describe, expect, it } from "vitest";
import {
  anniversaryLabel,
  anniversaryOf,
  formatEventYear,
  isTransportEvent,
  MILESTONE_YEARS,
  rankByAnniversary,
} from "../lib/detour/anniversary";

describe("anniversary arithmetic", () => {
  it("counts years back from the selected year and flags milestones", () => {
    expect(anniversaryOf(1976, 2026)).toEqual({ status: "past", years: 50, milestone: true });
    expect(anniversaryOf(1977, 2026)).toEqual({ status: "past", years: 49, milestone: false });
    for (const years of MILESTONE_YEARS) {
      expect(anniversaryOf(2026 - years, 2026)).toMatchObject({ milestone: true });
    }
  });

  it("handles the same year and events after the selected year without negative counts", () => {
    expect(anniversaryOf(2026, 2026)).toEqual({ status: "same-year" });
    expect(anniversaryOf(2030, 2026)).toEqual({ status: "after-selected-year", yearsAfter: 4 });
  });

  it("skips the missing year zero for BCE events", () => {
    expect(anniversaryOf(-1, 1)).toEqual({ status: "past", years: 1, milestone: false });
    expect(anniversaryOf(-44, 2026)).toEqual({ status: "past", years: 2069, milestone: false });
  });

  it("labels each case plainly", () => {
    expect(anniversaryLabel(anniversaryOf(1976, 2026), 2026)).toBe("50 years ago · Milestone");
    expect(anniversaryLabel(anniversaryOf(2025, 2026), 2026)).toBe("1 year ago");
    expect(anniversaryLabel(anniversaryOf(2026, 2026), 2026)).toBe("In 2026");
    expect(anniversaryLabel(anniversaryOf(2027, 2026), 2026)).toBe("1 year after 2026");
    expect(formatEventYear(-44)).toBe("44 BCE");
    expect(formatEventYear(1958)).toBe("1958");
  });

  it("ranks milestones first, then the most recent events, keeping ties stable", () => {
    const ranked = rankByAnniversary(
      [
        { year: 1990, id: "a" },
        { year: 1976, id: "b" },
        { year: 2001, id: "c" },
        { year: 2016, id: "d" },
        { year: 1990, id: "e" },
      ],
      2026,
    );
    // 2016 (10), 2001 (25) and 1976 (50) are milestones; 1990 (36) is not.
    expect(ranked.map((event) => event.id)).toEqual(["d", "c", "b", "a", "e"]);
    expect(ranked[2].anniversary).toEqual({ status: "past", years: 50, milestone: true });
  });
});

describe("transport keyword filter", () => {
  it("matches transport events", () => {
    for (const text of [
      "The first flight of a prototype aircraft",
      "An airline begins service",
      "The railway opens",
      "Motorcycle racing begins on the island",
      "Two cars collide at the circuit",
      "An aircraft carrier is commissioned",
      "NASA launches a satellite",
      "The Royal Canadian Air Force is formed",
    ]) {
      expect(isTransportEvent(text), text).toBe(true);
    }
  });

  it("does not match words that merely start with a keyword", () => {
    for (const text of ["Jimmy Carter is inaugurated", "A cardinal is elected", "Carthage is founded", "A treaty is signed"]) {
      expect(isTransportEvent(text), text).toBe(false);
    }
  });
});
