"use client";

import { CalendarDays, ExternalLink as ExternalIcon } from "lucide-react";
import { anniversaryLabel, formatEventYear, rankByAnniversary } from "../../lib/detour/anniversary";
import { isAnniversaryResponse, readApiError } from "../../lib/detour/api";
import { isValidIsoDate } from "../../lib/detour/dates";
import { navHref } from "../../lib/detour/navigation";
import type { RemoteState } from "./hooks";
import { ExternalLink, NavLink } from "./links";

export function OnThisDayView({
  date,
  state,
  onDateChange,
}: {
  /** YYYY-MM-DD, or "" before the visitor's local date is known. */
  date: string;
  state: RemoteState;
  onDateChange: (date: string) => void;
}) {
  const data = state.status === "done" && state.ok && isAnniversaryResponse(state.body) ? state.body : null;
  const error =
    state.status === "failed"
      ? "The anniversary source could not be reached."
      : state.status === "done" && !data
        ? (readApiError(state.body)?.message ?? "The anniversary source returned an unexpected response.")
        : null;
  const selectedYear = date ? Number(date.slice(0, 4)) : NaN;
  const events = data && Number.isFinite(selectedYear) ? rankByAnniversary(data.events, selectedYear) : [];

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <CalendarDays size={18} aria-hidden="true" />
          <span className="sr-only">Anniversary date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              if (isValidIsoDate(event.target.value)) onDateChange(event.target.value);
            }}
          />
        </label>
      </div>
      <p className="small">
        Aviation, transport and exploration leads from Wikipedia’s date feed, filtered by keywords that can miss or
        mis-include events. Anniversary counts use the selected year; milestones are listed first. Verify each event
        before publishing.
      </p>
      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {!date || state.status === "loading" ? (
          <div className="loader" role="status">
            Finding moments worth revisiting…
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : events.length ? (
          <>
            {events.map((event, index) => (
              <article className="event" key={`${event.year}-${index}`}>
                <span className="year">{formatEventYear(event.year)}</span>
                <span
                  className={`chip${event.anniversary.status === "past" && event.anniversary.milestone ? " chip-milestone" : ""}`}
                >
                  {anniversaryLabel(event.anniversary, selectedYear)}
                </span>
                <p>{event.text}</p>
                <div className="actions">
                  <NavLink className="primary" href={navHref({ research: event.text.slice(0, 95) })}>
                    Explore the background
                  </NavLink>
                  <ExternalLink href={event.url} className="secondary">
                    Read the source <ExternalIcon size={13} aria-hidden="true" />
                  </ExternalLink>
                </div>
              </article>
            ))}
            {data && (
              <p className="small">
                Source: <ExternalLink href={data.sourceUrl}>{data.source}</ExternalLink>, Wikipedia contributors (CC BY-SA
                4.0). Retrieved {new Date(data.checkedAt).toLocaleString()}.
              </p>
            )}
          </>
        ) : (
          <div className="noresults">No matching events returned for this date. Choose another date or explore a subject.</div>
        )}
      </div>
    </>
  );
}
