# Phase 1 — stabilise the first experience

Status as of 3 October 2026, against section 15 ("Phase 1") and the known gaps in section 14 of the [developer spec](handoff/Worth-the-Detour-Developer-Spec.md).

**Acceptance:** the visitor can complete the explore → save → reorder → export loop without a model. API outages do not destroy saved plans or fabricate conditions. Both are covered by the browser checks listed below.

## Done

| Spec item | What changed |
|---|---|
| Modular UI (gap 1) | `app/page.tsx` is now a server entry. The UI is split into view, panel and hook modules under `app/_components/`, with framework-free logic in `lib/detour/`. |
| Predictable URL navigation (gap 2) | Every view has a real, shareable URL (`?trail=a,b`, `?view=day&on=…`, `?view=places`, `?view=about`, `?research=…`). Links are real anchors. The back button works. The server renders the requested view and sets its title. Old `?trail=<id>` links still work. Detail pages are not yet separate path routes (Phase 2: indexable subject and place pages). |
| Semantic record types | Records are a `story` / `place` / `experience` union. Places carry their own time zone, zone label and location note. Image alt text, credit and licence live with the record. |
| API validation | Real calendar validation for `MM-DD` and `YYYY-MM-DD`. Queries reduced to plain search terms. Conditions accept only mapped place IDs. |
| Bounded fetching | Total timeouts, response-size caps, content-type checks, and redirects followed manually and checked against a host allowlist on every hop. |
| Structured errors | One error shape (`{ error: { code, message } }`). 400 for invalid input, 502 for an unavailable upstream. Per-source status for research. |
| Source timestamps | `checkedAt`, forecast model `updatedAt`, retrieval `fetchedAt` and a `cached` flag. A forecast reused after a failed refresh is labelled `stale`, never shown as current. |
| Weather for the visit (gap 4) | The forecast is the point nearest the chosen time of day (morning / midday / afternoon / evening) on the chosen local date, in the place's time zone. Past dates and dates beyond the forecast are reported as such. |
| Anniversaries (gap 6, partly) | Future and same-year events no longer show negative counts. BCE years are handled. Milestones are ranked first. The keyword filter uses word boundaries ("Carter" no longer matches "car"). The feed is still not a verified editorial dataset. |
| Journey resilience | Corrupt storage no longer disables saving. Duplicates and unknown IDs are dropped. Saves are capped at 50. The journey syncs across tabs and falls back to the current session when storage is blocked. The export lists sources and the checks still outstanding for every item. |
| Accessibility | Skip link. `aria-current` navigation. Accessible tabs with arrow/Home/End keys. Focus moves to the new heading after navigation and to the planner after a removal. Live-region announcements for reorder and remove. Reduced-motion support. Corrected image alt text. Smallest metadata text raised from 12px to 13px. |
| Integration tests | 102 Vitest tests: data integrity, date/anniversary/journey/navigation/weather logic, notice extraction, bounded fetching, both API routes with mocked upstreams (success, partial, outage, redirect, size cap, timeout, cache and stale fallback). |
| CI | GitHub Actions runs lint, type check, tests and the Worker build. |

## Browser checks performed

Chromium via Playwright against `npm run dev`, with fixture API responses and again with every upstream unreachable:

- desktop 1440px, mobile 390px, 320px, and a 640px viewport at 2× scale as the 200%-zoom equivalent — no horizontal scrolling;
- first Tab reaches the skip link; tab keyboard navigation; focus after navigation, credits link and removal;
- save → reorder → date/visit time → export → remove → reload persistence; blocked-storage fallback;
- back button across views; date change updates the URL; document title follows navigation;
- offline: no forecast invented, access stays unconfirmed, research and anniversary errors explained;
- no console errors or hydration warnings (other than third-party fonts and map tiles blocked by the sandbox network).

Live calls to MET Norway, Wikipedia, Internet Archive and the museum sites were **not** exercised: the build environment's network policy blocks those hosts. Recheck the deployed Worker against real providers before public release.

## Still open from Phase 1 / known gaps

- Screen-reader pass with real assistive technology (VoiceOver/NVDA). Only automated and keyboard checks were done.
- Rate limiting, a shared cache and per-user research quotas (gap 7): caches are per isolate and bounded in size.
- Self-hosting fonts and an opt-in for the third-party map embed (gap 9).
- Removing unused starter components and dependencies (gap 10) — deliberately left until build implications are reviewed.
- Closure detection remains English-only, date-insensitive and labelled unconfirmed (gap 5).
- No multi-location routing, proximity engine or daily scheduling (gap 3) — Phase 3.
