# Worth the Detour — developer handoff and product specification

**Prepared:** 3 October 2026  
**Status:** Working first version plus a specification for the intended product  
**Working title:** Worth the Detour; not an approved final brand  
**Origin:** 4ship / independent aviation photography and community resource  
**Private deployed version:** https://worth-the-detour.muddy-pony-6118.chatgpt.site  
**Source baseline:** `7ba15f5a1b164f3945f807e228a9278006142932`

This document distinguishes shipped behaviour from future requirements. Do not interpret the roadmap as implemented functionality or the current source as a production-complete travel service. The ZIP includes this document, the tracked application source, licensed photographs, a quick-start file and an integrity manifest. It excludes dependencies, generated builds, runtime state and Git credentials/history. The live site has not been changed by this export.

## 1. Purpose and owner intent

Create a welcoming, practical place where visitors follow an interest into a personally useful experience: a story, aircraft, museum, local memorial, photography stop, motoring experience or trip. Aviation is the credible starting audience, not a mandatory boundary around every discovery.

The owner wants modest side income while supporting a community. Avoid assuming a large company, a travel agency operation, a venture-funded product or a subscription-first business. 4ship may remain the underlying domain or a small attribution without being the public title. Naming and domain decisions remain open.

The owner's principles are **conservative, frugal, welcoming, explorative and refined**. Here, conservative means measured claims, restrained presentation and careful resource use. Respect attention, budget and existing equipment. Free attractions and useful unpaid recommendations are valuable even when they produce no direct commission.

The product should help a person make connections they might otherwise miss, without repeatedly interrupting them or turning every step into a purchase prompt.

## 2. Core experience: exploration without a chatbot

The interface is a cascading exploration surface, not a conversation transcript. A person enters through an event, anniversary, subject, topic, interest, photograph or place. Each selection reveals context and a few useful next choices. Choices may appear as embedded links, bottom-of-card bubbles, contextual actions or a short list of related discoveries.

Typical verbs: **Explore, Read more, See it here, Add to my journey, Check conditions, Plan a visit, Book with provider, Buy a print**. Expose only actions backed by a real destination or integration.

A persistent, editable journey connects the layers. Visitors save and remove things, change the order, choose dates and pace, and keep an export. A story saved for later reading is not necessarily a physical stop.

### Example A: an aviation journey

1. A first-flight anniversary introduces an aircraft.
2. The visitor follows development, Canadian selection, service, upgrades or replacement history.
3. They select a museum example, gate guard or relevant memorial.
4. The planner checks the selected place and date, rather than assuming the aircraft is present or the venue is open.
5. Photography notes, travel time and weather help refine the visit.
6. A relevant print or guide is offered when useful, without blocking the free experience.

### Example B: an adjacent interest

Several of the owner's friends independently visited Japan and rented nostalgic performance cars. This illustrates how a personal enthusiasm can shape a trip. A visitor interested in aviation may also want a dream-car experience or engineering museum. Offer a relevant side quest with a reason, then let the visitor decide.

Do not imply that the current Japan cards form a validated itinerary. Motegi, Hakone and a rental branch are not interchangeable or automatically nearby. Pickup location, driving eligibility, insurance, dates and rental restrictions require provider verification.

### Recommendation restraint

Offer a small number of understandable choices. Explain the relationship: shared aircraft, nearby place, compatible time, a saved interest, or an anniversary. Future controls should include “more like this”, “less of this”, “stay focused” and “surprise me”. A paid placement must not be disguised as neutral advice.

## 3. Current implementation versus intended product

