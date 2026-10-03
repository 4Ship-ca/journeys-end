"use client";

import { CloudSun, RefreshCw, Wind } from "lucide-react";
import type { Ref } from "react";
import { getPlace, places } from "../data";
import { isConditionsResponse, readApiError } from "../../lib/detour/api";
import { VISIT_TIMES, visitHour, type VisitTimeId } from "../../lib/detour/journey";
import { describeSymbol, pickForecastPoint } from "../../lib/detour/weather";
import type { RemoteState } from "./hooks";
import { ExternalLink } from "./links";

function formatInZone(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString(undefined, { timeZone, ...options });
}

export function ConditionsPanel({
  ref,
  placeId,
  date,
  visitTime,
  state,
  onPlaceChange,
  onVisitTimeChange,
  onRefresh,
}: {
  ref?: Ref<HTMLElement>;
  placeId: string;
  date: string;
  visitTime: VisitTimeId;
  state: RemoteState;
  onPlaceChange: (id: string) => void;
  onVisitTimeChange: (id: VisitTimeId) => void;
  onRefresh: () => void;
}) {
  const place = getPlace(placeId) ?? places[0];
  const busy = state.status === "loading";
  const data = state.status === "done" && state.ok && isConditionsResponse(state.body) && state.body.id === place.id ? state.body : null;
  const error =
    state.status === "failed"
      ? "Could not reach the live sources. Please use the official visitor page."
      : state.status === "done" && !data
        ? (readApiError(state.body)?.message ?? "Live conditions returned an unexpected response.")
        : null;
  const weather = data?.weather ?? null;
  // Judged against when the forecast was checked, so the result is stable for a given response.
  const pick = weather
    ? pickForecastPoint(weather.points, place.timeZone, date, visitHour(visitTime), new Date(data?.checkedAt ?? weather.fetchedAt))
    : null;

  return (
    <section className="wx" id="conditions" ref={ref} aria-labelledby="conditions-heading" tabIndex={-1}>
      <div className="wx-top">
        <h3 id="conditions-heading">
          <CloudSun size={16} aria-hidden="true" className="wx-icon" /> Before you head out
        </h3>
        <button type="button" aria-label="Refresh live conditions" onClick={onRefresh} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="wx-fields">
        <label>
          <span className="sr-only">Conditions location</span>
          <select className="select" value={place.id} onChange={(event) => onPlaceChange(event.target.value)}>
            {places.map((option) => (
              <option key={option.id} value={option.id}>
                {option.placeName}
              </option>
            ))}
          </select>
        </label>
        <label className="wx-time">
          <span>Forecast around</span>
          <select
            className="select"
            value={visitTime}
            onChange={(event) => onVisitTimeChange(event.target.value as VisitTimeId)}
          >
            {VISIT_TIMES.map((time) => (
              <option key={time.id} value={time.id}>
                {time.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div aria-live="polite" aria-busy={busy}>
        {busy ? (
          <p role="status">Checking weather and the official source…</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : data ? (
          <>
            {pick?.status === "found" ? (
              <>
                <div className="wx-data">
                  <span className="wx-big">{Math.round(pick.point.temp)}°C</span>
                  <span className="small">
                    <Wind size={14} aria-hidden="true" /> {pick.point.wind} km/h
                  </span>
                </div>
                <p>
                  {describeSymbol(pick.point.symbol)}
                  <br />
                  {formatInZone(pick.point.time, place.timeZone, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {place.zoneLabel}
                  {date ? "" : " · next available forecast"}
                </p>
              </>
            ) : (
              <p>
                {pick?.status === "date-passed"
                  ? "Your chosen date has passed. Choose an upcoming date for a forecast."
                  : pick?.status === "beyond-range"
                    ? `Your date is beyond the current forecast, which runs to ${pick.lastDate}. Check again closer to your visit.`
                    : (data.weatherError ?? "Forecast not available.")}
              </p>
            )}
            {weather?.state === "stale" && (
              <div className="notice">
                Latest refresh failed. Showing a forecast retrieved{" "}
                {formatInZone(weather.fetchedAt, place.timeZone, { hour: "numeric", minute: "2-digit" })} ({place.zoneLabel}).
              </div>
            )}
            <div className="notice">
              Access not confirmed{data.notices.length ? " · Notice wording found" : ""}
            </div>
            {data.notices.map((notice, index) => (
              <p key={index}>“{notice}…”</p>
            ))}
            <p>
              {data.sourceFetched
                ? "Official page retrieved; this does not confirm opening or closure for your date."
                : "Official page could not be checked. Confirm directly before travelling."}
            </p>
            <p className="small">
              Checked {new Date(data.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {weather?.updatedAt
                ? ` · forecast model ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}{" "}
              · cached up to 15 min
            </p>
          </>
        ) : null}
      </div>
      <div className="wx-links">
        <ExternalLink href={place.source}>Official visitor information</ExternalLink>
        <ExternalLink href="https://api.met.no/">Weather: MET Norway</ExternalLink>
      </div>
    </section>
  );
}
