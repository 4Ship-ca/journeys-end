"use client";

import { isPlace, type Entry } from "../data";
import { navHref } from "../../lib/detour/navigation";
import { EntryCard } from "./entry-card";
import { FilterBar, type Filters } from "./explore-view";

export function PlacesView({
  filters,
  onFiltersChange,
  matches,
}: {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  matches: Entry[];
}) {
  const mapped = matches.filter(isPlace);
  return (
    <>
      <FilterBar filters={filters} onChange={onFiltersChange} />
      {mapped.length ? (
        <div className="cards">
          {mapped.map((place) => (
            <EntryCard key={place.id} entry={place} href={navHref({ trail: [place.id] })} />
          ))}
        </div>
      ) : (
        <div className="noresults">No mapped places match these filters. Try all interests.</div>
      )}
      <p className="small">
        A deliberately small starting collection. Public access and display availability must be checked with each
        venue.
      </p>
    </>
  );
}
