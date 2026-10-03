/** Anniversary counts treated as "milestones". A ranking signal, not a publishing instruction. */
export const MILESTONE_YEARS: readonly number[] = [5, 10, 20, 25, 50, 75, 100];

export type Anniversary =
  | { status: "past"; years: number; milestone: boolean }
  | { status: "same-year" }
  | { status: "after-selected-year"; yearsAfter: number };

/**
 * Years between an event and the selected year. Negative event years are BCE;
 * there is no year zero, so 1 BCE to 1 CE is one year.
 */
export function anniversaryOf(eventYear: number, selectedYear: number): Anniversary {
  const span = selectedYear - eventYear - (eventYear < 0 && selectedYear > 0 ? 1 : 0);
  if (span > 0) return { status: "past", years: span, milestone: MILESTONE_YEARS.includes(span) };
  if (span === 0) return { status: "same-year" };
  return { status: "after-selected-year", yearsAfter: -span };
}

export function anniversaryLabel(anniversary: Anniversary, selectedYear: number): string {
  switch (anniversary.status) {
    case "past":
      return `${anniversary.years} ${anniversary.years === 1 ? "year" : "years"} ago${anniversary.milestone ? " · Milestone" : ""}`;
    case "same-year":
      return `In ${selectedYear}`;
    case "after-selected-year":
      return `${anniversary.yearsAfter} ${anniversary.yearsAfter === 1 ? "year" : "years"} after ${selectedYear}`;
  }
}

export function formatEventYear(year: number): string {
  return year < 0 ? `${-year} BCE` : String(year);
}

/** Milestones first, then the most recent events. Stable for equal keys. */
export function rankByAnniversary<T extends { year: number }>(
  events: readonly T[],
  selectedYear: number,
): (T & { anniversary: Anniversary })[] {
  const ranked = events.map((event, order) => ({
    item: { ...event, anniversary: anniversaryOf(event.year, selectedYear) },
    order,
  }));
  const isMilestone = (a: Anniversary) => (a.status === "past" && a.milestone ? 1 : 0);
  ranked.sort((a, b) => {
    const byMilestone = isMilestone(b.item.anniversary) - isMilestone(a.item.anniversary);
    if (byMilestone) return byMilestone;
    if (a.item.year !== b.item.year) return b.item.year - a.item.year;
    return a.order - b.order;
  });
  return ranked.map(({ item }) => item);
}

const TRANSPORT_PATTERN =
  /\b(?:aircraft|aviation|aviators?|airlines?|airliners?|airships?|airports?|aerodromes?|flights?|flew|helicopters?|jets?|spacecraft|satellites?|astronauts?|rockets?|NASA|air forces?|automobiles?|motor\w*|cars?|locomotives?|railways?|railroads?)\b/i;

/** Keyword filter for the on-this-day feed. It can miss relevant events or include irrelevant ones. */
export function isTransportEvent(text: string): boolean {
  return TRANSPORT_PATTERN.test(text);
}
