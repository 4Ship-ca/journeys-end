import { isValidIsoDate } from "./dates";

export const VIEWS = ["explore", "day", "places", "about"] as const;
export type View = (typeof VIEWS)[number];

export const MAX_TRAIL = 12;
export const MAX_RESEARCH_LENGTH = 100;

export type NavState = {
  view: View;
  /** Explored record IDs, oldest first. Only meaningful in the explore view. */
  trail: string[];
  /** Free-text research subject for the explore view. */
  research: string;
  /** YYYY-MM-DD for the on-this-day view, or "" for today. */
  on: string;
};

export const HOME: NavState = { view: "explore", trail: [], research: "", on: "" };

function isView(value: string | null): value is View {
  return value !== null && (VIEWS as readonly string[]).includes(value);
}

export function cleanResearch(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_RESEARCH_LENGTH)
    .trim();
}

/** Parses a location search string. Unknown views, IDs and dates are dropped. */
export function parseNav(search: string, isKnown: (id: string) => boolean): NavState {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const trail: string[] = [];
  for (const id of (params.get("trail") ?? "").split(",")) {
    if (id && isKnown(id) && trail[trail.length - 1] !== id) trail.push(id);
  }
  const resolvedView: View = isView(view) ? view : "explore";
  const on = params.get("on") ?? "";
  return {
    view: resolvedView,
    trail: resolvedView === "explore" ? trail.slice(-MAX_TRAIL) : [],
    research: resolvedView === "explore" && !trail.length ? cleanResearch(params.get("research") ?? "") : "",
    on: resolvedView === "day" && isValidIsoDate(on) ? on : "",
  };
}

/** Builds a relative URL for a navigation state. The home state is the bare path. */
export function navHref(state: Partial<NavState>, pathname = "/"): string {
  const params = new URLSearchParams();
  const view = state.view ?? "explore";
  if (view !== "explore") params.set("view", view);
  if (view === "explore" && state.trail?.length) params.set("trail", state.trail.join(","));
  else if (view === "explore" && state.research) params.set("research", cleanResearch(state.research));
  if (view === "day" && state.on) params.set("on", state.on);
  const query = params.toString().replace(/%2C/g, ",");
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Follows a connection. Revisiting a record already in the trail returns to that
 * point instead of creating a loop; the trail is capped at MAX_TRAIL records.
 */
export function extendTrail(trail: readonly string[], id: string): string[] {
  const existing = trail.indexOf(id);
  if (existing >= 0) return trail.slice(0, existing + 1);
  return [...trail, id].slice(-MAX_TRAIL);
}

export function trailKey(trail: readonly string[]): string {
  return trail.join(",");
}
