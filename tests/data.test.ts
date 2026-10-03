import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectionReason,
  entries,
  getEntry,
  getPlace,
  imageCredits,
  isKnownId,
  isPlace,
  places,
  sourceHosts,
  visitMinutes,
} from "../app/data";
import { isValidTimeZone } from "../lib/detour/dates";

describe("curated records", () => {
  it("have unique, URL-safe IDs", () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/);
  });

  it("link only to existing records and never to themselves", () => {
    for (const entry of entries) {
      expect(entry.links.length).toBeGreaterThan(0);
      for (const link of entry.links) {
        expect(isKnownId(link), `${entry.id} -> ${link}`).toBe(true);
        expect(link).not.toBe(entry.id);
      }
    }
  });

  it("use HTTPS sources", () => {
    for (const entry of entries) {
      expect(new URL(entry.source).protocol).toBe("https:");
      expect(entry.sourceLabel.trim()).not.toBe("");
      expect(entry.query.length).toBeLessThanOrEqual(100);
    }
  });

  it("give places coordinates, a real time zone and a visit estimate", () => {
    expect(places.length).toBeGreaterThan(0);
    for (const place of places) {
      expect(place.lat).toBeGreaterThanOrEqual(-90);
      expect(place.lat).toBeLessThanOrEqual(90);
      expect(place.lon).toBeGreaterThanOrEqual(-180);
      expect(place.lon).toBeLessThanOrEqual(180);
      expect(isValidTimeZone(place.timeZone)).toBe(true);
      expect(place.duration).toBeGreaterThan(0);
    }
  });

  it("only treats mapped places as places", () => {
    expect(isPlace(getEntry("warplane"))).toBe(true);
    expect(isPlace(getEntry("lancaster"))).toBe(false);
    expect(isPlace(getEntry("cars"))).toBe(false);
    expect(isPlace(null)).toBe(false);
    expect(getPlace("lancaster")).toBeUndefined();
    expect(getPlace("honda")?.timeZone).toBe("Asia/Tokyo");
  });

  it("keeps image files and credits together", () => {
    expect(imageCredits.length).toBe(entries.filter((entry) => entry.image).length);
    for (const credit of imageCredits) {
      expect(existsSync(join(process.cwd(), "public", credit.src))).toBe(true);
      expect(credit.alt.length).toBeGreaterThan(20);
      expect(credit.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(credit.licenceUrl).toMatch(/^https:\/\/creativecommons\.org\//);
    }
  });

  it("counts stories as zero visit minutes", () => {
    expect(visitMinutes(getEntry("lancaster")!)).toBe(0);
    expect(visitMinutes(getEntry("warplane")!)).toBe(150);
    expect(visitMinutes(getEntry("cars")!)).toBe(240);
  });

  it("allows both bare and www hosts for a source", () => {
    expect(sourceHosts(getEntry("warplane")!)).toEqual(
      expect.arrayContaining(["www.warplane.com", "warplane.com"]),
    );
  });

  it("explains a connection with its kind and shared interests", () => {
    const lancaster = getEntry("lancaster")!;
    expect(connectionReason(lancaster, getEntry("warplane")!)).toBe(
      "A place you can visit · shares Aviation, History, Photography",
    );
    expect(connectionReason(getEntry("honda")!, getEntry("cars")!)).toBe(
      "An experience to check with its provider · shares Motoring",
    );
    expect(connectionReason(getEntry("memorials")!, getEntry("jetage")!)).toBe("A connected story · shares History");
  });
});