| Area | Implemented in this source | Not yet implemented |
|---|---|---|
| Exploration | Nine curated records, explicit related IDs, cascading detail views, interest and region filters | Broad indexed catalogue, learned recommendations, editorial management |
| Journey | Browser-local add/remove/reorder, date, pace, export to text, browser print/PDF | Accounts, cross-device sync, shared trips, daily scheduling, route optimisation |
| Maps | OpenStreetMap embeds for two museum locations; external directions | Unified map, route distance/time calculation, plaque and gate-guard inventory |
| Anniversaries | On-demand Wikipedia date feed, transport-related filtering and selected-year arithmetic | Independently verified event database, weekly editorial production and scheduled publishing |
| Research | On-demand Internet Archive metadata search and Wikipedia background search | General-purpose autonomous research agent, search-engine API, own-photo search |
| Weather | Server-side MET Norway forecast for two fixed museum coordinates | Whole-route weather, custom locations, alert feeds, date-aware itinerary rescheduling |
| Closures | Fetch known official pages and flag limited English notice wording | Confirmed open/closed status, reliable multilingual extraction, operator feeds |
| Booking | Links to official information and an external rental operator | Reservations, payments, availability inventory, booking commissions |
| Products | Concept only | Print-on-demand, photo books, calendars, EPUB checkout, affiliate tag |
| ADS-B | Concept and a caution about sightings | Connected receiver/map, flight feed or event prediction |
| AI | None; explicit connections and ordinary application logic | Ollama or paid-model ranking/drafting |
| Editorial memory | Seed content in a TypeScript file | Source-backed claims, approvals, revisions, metrics and annual editions |

Keep these distinctions visible in development discussions. Do not rename a regex notice check “verified closures” or explicit related IDs “an autonomous AI agent”.

## 4. Visual and editorial direction

The visual model is an editorial field guide with useful planning controls. The primary activity appears immediately; avoid a large marketing hero that delays exploration.

| Token / choice | Current value | Rationale |
|---|---|---|
| Background | `#171d1c` | Comfortable dark graphite with a slight green cast |
| Panel | `#202725` | Quiet separation without bright dashboard tiles |
| Main text | `#edece4` | Soft stone-white against dark surfaces |
| Secondary text | `#a6afa6` | Secondary hierarchy; still requires contrast testing |
| Borders | `#39423c` | Subtle grouping |
| Accent | `#d5b877` | Muted yellow/gold for discovery and emphasis |
| Main action | `#c2cfae` | Restrained green for deliberate user actions |
| Information accent | `#9bbdca` | Blue for sources and weather |
| Display type | Libre Caslon Display | Editorial warmth and distinction |
| UI type | DM Sans | Readable controls and explanations |

Use forest green, brown, black, graphite, stone, grey and restrained yellow/blue. Avoid blinking banners, autoplay, manufactured scarcity, modal upsells, dense advertising and a chatbot that opens itself.

The desktop layout places discovery on the left and the journey/weather panel on the right. On small screens the columns stack. CSS breakpoints exist, but full browser, keyboard, screen-reader and enlarged-text QA remains a release gate. Small metadata sizes should be reviewed before broader launch.

Fonts currently load from Google Fonts. Self-hosting licensed font files would reduce third-party dependency and improve privacy/control. Photographs are local files, not remote hotlinks.

## 5. Existing source map

| File | Responsibility |
|---|---|
| `app/page.tsx` | Main client component: navigation, filters, trail, detail tabs, research results, date feed, journey, weather panel and export |
| `app/data.ts` | Curated seed records, `Place` type and `byId` lookup |
| `app/globals.css` | Palette, typography, layouts, responsive and print styles |
| `app/layout.tsx` | Document metadata and favicon |
| `app/api/discover/route.ts` | Live archive/background search and anniversary endpoint |
| `app/api/conditions/route.ts` | Allowlisted official-page fetch and MET Norway forecast |
| `public/images/` | Two attributed reusable photographs |
| `public/favicon.svg` | Custom compass mark |
| `package.json`, `package-lock.json` | Dependencies, scripts and reproducible version resolution |
| `vite.config.ts`, `build/`, `scripts/` | Vinext / Cloudflare / Sites integration and execution helpers |
| `.openai/hosting.json` | Existing Site identity; D1 and R2 are disabled |
| `components/`, `db/`, `examples/`, connector helpers | Retained starter capabilities; not evidence of active database, auth or connector use |

This is a React/TypeScript application using the Vinext starter and Cloudflare Worker-compatible output. The UI uses Lucide icons. There is no application-owned database, language-model service, secret API key or booking engine required for the current features.

Do not replace the dependency lockfile just to modernise the project during handoff. Several dependencies and files are unused starter material; simplify only after testing the build implications.

## 6. Current contracts and behaviour

### 6.1 Curated record

`Place` contains:

