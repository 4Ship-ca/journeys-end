"use client";

import { Check, Compass, MapPin, Plus, Search, SlidersHorizontal } from "lucide-react";
import { INTERESTS, REGIONS, getEntry, type Entry } from "../data";
import { navHref } from "../../lib/detour/navigation";
import { EntryCard, InterestIcon } from "./entry-card";
import { navigate, type RemoteState } from "./hooks";
import { NavLink } from "./links";
import { ResearchPanel } from "./research-panel";

export type Filters = { query: string; region: string; interest: string };

export const ALL_REGIONS = "All places";
export const ALL_INTERESTS = "All interests";
export const DEFAULT_FILTERS: Filters = { query: "", region: ALL_REGIONS, interest: ALL_INTERESTS };

export function filterEntries(entries: readonly Entry[], filters: Filters): Entry[] {
  const query = filters.query.trim().toLowerCase();
  return entries.filter(
    (entry) =>
      (filters.region === ALL_REGIONS || entry.region === filters.region || entry.region === "Anywhere") &&
      (filters.interest === ALL_INTERESTS || entry.tags.includes(filters.interest as Entry["tags"][number])) &&
      (!query || [entry.title, entry.description, entry.body, ...entry.tags].join(" ").toLowerCase().includes(query)),
  );
}

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  return (
    <>
      <form
        className="toolbar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (filters.query.trim()) navigate(navHref({ research: filters.query }));
        }}
      >
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Explore a subject</span>
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="An aircraft, a place, a passing curiosity…"
            maxLength={100}
          />
          <button type="submit" title="Research this subject" aria-label="Research this subject">
            <SlidersHorizontal size={17} aria-hidden="true" />
          </button>
        </label>
        <label className="sr-only" htmlFor="region-filter">
          Filter by region
        </label>
        <select
          id="region-filter"
          className="select"
          value={filters.region}
          onChange={(event) => onChange({ ...filters, region: event.target.value })}
        >
          {[ALL_REGIONS, ...REGIONS].map((region) => (
            <option key={region}>{region}</option>
          ))}
        </select>
      </form>
      <div className="filters" role="group" aria-label="Filter by interest">
        {[ALL_INTERESTS, ...INTERESTS].map((interest) => {
          const active = filters.interest === interest;
          return (
            <button
              type="button"
              key={interest}
              className={`chip${active ? " active" : ""}`}
              aria-pressed={active}
              onClick={() => onChange({ ...filters, interest })}
            >
              <InterestIcon interest={interest} size={14} />
              {interest}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function ExploreView({
  filters,
  onFiltersChange,
  matches,
  research,
  researchState,
  onResearchRefresh,
  saved,
  onSave,
  onShowCredits,
}: {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  matches: Entry[];
  research: string;
  researchState: RemoteState;
  onResearchRefresh: () => void;
  saved: readonly string[];
  onSave: (id: string) => void;
  onShowCredits: () => void;
}) {
  const feature = matches.find((entry) => entry.image) ?? matches[0];
  const others = matches.filter((entry) => entry.id !== feature?.id).slice(0, 4);
  return (
    <>
      <FilterBar filters={filters} onChange={onFiltersChange} />
      {feature ? (
        <article className="feature">
          {feature.image && (
            <div className="feature-media">
              <img
                src={feature.image.src}
                alt={feature.image.alt}
                width={feature.image.width}
                height={feature.image.height}
                style={{ objectPosition: feature.image.focus }}
                decoding="async"
              />
              <span className="image-label">
                <Compass size={13} aria-hidden="true" /> A place to begin
              </span>
              <button type="button" className="photo-credit" onClick={onShowCredits}>
                {feature.image.author} · {feature.image.licence}
                <span className="sr-only"> — image credits</span>
              </button>
            </div>
          )}
          <div className="feature-copy">
            <div className="meta">
              <MapPin size={13} aria-hidden="true" />
              {feature.region}
              <span aria-hidden="true">·</span>
              <span className="gold">{feature.label}</span>
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
            <div className="actions">
              <NavLink href={navHref({ trail: [feature.id] })} className="primary">
                Follow this story <Compass size={15} aria-hidden="true" />
              </NavLink>
              <button type="button" className="secondary" onClick={() => onSave(feature.id)}>
                {saved.includes(feature.id) ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                {saved.includes(feature.id) ? "Saved" : "Save for my journey"}
              </button>
            </div>
          </div>
          <nav className="branchbar" aria-label="Follow a thread">
            <span>FOLLOW A THREAD</span>
            {feature.links.map((id) => (
              <NavLink key={id} href={navHref({ trail: [feature.id, id] })}>
                {getEntry(id)?.label ?? id}
              </NavLink>
            ))}
          </nav>
        </article>
      ) : (
        <div className="noresults">
          <p>No curated matches yet. Search the archives for “{filters.query.trim()}”.</p>
          {filters.query.trim() && (
            <NavLink href={navHref({ research: filters.query })} className="primary">
              Research this subject
            </NavLink>
          )}
        </div>
      )}
      {research && <ResearchPanel query={research} state={researchState} onRefresh={onResearchRefresh} />}
      <div className="section-label">
        <h2>A few worthwhile detours</h2>
        <span>Connections, not distractions</span>
      </div>
      {others.length ? (
        <div className="cards">
          {others.map((entry) => (
            <EntryCard key={entry.id} entry={entry} href={navHref({ trail: [entry.id] })} />
          ))}
        </div>
      ) : (
        <p className="small">Nothing else matches these filters yet.</p>
      )}
    </>
  );
}
