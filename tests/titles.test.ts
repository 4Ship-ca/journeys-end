import { describe, expect, it } from "vitest";
import { HOME } from "../lib/detour/navigation";
import { DEFAULT_TITLE, titleFor } from "../lib/detour/titles";

describe("titleFor", () => {
  it("names each view for the browser tab and shared links", () => {
    expect(titleFor(HOME)).toBe(DEFAULT_TITLE);
    expect(titleFor({ ...HOME, trail: ["lancaster"] }, "A living connection to the past.")).toBe(
      "A living connection to the past — Worth the Detour",
    );
    expect(titleFor({ ...HOME, view: "day" })).toBe("On this day — Worth the Detour");
    expect(titleFor({ ...HOME, research: "jet age" })).toBe("Research: jet age — Worth the Detour");
  });
});
