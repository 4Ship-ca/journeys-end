import { describe, expect, it } from "vitest";
import { daysInMonth, isValidIsoDate, isValidMonthDay, isValidTimeZone, localIsoDate, zonedParts } from "../lib/detour/dates";

describe("date validation", () => {
  it("accepts only real ISO calendar dates", () => {
    expect(isValidIsoDate("2026-10-03")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2023-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-04-31")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
    expect(isValidIsoDate("0000-01-01")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });

  it("accepts only real month-day pairs, including 29 February", () => {
    expect(isValidMonthDay("10-03")).toBe(true);
    expect(isValidMonthDay("02-29")).toBe(true);
    expect(isValidMonthDay("02-30")).toBe(false);
    expect(isValidMonthDay("04-31")).toBe(false);
    expect(isValidMonthDay("00-10")).toBe(false);
    expect(isValidMonthDay("13-01")).toBe(false);
    expect(isValidMonthDay("1-1")).toBe(false);
    expect(isValidMonthDay("10-03-2026")).toBe(false);
  });

  it("knows month lengths", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("time zones", () => {
  it("reads the local date and hour of an instant in a zone", () => {
    expect(zonedParts("2026-10-03T03:30:00Z", "America/Toronto")).toEqual({ date: "2026-10-02", hour: 23, minute: 30 });
    expect(zonedParts("2026-10-03T03:30:00Z", "Asia/Tokyo")).toEqual({ date: "2026-10-03", hour: 12, minute: 30 });
    expect(zonedParts("2026-10-03T04:00:00Z", "America/Toronto")).toEqual({ date: "2026-10-03", hour: 0, minute: 0 });
  });

  it("validates zone names", () => {
    expect(isValidTimeZone("America/Toronto")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });

  it("formats a local date", () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