```ts
{
  id: string;
  title: string;
  label: string;
  region: string;
  description: string;
  body: string;
  tags: string[];
  links: string[];       // related record IDs
  source: string;        // primary external destination
  query: string;         // research search terms
  cost: string;          // wording, not a numeric price quote
  lat?: number;
  lon?: number;
  duration?: number;     // editorial visit estimate, minutes
  image?: string;
  credit?: string;
}
```

Despite its name, this type currently combines stories, places and experience leads. Refactor into distinct entities before expanding the catalogue. `links` provide explicit relationships, not distance calculations or learned relevance. `region` is a browsing label: an Ontario-tagged Hornet story is not a claim that the subject is exclusively in Ontario.

### 6.2 Journey persistence

Local storage key: `detour-plan-v1`.

```json
{"saved":["lancaster","warplane"],"date":"2026-10-10","pace":"Unhurried"}
```

Only recognised record IDs are loaded. Pace options are `Unhurried`, `A full day` and `Just browsing`. A missing date means flexible planning. There is no account or cross-device sync. Exports contain source links, suggested times and access caveats.

The current total sums suggested visit minutes only. Stories count as zero. Travel, queues and opening windows are excluded. A mixed Ontario/Japan collection triggers a warning, not a routed itinerary. Pace influences a simple overload warning; it does not perform scheduling.

### 6.3 Research API

`GET /api/discover?q=<text>`:

- Bounds text to 100 characters and strips a few query-control characters.
- Searches Internet Archive movies/texts, requesting up to five records.
- Searches Wikipedia, requesting up to four results.
- Runs the two requests concurrently with ten-second timeouts.
- Returns `{ results, partial, checkedAt }`; each result contains title, URL, type and optional year.
- Failures may produce partial or empty results. These are leads, not verified claims.

`GET /api/discover?day=MM-DD`:

- Fetches Wikipedia's on-this-day events feed.
- Filters event text for aviation, transport and exploration keywords; takes up to eight results.
- Returns `{ events, checkedAt }`, or an error with an empty array.
- The client computes selected year minus event year and highlights 5/10/20/25/50/75/100 years.

The date format check does not fully validate the calendar date. Future-year entries and negative anniversary counts need explicit handling. Keyword matching can miss relevant events or include irrelevant ones. No recurrence scheduler exists.

### 6.4 Conditions API

`GET /api/conditions?id=<curated-record-id>`:

- Rejects unknown IDs with HTTP 400.
- Fetches only the record's source URL and, where coordinates exist, MET Norway's compact location forecast.
- Uses a project-identifying User-Agent and nine-second request timeouts.
- Extracts up to 100 forecast time steps: timestamp, temperature, wind converted to km/h, weather symbol.
- Strips scripts/styles/HTML and looks for a few English phrases such as “temporarily closed”, “closure”, “cancelled” and “maintenance”.
- Returns at most two short notice snippets; these may be unrelated to the visit date.
- Always returns `access: "unconfirmed"`. A successful HTTP response is not proof of opening.
- Uses a 15-minute in-memory per-record cache and a short private response cache header.

Response includes `checkedAt`, `source`, `sourceFetched`, `access`, `notices`, `weather` and `weatherError`. Weather contains model update time and forecast points when available.

The current client picks the first forecast point for the chosen local date, not a visitor-selected time of day. With no chosen date it uses the first returned point. For a selected date outside the returned forecast it shows no forecast rather than inventing conditions. Motegi uses Asia/Tokyo; Hamilton uses America/Toronto. A refresh button may return the same cached data.

### 6.5 Navigation and source links

Detail selections can be entered using `?trail=<known-id>`. The full journey and full exploration history are not encoded into the URL. Current navigation is primarily client state, not separate indexable detail routes. Links open official sources, Internet Archive, Wikipedia, external maps or an external search page. General web search is a link, not a connected search API.

## 7. Why the first version uses rules instead of a model

The first useful task is connecting known, sourced items and helping the visitor arrange them. Explicit edges are cheap, explainable and repeatable. They require no inference server and cannot invent a museum because a model finds it plausible. The visitor gets a complete interaction even if external research fails.

AI is a future enrichment layer, not a prerequisite for basic browsing. Good candidate tasks include query expansion, tagging, duplicate detection, ranking, draft captions and concise explanations grounded in retrieved sources.

For a self-hosted option, evaluate a private Ollama service behind a small authenticated server-side adapter. Do not expose an unauthenticated local inference port or browser-side provider credentials. The current Cloudflare Worker cannot directly reach a machine on the owner's LAN; a controlled reachable service, private networking arrangement or migration of the backend is needed.

