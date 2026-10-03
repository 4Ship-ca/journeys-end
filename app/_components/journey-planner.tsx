"use client";

import { Bookmark, ChevronDown, ChevronUp, Download, Route, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getEntry, visitMinutes, type Entry } from "../data";
import { isValidIsoDate } from "../../lib/detour/dates";
import {
  PACES,
  formatHours,
  journeyFileName,
  journeyToText,
  moveInJourney,
  removeFromJourney,
  summariseJourney,
  type Pace,
} from "../../lib/detour/journey";
import { navHref } from "../../lib/detour/navigation";
import type { JourneyStore } from "./hooks";
import { NavLink } from "./links";

function kindNote(entry: Entry): string {
  const minutes = visitMinutes(entry);
  if (entry.kind === "story") return "Story to explore";
  return `${minutes} min suggested${entry.kind === "experience" ? " · provider to confirm" : ""}`;
}

function downloadText(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function JourneyPlanner({ store }: { store: JourneyStore }) {
  const { journey, persistent, update } = store;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const saved = useMemo(
    () => journey.saved.map(getEntry).filter((entry): entry is Entry => Boolean(entry)),
    [journey.saved],
  );
  const summary = summariseJourney(saved, journey.pace, visitMinutes);

  function move(index: number, delta: number) {
    const entry = saved[index];
    update((current) => moveInJourney(current, index, delta));
    setAnnouncement(`${entry.title} moved to position ${index + delta + 1} of ${saved.length}.`);
  }

  function remove(entry: Entry) {
    update((current) => removeFromJourney(current, entry.id));
    setAnnouncement(`${entry.title} removed from your journey.`);
    headingRef.current?.focus();
  }

  function exportJourney() {
    const now = new Date();
    downloadText(journeyToText(journey, saved, summary, visitMinutes, now), journeyFileName(journey, now));
  }

  return (
    <section className="planner" aria-labelledby="journey-heading">
      <div className="planner-head">
        <div className="overline">
          <Route size={15} aria-hidden="true" /> Your own path
        </div>
        <h2 id="journey-heading" ref={headingRef} tabIndex={-1}>
          A journey, taking shape.
        </h2>
        <p>Keep the places and stories that speak to you.</p>
      </div>
      <div className="planner-body">
        <div className="planner-fields">
          <label>
            <span className="field-label">When</span>
            <input
              type="date"
              value={journey.date}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "" || isValidIsoDate(value)) update((current) => ({ ...current, date: value }));
              }}
            />
          </label>
          <label>
            <span className="field-label">Your pace</span>
            <select
              value={journey.pace}
              onChange={(event) => update((current) => ({ ...current, pace: event.target.value as Pace }))}
            >
              {PACES.map((pace) => (
                <option key={pace}>{pace}</option>
              ))}
            </select>
          </label>
        </div>
        {saved.length ? (
          <>
            <ol className="plan-list">
              {saved.map((entry, index) => (
                <li className="plan-row" key={entry.id}>
                  <span className="step" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <NavLink href={navHref({ trail: [entry.id] })} className="plan-title">
                      {entry.title}
                    </NavLink>
                    <small>
                      {entry.region} · {kindNote(entry)}
                    </small>
                  </div>
                  <div className="row-tools">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      aria-label={`Move ${entry.title} earlier`}
                      disabled={index === 0}
                    >
                      <ChevronUp size={16} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => remove(entry)} aria-label={`Remove ${entry.title}`}>
                      <X size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      aria-label={`Move ${entry.title} later`}
                      disabled={index === saved.length - 1}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <div className="plan-total">
              <span>
                {saved.length} saved {saved.length === 1 ? "connection" : "connections"}
              </span>
              <span>{formatHours(summary.minutes)} visits*</span>
            </div>
            {summary.multiRegion && (
              <div className="notice">
                Your collection spans {summary.regions.join(" and ")}. Treat these as separate trips.
              </div>
            )}
            {summary.overloaded && (
              <div className="notice">This is more than a relaxed day of visits. Consider splitting it across days.</div>
            )}
            <p className="small">*Suggested visit time only. Travel, queues and opening hours are not included.</p>
            <div className="actions">
              <button type="button" className="primary full" onClick={exportJourney}>
                <Download size={15} aria-hidden="true" /> Export my journey
              </button>
              <button type="button" className="text-button" onClick={() => window.print()}>
                Print / save as PDF
              </button>
            </div>
          </>
        ) : (
          <div className="empty-plan">
            <Bookmark size={23} strokeWidth={1.2} aria-hidden="true" />
            <p>Something catch your eye?</p>
            <small>
              Save a story or place.
              <br />
              Your journey starts with one connection.
            </small>
          </div>
        )}
        <div className="local-note">
          {persistent
            ? "Saved on this device. No account needed."
            : "Browser storage is unavailable, so this journey lasts only while the page is open. Export to keep it."}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  );
}
