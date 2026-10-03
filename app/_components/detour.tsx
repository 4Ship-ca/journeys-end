"use client";

import { Bookmark, Compass, Leaf } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { entries, getEntry, isKnownId, isPlace, places } from "../data";
import { addToJourney, MAX_SAVED } from "../../lib/detour/journey";
import { navHref, parseNav, trailKey, type View } from "../../lib/detour/navigation";
import { titleFor } from "../../lib/detour/titles";
import { AboutView } from "./about-view";
import { ConditionsPanel } from "./conditions-panel";
import { DetailView, type DetailTab } from "./detail-view";
import { DEFAULT_FILTERS, ExploreView, filterEntries, type Filters } from "./explore-view";
import { navigate, prefersReducedMotion, useJourney, useLocationSearch, useRemoteJson, useToast, useToday } from "./hooks";
import { JourneyPlanner } from "./journey-planner";
import { NavLink } from "./links";
import { OnThisDayView } from "./on-this-day-view";
import { PlacesView } from "./places-view";

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "explore", label: "Explore" },
  { view: "day", label: "On this day" },
  { view: "places", label: "Places" },
  { view: "about", label: "Our approach" },
];

const INTRO: Record<View, { title: string; text: string }> = {
  explore: {
    title: "Where will your interests take you?",
    text: "Aircraft, history, open roads. A journey that takes shape as you explore.",
  },
  day: { title: "A date can open a door.", text: "Discover a moment in history, then see where it leads." },
  places: {
    title: "Find the story on the map.",
    text: "Aircraft, history, open roads. A journey that takes shape as you explore.",
  },
  about: {
    title: "A little curiosity goes a long way.",
    text: "Aircraft, history, open roads. A journey that takes shape as you explore.",
  },
};

function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

