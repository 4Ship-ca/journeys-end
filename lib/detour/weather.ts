import { zonedParts } from "./dates";

export type ForecastPoint = {
  /** ISO instant (UTC). */
  time: string;
  /** Air temperature, °C. */
  temp: number;
  /** Wind speed, km/h. */
  wind: number;
  /** MET Norway symbol code, e.g. "partlycloudy_day"; may be empty. */
  symbol: string;
};

export type ForecastPick =
  | { status: "found"; point: ForecastPoint; localDate: string; localHour: number }
  | { status: "no-forecast" }
  | { status: "date-passed" }
  | { status: "beyond-range"; lastDate: string };

/**
 * Chooses the forecast point nearest the visitor's chosen hour on their chosen
 * local date. With no date, it uses the next forecast point. It never
 * substitutes a different day when the chosen date is outside the forecast.
 */
export function pickForecastPoint(
  points: readonly ForecastPoint[],
  timeZone: string,
  date: string,
  hour: number,
  now: Date,
): ForecastPick {
  if (!points.length) return { status: "no-forecast" };
  const zoned = points.map((point) => ({ point, ...zonedParts(point.time, timeZone) }));
  if (!date) {
    const upcoming = zoned.find((item) => Date.parse(item.point.time) >= now.getTime() - 60 * 60 * 1000) ?? zoned[0];
    return { status: "found", point: upcoming.point, localDate: upcoming.date, localHour: upcoming.hour };
  }
  const today = zonedParts(now, timeZone).date;
  if (date < today) return { status: "date-passed" };
  const sameDay = zoned.filter((item) => item.date === date);
  if (!sameDay.length) return { status: "beyond-range", lastDate: zoned[zoned.length - 1].date };
  let best = sameDay[0];
  for (const item of sameDay) {
    // Ties go to the later point, which covers the visit rather than the hours before it.
    if (Math.abs(item.hour - hour) <= Math.abs(best.hour - hour)) best = item;
  }
  return { status: "found", point: best.point, localDate: best.date, localHour: best.hour };
}

const SYMBOL_TOKENS: [string, string][] = [
  ["clearsky", "clear sky"],
  ["partlycloudy", "partly cloudy"],
  ["cloudy", "cloudy"],
  ["fair", "fair"],
  ["fog", "fog"],
  ["light", "light"],
  ["heavy", "heavy"],
  ["rainshowers", "rain showers"],
  ["sleetshowers", "sleet showers"],
  ["snowshowers", "snow showers"],
  ["rain", "rain"],
  ["sleet", "sleet"],
  ["snow", "snow"],
  ["and", "and"],
  ["thunder", "thunder"],
];

/** Turns a MET Norway symbol code such as "lightrainshowersandthunder_day" into readable words. */
export function describeSymbol(code: string): string {
  const base = code
    .replace(/_(day|night|polartwilight)$/, "")
    .toLowerCase()
    // MET Norway publishes "lightssleet…" and "lightssnow…" spellings.
    .replace(/^lights(?=sleet|snow)/, "light");
  if (!base) return "Conditions not described";
  const words: string[] = [];
  let rest = base;
  while (rest) {
    const token = SYMBOL_TOKENS.find(([key]) => rest.startsWith(key));
    if (!token) return base.replace(/_/g, " ");
    words.push(token[1]);
    rest = rest.slice(token[0].length);
  }
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
