import type { Entry, Region } from "../../app/data";
import { isValidIsoDate } from "./dates";

/** Kept from the first release so existing saved journeys continue to load. */
export const JOURNEY_STORAGE_KEY = "detour-plan-v1";

export const PACES = ["Unhurried", "A full day", "Just browsing"] as const;
export type Pace = (typeof PACES)[number];

export const VISIT_TIMES = [
  { id: "morning", label: "Morning", hour: 9 },
  { id: "midday", label: "Midday", hour: 12 },
  { id: "afternoon", label: "Afternoon", hour: 15 },
  { id: "evening", label: "Evening", hour: 18 },
] as const;
export type VisitTimeId = (typeof VISIT_TIMES)[number]["id"];

/** Upper bound on saved items; keeps storage and exports reasonable. */
export const MAX_SAVED = 50;

export type JourneyState = {
  saved: string[];
  /** YYYY-MM-DD, or "" for flexible planning. */
  date: string;
  pace: Pace;
  visitTime: VisitTimeId;
};

export const EMPTY_JOURNEY: JourneyState = { saved: [], date: "", pace: "Unhurried", visitTime: "midday" };

function isPace(value: unknown): value is Pace {
  return typeof value === "string" && (PACES as readonly string[]).includes(value);
}

function isVisitTime(value: unknown): value is VisitTimeId {
  return typeof value === "string" && VISIT_TIMES.some((time) => time.id === value);
}

export function visitHour(id: VisitTimeId): number {
  return VISIT_TIMES.find((time) => time.id === id)?.hour ?? 12;
}

/**
 * Reads stored JSON defensively. Unknown IDs, duplicates, invalid dates and
 * unrecognised options are dropped rather than failing the whole journey.
 */
export function parseJourney(raw: string | null, isKnown: (id: string) => boolean): JourneyState {
  if (!raw) return EMPTY_JOURNEY;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY_JOURNEY;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_JOURNEY;
  const record = value as Record<string, unknown>;
  const saved: string[] = [];
  if (Array.isArray(record.saved)) {
    for (const id of record.saved) {
      if (typeof id === "string" && isKnown(id) && !saved.includes(id)) saved.push(id);
      if (saved.length >= MAX_SAVED) break;
    }
  }
  return {
    saved,
    date: typeof record.date === "string" && isValidIsoDate(record.date) ? record.date : "",
    pace: isPace(record.pace) ? record.pace : EMPTY_JOURNEY.pace,
    visitTime: isVisitTime(record.visitTime) ? record.visitTime : EMPTY_JOURNEY.visitTime,
  };
}

export function serializeJourney(state: JourneyState): string {
  return JSON.stringify({ saved: state.saved, date: state.date, pace: state.pace, visitTime: state.visitTime });
}

export function addToJourney(state: JourneyState, id: string): JourneyState {
  if (state.saved.includes(id) || state.saved.length >= MAX_SAVED) return state;
  return { ...state, saved: [...state.saved, id] };
}

export function removeFromJourney(state: JourneyState, id: string): JourneyState {
  if (!state.saved.includes(id)) return state;
  return { ...state, saved: state.saved.filter((saved) => saved !== id) };
}

export function moveInJourney(state: JourneyState, index: number, delta: number): JourneyState {
  const next = index + delta;
  if (index < 0 || index >= state.saved.length || next < 0 || next >= state.saved.length) return state;
  const saved = [...state.saved];
  [saved[index], saved[next]] = [saved[next], saved[index]];
  return { ...state, saved };
}

export function overloadLimit(pace: Pace): number {
  return pace === "Unhurried" ? 240 : 480;
}

export type JourneySummary = {
  minutes: number;
  regions: Region[];
  multiRegion: boolean;
  overloaded: boolean;
};

/** Suggested visit minutes only. Travel, queues and opening windows are excluded. */
export function summariseJourney(saved: Entry[], pace: Pace, minutesFor: (entry: Entry) => number): JourneySummary {
  const minutes = saved.reduce((total, entry) => total + minutesFor(entry), 0);
  const regions = Array.from(new Set(saved.map((entry) => entry.region).filter((region) => region !== "Anywhere")));
  return { minutes, regions, multiRegion: regions.length > 1, overloaded: minutes > overloadLimit(pace) };
}

export function formatHours(minutes: number): string {
  return `${Math.round(minutes / 6) / 10}h`;
}

export function unresolvedChecks(entry: Entry): string[] {
  switch (entry.kind) {
    case "place":
      return [
        "Opening hours, admission and access are not confirmed for your date.",
        "Collection membership does not guarantee an aircraft or object is on display.",
      ];
    case "experience":
      return [
        "Availability, price, eligibility and conditions must be confirmed with the provider.",
        "No booking has been made.",
      ];
    case "story":
      return ["A story to explore; not a physical stop."];
  }
}

/** A plain-text export containing the selections, their sources and the checks still outstanding. */
export function journeyToText(
  state: JourneyState,
  saved: Entry[],
  summary: JourneySummary,
  minutesFor: (entry: Entry) => number,
  generatedAt: Date,
): string {
  const lines = [
    "WORTH THE DETOUR",
    `Date: ${state.date || "Flexible"} · Pace: ${state.pace}`,
    `Exported: ${generatedAt.toISOString()}`,
    "Planning notes, not confirmed bookings.",
    "",
  ];
  saved.forEach((entry, index) => {
    const minutes = minutesFor(entry);
    lines.push(`${index + 1}. ${entry.title}`);
    lines.push(`   ${entry.label} · ${entry.region} · ${entry.cost}`);
    lines.push(`   ${entry.description}`);
    lines.push(`   Source: ${entry.source}`);
    if (minutes) lines.push(`   Suggested time: ${minutes} minutes, excluding travel.`);
    for (const check of unresolvedChecks(entry)) lines.push(`   Check: ${check}`);
    lines.push("");
  });
  lines.push(`Suggested visit time: ${formatHours(summary.minutes)} (travel, queues and opening hours not included).`);
  if (summary.multiRegion) lines.push(`Note: this collection spans ${summary.regions.join(" and ")}. Treat these as separate trips.`);
  if (summary.overloaded) lines.push("Note: this is more than a relaxed day of visits. Consider splitting it across days.");
  return lines.join("\n");
}

export function journeyFileName(state: JourneyState, generatedAt: Date): string {
  const stamp = state.date || generatedAt.toISOString().slice(0, 10);
  return `my-detour-${stamp}.txt`;
}
