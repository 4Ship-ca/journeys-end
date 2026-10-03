# Worth the Detour

An independent exploration page for 4ship. Working title; no paid AI dependency.

The product intent, data model and roadmap are in [`docs/handoff/Worth-the-Detour-Developer-Spec.md`](docs/handoff/Worth-the-Detour-Developer-Spec.md). Phase 1 progress is tracked in [`docs/phase-1.md`](docs/phase-1.md).

## What works
- Curated topic graph with typed records (story, place, experience), interest and regional filtering, and branching detail pages with a plain reason for each connection.
- Shareable URLs for every view: `/?trail=lancaster,warplane`, `/?view=day&on=2026-10-03`, `/?view=places`, `/?view=about` and `/?research=jet+age`. The page renders on the server from the query string; the back button works.
- A device-local saved journey: add/remove/reorder, date, pace, visit time, export and print. It stays in sync across tabs and still works for the session if the browser refuses storage.
- Live Internet Archive and Wikipedia research, and anniversary discovery with milestone ranking (5/10/20/25/50/75/100 years).
- Server-side MET Norway forecast for the visitor's chosen date and time of day, in the place's own time zone. A failed refresh may show an earlier forecast, labelled stale.
- Official-page retrieval and limited notice-wording detection. Opening/closure status is always unconfirmed. No notice detector can establish safety, opening hours or absence of disruption.
- Official booking/source links; no transactions or affiliate tracking.

## Development
Node 22.13 or later and npm.

```sh
npm ci
npm run dev        # http://localhost:5173
npm run lint
npm run typecheck
npm test           # vitest: logic, data integrity and API route tests with mocked upstreams
npm run test:live  # opt-in: the API routes against the real providers (needs network access)
npm run build      # Worker output in dist/
```

`npm run test:live` calls MET Norway, Wikipedia, Internet Archive and the museum pages for real. It is not part of CI. Behind an HTTPS proxy, run it as `NODE_USE_ENV_PROXY=1 npm run test:live`; add `NODE_EXTRA_CA_CERTS=<bundle>` if the proxy re-signs TLS.

CI runs the same checks on every push and pull request (`.github/workflows/ci.yml`).

## Source map

| Path | Responsibility |
|---|---|
| `app/page.tsx` | Server entry: reads the query string, sets page metadata, renders the client app |
| `app/_components/detour.tsx` | Client shell: navigation state, views, journey and conditions wiring |
| `app/_components/*-view.tsx` | Explore, detail, places, on-this-day and about views |
| `app/_components/journey-planner.tsx`, `conditions-panel.tsx`, `research-panel.tsx` | Planner, live conditions and research panels |
| `app/_components/hooks.ts` | URL state, journey storage, remote JSON and toast hooks |
| `app/data.ts` | Curated records, typed by kind, plus lookup helpers |
| `app/api/discover/route.ts` | Research search and anniversary feed |
| `app/api/conditions/route.ts` | Forecast and cautious notice checks for mapped places |
| `lib/detour/` | Framework-free logic: dates, anniversaries, journey, navigation, weather, API shapes |
| `lib/detour/server/` | Bounded upstream fetching, caching, notice extraction, response helpers |
| `tests/` | Vitest suites and fixtures |

## Running and hosting
This repository uses the Sites Vinext starter (React, Vite, Cloudflare Worker). `npm run build` creates the Worker output. A Node hosting adapter would be required for a conventional Node server; this build is Worker-oriented. No external AI subscription or database is required. Hosting, network traffic and third-party usage policies still apply.

Optional next layer: a private Ollama-backed service can rank a constrained set of candidate IDs or draft explanations. Keep credentials server-side and validate all returned IDs. An LLM must not turn unverified source text into confirmed closures or bookings. The current site deliberately makes no model calls.

## Data and reliability
Curated records are in `app/data.ts`. Each record has a stable ID, a kind, source, region, interests and explicit related IDs. Only `place` records have coordinates and time zones. The Japan car experience is a lead, not a geocoded booking or validated route. Times are editorial planning estimates, excluding travel.

API errors use one shape: `{ "error": { "code": "...", "message": "..." }, "checkedAt": "..." }`. Invalid input returns 400; a fully unavailable upstream returns 502.

`/api/discover?q=` queries Internet Archive and Wikipedia; `/api/discover?day=MM-DD` reads Wikipedia's on-this-day feed. Search results are research leads, never certified facts. A future editorial workflow should verify dates against primary sources before publication.

`/api/conditions?id=` only accepts mapped place IDs and only fetches that record's own source URL. Every upstream request has a total timeout, a response-size cap and redirects checked hop by hop against a host allowlist. Weather is from MET Norway locationforecast (CC BY 4.0). Requests identify this project and use a 15-minute per-instance cache. The cache is best-effort and resets across Worker isolates. Higher traffic should use a shared cache, rate limits and provider-policy review.

Journey storage is browser-local (`detour-plan-v1`) and not a cross-device account. Export before clearing site data. No automatic bookings, payments, geolocation or publishing occurs.

## Not yet connected
Personal photo archive, ADS-B feed, affiliate tag, print-on-demand fulfilment, checkout and free-form worldwide route optimisation. No placeholder prices, fake availability, live aircraft, or invented testimonials are shown.

## Images
Lancaster: JustSomePics, Wikimedia Commons, CC BY-SA 4.0. Hakone: Guilhem Vellut, Wikimedia Commons, CC BY 2.0. Original source and licence links are in the site's Our approach page. Cropping/toning disclosed; Lancaster adaptation remains CC BY-SA 4.0.
