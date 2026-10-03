# Developer handoff — start here

Read `Worth-the-Detour-Developer-Spec.md` first. The application is in `source/`.

## Baseline

Source commit: `7ba15f5a1b164f3945f807e228a9278006142932`.
Export date: 3 October 2026.
The original site is private; having its URL or project ID does not grant access.

## Install and run

Use a current Node version compatible with `package.json` (the declared minimum is 22.13.0; the original build ran on Node 24.19.0) and npm. From `source/`:

```sh
npm ci
npm run dev
```

The portable development path defaults to port 5173. Open the address printed by the dev server. Avoid the environment-specific `install:ci` helper unless you are intentionally using the original managed environment. Standard `npm ci` installs from the included lockfile.

Checks and build:

```sh
npx tsc --noEmit
npm run build
```

The original build emits Worker-compatible output under `dist/`. `npm run start` runs Wrangler locally using the generated configuration; it is not a generic production Node server command. Local build/run on your machine still needs verification; this export was integrity-checked, not freshly installed on every platform.

## Hosting decisions

- Existing Site: retain `.openai/hosting.json` and coordinate deployment with the owner through the Sites workflow.
- Separate Cloudflare deployment: review generated configuration, Sites middleware and host authentication, then use your own account and deployment configuration. Do not reuse the owner's project as a new deployment target without authorisation.
- VPS / conventional Node: choose and test a compatible adapter, or migrate the small application to a conventional frontend/backend setup. A static-only host cannot execute the two API routes.

No paid LLM, application database or API key is needed for the current features. External source access and ordinary hosting are still dependencies. No inference service, Docker deployment, payment integration or photo catalogue is included.

## Contents and exclusions

All tracked source files from the baseline are included except generated `tsconfig.tsbuildinfo`. The existing non-secret hosting identity is retained for provenance. The ZIP excludes `.git`, `node_modules`, generated `dist`, framework caches, local runtime state, logs and credentials. No local environment files are included.

Starter components, connector helpers, database examples and unused SVGs are retained intentionally to avoid silently changing the application during handoff. Their presence does not mean these capabilities are configured.

`FILE-MANIFEST.json` gives byte counts and SHA-256 checksums for the packaged files, excluding itself. Use it to verify transfer integrity. The Markdown spec is also supplied separately for convenient review.

## Start with these files

- `source/app/page.tsx`: experience and planner UI.
- `source/app/data.ts`: curated connections and source URLs.
- `source/app/api/discover/route.ts`: archive/background/anniversary research.
- `source/app/api/conditions/route.ts`: forecast and cautious notice checks.
- `source/app/globals.css`: visual system and responsive layout.

## Important boundaries

Do not describe closure checks as verified opening status. Do not describe the current rules as autonomous AI. Saved journeys are device-local. Suggested visit durations exclude travel. Booking links are referrals out, not reservations. Keep image credits and licences intact.
