# Worth the Detour

An independent exploration page for 4ship. Working title; no paid AI dependency.

## What works
- Curated topic graph, interest and regional filtering, branching detail pages.
- A device-local saved journey: add/remove/reorder, pace, date, export and print.
- Live Internet Archive and Wikipedia research, including anniversary discovery.
- Server-side MET Norway forecast queries, attributed and cached for 15 minutes.
- Official-page retrieval and limited notice-wording detection. Opening/closure status is always unconfirmed. No notice detector can establish safety, opening hours or absence of disruption.
- Official booking/source links; no transactions or affiliate tracking.

## Running and hosting
This repository uses the Sites Vinext starter (React, Vite, Cloudflare Worker). Run `npm ci` then `npm run dev` for local development; `npm run build` creates the Worker output. The full source is portable. A Node hosting adapter would be required for a conventional Node server; this build is Worker-oriented. No external AI subscription or database is required. Hosting, network traffic and third-party usage policies still apply.

Optional next layer: a private Ollama-backed service can rank a constrained set of candidate IDs or draft explanations. Keep credentials server-side and validate all returned IDs. An LLM must not turn unverified source text into confirmed closures or bookings. The current site deliberately makes no model calls.

## Data and reliability
Curated records are in `app/data.ts`. Each record has a stable ID, source, region, interests and explicit related IDs. Only mapped museum records have coordinates. The Japan car experience is a lead, not a geocoded booking or validated route. Times are editorial planning estimates, excluding travel.

`/api/discover` queries Internet Archive and Wikipedia with bounded timeouts. Search results are research leads, never certified facts. Wikipedia date text is attributed in the UI. A future editorial workflow should verify dates against primary sources before publication.

`/api/conditions` only fetches allowlisted record URLs, not arbitrary user URLs. Weather is from MET Norway locationforecast (CC BY 4.0). Requests identify this project, use a 15-minute per-instance cache, and show failures. The cache is best-effort and resets across Worker isolates. Higher traffic should use a shared cache, rate limits and provider-policy review. Live research/notice fetches can be blocked by publishers; official links remain accessible.

Journey storage is browser-local and not a cross-device account. Export before clearing site data. No automatic bookings, payments, geolocation or publishing occurs.

## Not yet connected
Personal photo archive, ADS-B feed, affiliate tag, print-on-demand fulfilment, checkout and free-form worldwide route optimisation. No placeholder prices, fake availability, live aircraft, or invented testimonials are shown.

## Images
Lancaster: JustSomePics, Wikimedia Commons, CC BY-SA 4.0. Hakone: Guilhem Vellut, Wikimedia Commons, CC BY 2.0. Original source and licence links are in the site's Our approach page. Cropping/toning disclosed; Lancaster adaptation remains CC BY-SA 4.0.
