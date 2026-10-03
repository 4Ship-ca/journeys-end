import { getEntry, getPlace, sourceHosts } from "../../data";
import type { ConditionsResponse, WeatherReport } from "../../../lib/detour/api";
import { TtlCache } from "../../../lib/detour/server/cache";
import { parseForecast } from "../../../lib/detour/server/forecast";
import { NOTICE_SCOPE, extractNotices } from "../../../lib/detour/server/notices";
import { jsonError, jsonOk } from "../../../lib/detour/server/responses";
import { fetchJson, fetchText } from "../../../lib/detour/server/upstream";

const FRESH_MS = 15 * 60 * 1000;
/** A failed refresh may fall back to a forecast retrieved within this window, labelled stale. */
const STALE_MS = 6 * 60 * 60 * 1000;

const cache = new TtlCache<Omit<ConditionsResponse, "cached">>(FRESH_MS, STALE_MS, 50);

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return jsonError(400, { code: "missing_id", message: "Choose a place to check." });
  }
  if (!/^[a-z0-9-]{1,40}$/.test(id) || !getEntry(id)) {
    return jsonError(400, { code: "unknown_place", message: "This place is not in the guide." });
  }
  const place = getPlace(id);
  if (!place) {
    return jsonError(400, { code: "not_a_place", message: "Conditions are only available for mapped places." });
  }

  const now = Date.now();
  const hit = cache.get(id, now);
  if (hit?.fresh) return jsonOk({ ...hit.value, cached: true }, "private, max-age=60");

  const [forecast, page] = await Promise.allSettled([
    fetchJson(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`,
      { timeoutMs: 9_000, maxBytes: 2_000_000, allowedHosts: ["api.met.no"] },
    ),
    fetchText(place.source, {
      timeoutMs: 9_000,
      maxBytes: 2_000_000,
      allowedHosts: sourceHosts(place),
      accept: "text/html,application/xhtml+xml",
      contentTypes: ["text/html", "application/xhtml+xml", "text/plain"],
    }),
  ]);

  const checkedAt = new Date(now).toISOString();
  let weather: WeatherReport | null = null;
  if (forecast.status === "fulfilled") {
    const parsed = parseForecast(forecast.value.data);
    if (parsed.points.length) weather = { state: "current", updatedAt: parsed.updatedAt, fetchedAt: checkedAt, points: parsed.points };
  }
  if (!weather && hit?.value.weather) {
    weather = { ...hit.value.weather, state: "stale" };
  }

  const body: Omit<ConditionsResponse, "cached"> = {
    id,
    checkedAt,
    source: place.source,
    sourceFetched: page.status === "fulfilled",
    access: "unconfirmed",
    notices: page.status === "fulfilled" ? extractNotices(page.value.text) : [],
    noticeScope: NOTICE_SCOPE,
    timeZone: place.timeZone,
    weather,
    weatherError: weather ? null : "Weather is unavailable. Try again later.",
  };

  if (weather?.state === "current") cache.set(id, body, now);
  return jsonOk({ ...body, cached: false }, weather?.state === "current" ? "private, max-age=60" : "no-store");
}
