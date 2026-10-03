"use client";

import { Check, ExternalLink as ExternalIcon, Plus, RefreshCw } from "lucide-react";
import { useRef, type KeyboardEvent, type RefObject } from "react";
import { connectionReason, getEntry, isPlace, type Entry } from "../data";
import { extendTrail, navHref } from "../../lib/detour/navigation";
import { EntryCard } from "./entry-card";
import type { RemoteState } from "./hooks";
import { ExternalLink, NavLink } from "./links";
import { ResearchPanel } from "./research-panel";

export const DETAIL_TABS = [
  { id: "story", label: "Story" },
  { id: "visit", label: "Plan a visit" },
  { id: "sources", label: "Explore more" },
] as const;
export type DetailTab = (typeof DETAIL_TABS)[number]["id"];

function mapBox(lat: number, lon: number): string {
  return [lon - 0.045, lat - 0.025, lon + 0.045, lat + 0.025].map((value) => value.toFixed(4)).join("%2C");
}

export function DetailView({
  trail,
  current,
  headingRef,
  tab,
  onTabChange,
  saved,
  onSave,
  onCheckConditions,
  researchState,
  onResearchRefresh,
  onShowCredits,
}: {
  trail: string[];
  current: Entry;
  headingRef: RefObject<HTMLHeadingElement | null>;
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  saved: readonly string[];
  onSave: (id: string) => void;
  onCheckConditions: (id: string) => void;
  researchState: RemoteState;
  onResearchRefresh: () => void;
  onShowCredits: () => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isSaved = saved.includes(current.id);
  const linked = current.links.map(getEntry).filter((entry): entry is Entry => Boolean(entry));
  const unsaved = linked.filter((entry) => !saved.includes(entry.id)).slice(0, 3);
  const suggestions = unsaved.length ? unsaved : linked;

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % DETAIL_TABS.length,
      ArrowLeft: (index - 1 + DETAIL_TABS.length) % DETAIL_TABS.length,
      Home: 0,
      End: DETAIL_TABS.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onTabChange(DETAIL_TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Your trail">
        <NavLink href={navHref({})}>Explore</NavLink>
        {trail.map((id, index) => {
          const entry = getEntry(id);
          if (!entry) return null;
          const last = index === trail.length - 1;
          return (
            <span key={`${id}-${index}`}>
              <span aria-hidden="true"> / </span>
              {last ? (
                <span aria-current="page">{entry.label}</span>
              ) : (
                <NavLink href={navHref({ trail: trail.slice(0, index + 1) })}>{entry.label}</NavLink>
              )}
            </span>
          );
        })}
      </nav>
      <article className="detail">
        {current.image && (
          <img
            className="detail-photo"
            src={current.image.src}
            alt={current.image.alt}
            width={current.image.width}
            height={current.image.height}
            style={{ objectPosition: current.image.focus }}
            decoding="async"
          />
        )}
        <div className="detail-content">
          <div className="meta">
            <span className="gold">{current.label}</span> · {current.region} · {current.cost}
          </div>
          <h2 ref={headingRef} tabIndex={-1}>
            {current.title}
          </h2>
          <p>{current.description}</p>
          <div className="actions">
            <button type="button" className="primary" onClick={() => onSave(current.id)}>
              {isSaved ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              {isSaved ? "In your journey" : "Add to my journey"}
            </button>
            <ExternalLink href={current.source} className="secondary">
              {current.sourceLabel} <ExternalIcon size={13} aria-hidden="true" />
            </ExternalLink>
          </div>
          <div className="detail-tabs" role="tablist" aria-label="About this connection">
            {DETAIL_TABS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls="detail-panel"
                tabIndex={tab === item.id ? 0 : -1}
                className={tab === item.id ? "active" : ""}
                onClick={() => onTabChange(item.id)}
                onKeyDown={(event) => onTabKey(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div id="detail-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            {tab === "story" ? (
              <>
                <p className="bodycopy">{current.body}</p>
                <p className="small">
                  Curated starting point · <ExternalLink href={current.source}>Original source</ExternalLink>
                </p>
                {current.image && (
                  <p className="small">
                    {current.image.author} · {current.image.licence} · Cropped and toned.{" "}
                    <button type="button" className="text-button" onClick={onShowCredits}>
                      Image credits
                    </button>
                  </p>
                )}
              </>
            ) : tab === "visit" ? (
              <VisitPanel entry={current} onCheckConditions={onCheckConditions} />
            ) : (
              <ResearchPanel query={current.query} state={researchState} onRefresh={onResearchRefresh} />
            )}
          </div>
        </div>
      </article>
      <div className="section-label">
        <h2>Where could this lead?</h2>
        <span>You choose the next chapter</span>
      </div>
      <div className="cards">
        {suggestions.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            href={navHref({ trail: extendTrail(trail, entry.id) })}
            reason={connectionReason(current, entry)}
          />
        ))}
      </div>
    </>
  );
}

function VisitPanel({ entry, onCheckConditions }: { entry: Entry; onCheckConditions: (id: string) => void }) {
  if (!isPlace(entry)) {
    return (
      <p>
        {entry.kind === "experience"
          ? `Allow around ${entry.duration} minutes as a starting estimate, plus travel. This is an experience lead, not a confirmed location: confirm the branch, availability and conditions with the provider before adding it to a route.`
          : "This is a story or research lead rather than a visit location. Follow a connected place to build a route."}
      </p>
    );
  }
  return (
    <>
      <p>
        Allow around {entry.duration} minutes as a starting estimate, plus travel. Use the location below to investigate
        the visit. Check official access and admission before travelling.
      </p>
      <div className="actions">
        <button type="button" className="secondary" onClick={() => onCheckConditions(entry.id)}>
          <RefreshCw size={14} aria-hidden="true" /> Check conditions
        </button>
        <ExternalLink className="secondary" href={`https://www.google.com/maps/search/?api=1&query=${entry.lat},${entry.lon}`}>
          Open directions <ExternalIcon size={13} aria-hidden="true" />
        </ExternalLink>
      </div>
      <iframe
        className="map-frame"
        loading="lazy"
        title={`Map of ${entry.title}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBox(entry.lat, entry.lon)}&layer=mapnik&marker=${entry.lat}%2C${entry.lon}`}
      />
      <p className="small">© OpenStreetMap contributors · {entry.locationNote}</p>
    </>
  );
}