Use an interchangeable adapter rather than coding the UI around a model vendor:

```ts
interface ConnectionRanker {
  rank(input: {
    candidateIds: string[];
    interests: string[];
    rejectedIds: string[];
    constraints: unknown;
    evidence: unknown[];
  }): Promise<{ id: string; reason: string; evidenceIds: string[] }[]>;
}
```

Validate output IDs and schemas, reject unsupported facts, use timeouts, cap cost, and fall back to deterministic ranking. Retrieved pages are untrusted content, never instructions for the agent. The model must not approve its own claim, establish an absence of closures, purchase something, publish content or make a reservation without the appropriate explicit action.

“Self-hosted” is not automatically cheaper after electricity, hardware uptime and maintenance. Measure total operator effort. No provider price assumptions are embedded in this handoff.

## 8. Target data model: connect the right things

Separate an entity from a historical event, a place and a time-bound observation. This prevents a museum's ownership record from being treated as a live display guarantee, or an ADS-B sighting from becoming an airshow promise.

| Entity | Important fields / relationships |
|---|---|
| Subject | Aircraft type, theme, person, organisation, interest tags |
| Airframe / object | Identity, serial, aliases, historical operators, collection relationship |
| Event | Exact/approximate/disputed date, event type, subjects, source-backed claims |
| Place | Coordinates, access type, venue, public status, timezone, official sources |
| Observation | Subject/object, time, source, location, confidence, expiration |
| Claim | Text, source IDs, verification state, reviewer, verified time, valid-until |
| Media | Owner, provenance, licence, permitted uses, credit, linked entities |
| Connection | From/to, relationship type, reason, provenance, distance only if calculated |
| Journey | Ordered items, days, constraints, dates, user preferences, rejected suggestions |
| Content edition | Event ID, year/version, channel, draft, approval, published URL |
| Product / offer | Provider, product identity, availability source, disclosure, commercial relationship |
| Performance record | Edition/channel, impressions, clicks, onward actions, revenue, observation window |

Opening hours are recurring rules; a one-off closure is an override. Keep “last fetched”, “source published”, “last verified” and “valid for this date” separate. A source read today may describe an obsolete plan.

## 9. Autonomous editorial stream — future requirement

This is distinct from the visitor's on-demand exploration. The owner wants a background or manually triggered weekly production workflow, with human review before publishing.

1. Look ahead 7–14 days for routine anniversary content; scan further ahead for major anniversaries.
2. Calculate anniversary numbers. Use milestone years as a ranking signal, not an automatic publishing instruction.
3. Retrieve the owner's approved editions, captions, sources and photographs first.
4. Discover enrichment in Internet Archive, official sources and other approved collections.
5. Draft the card, article updates, social copy, media selections and related links.
6. Present a review batch with previous edition, highlighted changes, evidence, media rights and recommended disposition.
7. The owner approves, edits, defers or rejects.
8. Queue approved publications and measure results.
9. Next cycle, reuse the permanent event record and create another edition rather than duplicating the event.

A confirmed first-flight date can be stable. Retirement plans, opening hours, current operators, surviving airframes and future appearances need rechecking. A previously published article is editorial memory, not independent proof of every claim in it. Preserve the underlying evidence and all owner corrections.

Jobs must be idempotent: event + edition year + channel, or an equivalent stable key. Re-running a job should update its draft, not create duplicate posts. Include retry limits, review states and a publication audit trail.

Performance learning must distinguish weak topics from weak packaging or low distribution. Compare outcomes against exposure and editorial effort. Small samples remain inconclusive. Optimise for useful return visits, saved plans, referrals and modest net income, not indiscriminate output volume.

## 10. Freshness, live awareness and reliability

A production system needs provider-specific strategies, not one generic scrape:

- Weather: retrieve the right coordinates, timezone and forecast period; surface model age and out-of-range dates.
- Access: combine official hours, dated notices and exceptional closures. Prefer structured operator information where available. Page fetching alone is weak evidence.
- Events: separate scheduled appearance, confirmed participation and last-minute cancellation.
- Aircraft: distinguish collection ownership, public display, static location and live observation.
- Roads: obtain route-specific restrictions from an appropriate source before making route assurances.
- Booking: availability and price must come from the provider; link out until a real integration exists.