function revealElement(element: HTMLElement | null): void {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

export default function Detour({ initialSearch }: { initialSearch: string }) {
  const search = useLocationSearch(initialSearch);
  const nav = useMemo(() => parseNav(search, isKnownId), [search]);
  const store = useJourney();
  const { journey, update } = store;
  const today = useToday();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const matches = useMemo(() => filterEntries(entries, filters), [filters]);

  const key = trailKey(nav.trail);
  const current = nav.trail.length ? (getEntry(nav.trail[nav.trail.length - 1]) ?? null) : null;

  const [tabState, setTabState] = useState<{ key: string; tab: DetailTab }>({ key: "", tab: "story" });
  const tab: DetailTab = tabState.key === key ? tabState.tab : "story";

  const [researchRefresh, setResearchRefresh] = useState(0);
  const researchQuery = nav.view !== "explore" ? "" : current ? (tab === "sources" ? current.query : "") : nav.research;
  const researchState = useRemoteJson(
    researchQuery ? `/api/discover?q=${encodeURIComponent(researchQuery)}` : null,
    researchRefresh,
  );

  const dayDate = nav.on || today;
  const dayState = useRemoteJson(nav.view === "day" && dayDate ? `/api/discover?day=${dayDate.slice(5)}` : null);

  const [placeChoice, setPlaceChoice] = useState<{ id: string; context: string } | null>(null);
  const [conditionsRefresh, setConditionsRefresh] = useState(0);
  const firstSavedPlace = journey.saved.find((id) => isPlace(getEntry(id)));
  const conditionsId =
    isPlace(current) && placeChoice?.context !== key ? current.id : (placeChoice?.id ?? firstSavedPlace ?? places[0].id);
  const conditionsState = useRemoteJson(`/api/conditions?id=${encodeURIComponent(conditionsId)}`, conditionsRefresh);
  const conditionsRef = useRef<HTMLElement>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const viewKey = `${nav.view}|${key}|${nav.research}`;
  const previousViewKey = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousViewKey.current;
    previousViewKey.current = viewKey;
    // Leave focus and scroll alone on the first render; move them only after navigation.
    if (previous === null || previous === viewKey) return;
    const hashTarget = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    if (hashTarget) revealElement(hashTarget);
    else if (current) revealElement(headingRef.current);
    else titleRef.current?.focus({ preventScroll: true });
  }, [viewKey, current]);

  useEffect(() => {
    document.title = titleFor(nav, current?.title);
  }, [nav, current]);

  function save(id: string) {
    if (journey.saved.includes(id)) {
      toast.show("Already in your journey");
      return;
    }
    if (journey.saved.length >= MAX_SAVED) {
      toast.show(`Your journey holds up to ${MAX_SAVED} items. Export or remove some first.`);
      return;
    }
    update((state) => addToJourney(state, id));
    toast.show("Added to your journey");
  }

  function checkConditions(id: string) {
    setPlaceChoice({ id, context: key });
    setConditionsRefresh((count) => count + 1);
    revealElement(conditionsRef.current);
  }

  function showCredits() {
    navigate(`${navHref({ view: "about" })}#credits`);
  }

  const intro = INTRO[nav.view];

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header>
        <NavLink href={navHref({})} className="brand" aria-label="Worth the Detour home">
          <span className="brandmark" aria-hidden="true">
            <Compass size={26} strokeWidth={1.3} />
          </span>
          <span>
            <strong>Worth the Detour</strong>
            <small>A FIELD GUIDE FOR THE CURIOUS</small>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.view}
              href={navHref({ view: item.view })}
              className={nav.view === item.view ? "active" : ""}
              current={nav.view === item.view}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <a
          className="journey-nav"
          href="#journey"
          onClick={(event) => {
            event.preventDefault();
            revealElement(document.getElementById("journey-heading"));
          }}
        >
          <Bookmark size={17} aria-hidden="true" />
          <span>My journey</span>
          <span className="count" aria-label={`${journey.saved.length} saved`}>
            {journey.saved.length}
          </span>
        </a>
      </header>
      <div className="shell">
        <section className="intro">
          <div>
            <div className="eyebrow">Follow a curiosity. Find a connection.</div>
            <h1 ref={titleRef} tabIndex={-1}>
              {intro.title}
            </h1>
            <p>{intro.text}</p>
          </div>
          <div className="quiet-note">
            <Leaf size={16} aria-hidden="true" /> Thoughtful discoveries. Your pace.
          </div>
        </section>
        <div className="layout">
          <main className="main" id="content" tabIndex={-1}>
            {nav.view === "about" ? (
              <AboutView />
            ) : nav.view === "day" ? (
              <OnThisDayView
                date={dayDate}
                state={dayState}
                onDateChange={(date) => navigate(navHref({ view: "day", on: date }), { replace: true })}
              />
            ) : nav.view === "places" ? (
              <PlacesView filters={filters} onFiltersChange={setFilters} matches={matches} />
            ) : current ? (
              <DetailView
                trail={nav.trail}
                current={current}
                headingRef={headingRef}
                tab={tab}
                onTabChange={(next) => setTabState({ key, tab: next })}
                saved={journey.saved}
                onSave={save}
                onCheckConditions={checkConditions}
                researchState={researchState}
                onResearchRefresh={() => setResearchRefresh((count) => count + 1)}
                onShowCredits={showCredits}
              />
            ) : (
              <ExploreView
                filters={filters}
                onFiltersChange={setFilters}
                matches={matches}
                research={nav.research}
                researchState={researchState}
                onResearchRefresh={() => setResearchRefresh((count) => count + 1)}
                saved={journey.saved}
                onSave={save}
                onShowCredits={showCredits}
              />
            )}
          </main>
          <aside className="aside" id="journey" aria-label="Your journey and conditions">
            <JourneyPlanner store={store} />
            <ConditionsPanel
              ref={conditionsRef}
              placeId={conditionsId}
              date={journey.date}
              visitTime={journey.visitTime}
              state={conditionsState}
              onPlaceChange={(id) => setPlaceChoice({ id, context: key })}
              onVisitTimeChange={(visitTime) => update((state) => ({ ...state, visitTime }))}
              onRefresh={() => setConditionsRefresh((count) => count + 1)}
            />
            <div className="aside-quote">“Leave a little room for the unexpected.”</div>
          </aside>
        </div>
        <footer>
          <span>
            Worth the Detour <span className="footer-sep">/</span> An independent exploration by 4ship
          </span>
          <span>
            Curiosity first. Your pace. <NavLink href={navHref({ view: "about" })}>Sources & approach</NavLink>
          </span>
        </footer>
      </div>
      <div className="toast" role="status" aria-live="polite">
        {toast.message}
      </div>
    </>
  );
}