Use states such as `confirmed`, `unconfirmed`, `stale`, `conflicting` and `unavailable`, with clear user wording. Do not silently reuse stale data as live data. Define cache duration per source and persist retrieval/verification timestamps.

The current API has no distributed cache, rate limiting, concurrency control or full response-size cap. Its in-memory map resets across isolates. Those are launch-hardening tasks. Validate redirects if expanding source ingestion and protect against server-side request forgery when accepting any new URLs. Keep untrusted external text out of executable HTML.

## 11. Maps, spotting, ADS-B and planning

A useful map should join museum exhibits, original airframes, replicas, memorials, plaques, pedestal displays, gate guards, historic sites and documented lawful observation points. Use precise relationship labels. A point on a map does not grant access.

Spotting entries should include public access evidence, last verification, parking, view obstructions, photography restrictions and practical notes. Do not infer unrestricted access from an aerial image.

The owner's ADS-B system can later contribute time-stamped observations and contextual history. Position data is incomplete and can be delayed; it should not promise a flypast or encourage access to restricted ground. Feed permissions and update limits require review before integration.

A real planner needs travel time, visit duration, opening windows, user date/time, budget, interests and pace. Prefer useful explanations over invisible optimisation. Warn before geographically incompatible selections, but allow a long-term saved collection that is not a single trip.

## 12. Commerce and community

Potential optional streams: own-photo prints, print-on-demand books/calendars, digital field guides/EPUBs, relevant gear affiliate links, travel referrals and eventual booking partnerships. None is currently connected.

A visitor's selected interest should determine the recommendation. Affiliate availability should not determine whether they need an item. “Your current equipment is sufficient” is a valid and desirable answer. Disclose affiliate links and sponsored placement plainly.

Photo books must distinguish a curated book about visited places from a book of the visitor's own trip photographs. Upload, print resolution, cropping, proof approval, media rights and fulfilment errors need explicit workflows. Do not accept payment before a real fulfilment integration exists.

Measure useful unpaid outcomes—saved journeys, return visits, referrals and newsletter subscriptions—separately from revenue. Avoid valuing every engagement as money. Early commercial tests should be small enough for side-income economics.

## 13. Hosting, installation and portability

See `START-HERE.md` in the ZIP for practical commands. The package retains the exact dependency versions in the lockfile and the existing Site identity. That identity is not a secret and is not transferable account access. Do not deploy to the owner's existing project without authorised access.

The current output is Cloudflare Worker-oriented. A plain static upload cannot run `/api/discover` or `/api/conditions`. Conventional Node/VPS hosting requires a tested runtime adapter or a migration; do not assume stock Next.js deployment is interchangeable with the Vinext/Sites setup.

For a self-hosted redesign, a sensible small architecture is a web frontend plus a thin backend, SQLite for editorial/journey records, a background worker, object storage or filesystem-backed media, and an optional separate inference service. This is a proposed direction, not a delivered Docker stack. Avoid Kubernetes or a multi-service platform unless actual scale requires it.

No database is active in the current site. D1/R2 examples, auth helpers and connector scaffolding are present because the starter includes them. Public deployment outside Sites must independently assess authentication and privacy; owner-private access currently belongs to the hosting platform.

## 14. Verification and known gaps

Recorded during the original build on 3 October 2026:

- TypeScript check passed after fixing response typing.
- Production build passed.
- Direct handler checks returned 91 forecast points for Hamilton and a successful official-page fetch.
- Archive/background query for Lancaster returned nine combined results with no partial flag.
- The 3 October anniversary request returned three filtered events.
- Private deployment reported success.

These are point-in-time checks, not uptime guarantees or a full end-to-end test. No browser-based visual/interaction QA was completed. Provider behaviour in a deployed Worker may differ from a local test environment. Recheck both normal and failed responses before public release.

Known gaps worth addressing first:

1. Large client component should be split into tested exploration, planner, conditions and source components.
2. Query-string navigation does not provide SEO-ready, independently rendered pages; history/back-button behaviour needs work.
3. No complete multi-location route, geographic proximity engine or date/time scheduling.
4. Weather selects the first timestamp on a date, which may not represent visiting hours.
5. Closure detection is deliberately weak, English-only and date-insensitive; retain “unconfirmed”.
6. Anniversary feed is not a verified editorial dataset and has limited validation/filtering.
7. No per-user research quota, distributed cache or metrics.
8. Local storage is not durable account storage; no collaboration or consent-based analytics yet.
9. External fonts, map embeds and outgoing providers have privacy and availability implications.
10. Unused starter components/assets remain; remove only with build checks.
11. Production dependencies, framework maturity and third-party licences need developer review before committing to long-term hosting.

## 15. Suggested implementation order

### Phase 1 — stabilise this experience

Browser/mobile/accessibility QA, modular UI, predictable URL navigation, semantic record types, API validation, bounded fetching, structured errors, source timestamps and integration tests. Keep the same quiet visual direction.

Acceptance: the visitor can complete the exploration/save/reorder/export loop without a model; API outages do not destroy saved plans or fabricate conditions.

### Phase 2 — owned content and editorial memory

Import the owner's content and photo metadata, preserving identity and rights. Add an event/claim/source database, editorial review queue and revisions. Add indexable subject, place and watch pages where appropriate.

Acceptance: changing an approved event updates linked drafts while preserving previously published editions and reviewer corrections.

### Phase 3 — better maps and planning

Curate a manageable region. Add verified public places, meaningful relationships, route times, daily scheduling, access overrides and weather for actual visit periods.

Acceptance: a route is practical in time and geography, with unresolved access clearly flagged.

### Phase 4 — optional AI and background production

Add provider-independent ranking/drafting, model schema validation and deterministic fallback. Implement idempotent weekly draft batches and major-anniversary scouting. Human approval remains the default publication gate.

Acceptance: a failed or incorrect model response cannot create an unverified place, duplicate publication or unauthorised booking.

### Phase 5 — modest commerce and live enrichment

Connect one print/guide product path, disclosed affiliate links if desired, then the owner's ADS-B feed and carefully chosen travel referrals. Do not launch every revenue stream simultaneously.

Acceptance: real prices/availability, clear disclosures, actual fulfilment, and separate measurement of engagement versus contribution after costs.

## 16. Developer acceptance checklist

- [ ] Fresh install from the ZIP and locked dependencies succeeds.
- [ ] Type checking and Worker build pass on the chosen environment.
- [ ] Mobile, desktop, keyboard, 200% text and screen-reader checks pass.
- [ ] Empty/partial/error/stale research and weather states are understandable.
- [ ] Official-page failure cannot be interpreted as “open”.
- [ ] Forecast date, timezone and visit time align.
- [ ] Invalid dates, unknown IDs, duplicate saves and rapid navigation are handled.
- [ ] Export includes the user's selections, sources and unresolved checks.
- [ ] Rights and credits remain attached when media is reused.
- [ ] Existing Site identity is preserved only when intentionally updating that Site.
- [ ] No secrets enter client bundles or the repository.
- [ ] Product, booking and affiliate actions are backed by genuine integrations.
- [ ] Editorial automation cannot bypass the owner's chosen review gate.

## 17. Reference links and attribution

- MET Norway API: https://api.met.no/
- MET location forecast documentation: https://docs.api.met.no/doc/locationforecast/HowTO.html
- Internet Archive: https://archive.org/
- Archival film used as a lead: https://archive.org/details/612Magic1958
- Canadian Warplane Heritage: https://www.warplane.com/
- Honda Collection Hall: https://global.honda/jp/collection-hall/
- Rental research lead: https://www.omoren.com/en/
- OpenStreetMap: https://www.openstreetmap.org/
- Lancaster photo: https://commons.wikimedia.org/wiki/File:Avro_Lancaster_FM213_CWHM_p11.jpg — JustSomePics, CC BY-SA 4.0.
- Hakone photo: https://commons.wikimedia.org/wiki/File:Hakone_Skyline_Road_@_Panorama_@_Yamabushi_Pass_@_Hakone_(13776985624).jpg — Guilhem Vellut, CC BY 2.0.

The photographs are resized, cropped for display and toned with CSS. Preserve attribution and licence links; the Lancaster adaptation remains subject to CC BY-SA 4.0. Application ownership does not replace third-party media or dependency licences. These source links document the existing implementation and are not a fresh legal, pricing or provider-policy audit.
