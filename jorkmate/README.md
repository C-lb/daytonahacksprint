# Jorkmate

**Meet your next move.** A Hinge-inspired job matchmaker: complete one onboarding, then swipe
through roles. Swipe right and an AI application agent assembles and submits the application
in the background while you keep browsing.

This React app is **the team frontend** for the jorkmate stack (supersedes plan Task 7's
vanilla PWA). It runs in two modes:

- **Live mode** — when the team server (`src/server.mjs`, port 3000) is up, the deck comes
  from `GET /api/deck` (real Workday listings via Oxylabs, Nosana match scores + blurbs),
  right-swipes go to `POST /api/swipe` (Daytona-sandboxed Playwright apply pipeline), résumé
  upload is parsed by Kimi via `POST /api/profile/resume`, and Applications polls
  `GET /api/applications` for real pipeline steps + screenshots.
- **Standalone demo mode** — no server: ten fictional listings, an in-browser agent
  simulator, and submissions that end at **"Submitted · Demo mode"**. The demo never
  depends on live pieces succeeding.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Framer Motion (swipe physics, transitions)
- Lucide React (icons)
- React Router (hash routing)
- React Context + `useReducer` for state
- `localStorage` for all persistence (versioned `jorkmate:v1:*` keys)
- Vitest + React Testing Library

## Run it

```bash
npm install
npm run dev      # development server (proxies /api → localhost:3000)
npm run build    # production build → repo-root web/ (served by src/server.mjs)
npm test         # vitest suite
```

## How the simulation works

- **Agent state machine** (`src/services/agentSimulator.ts`): each application stores a
  `startedAt` timestamp; the current stage is *derived* from elapsed time against fixed stage
  offsets (≈13 s total), so reloading the page recomputes the correct stage — no fragile
  `setTimeout` chains. Several agents run concurrently off one shared clock.
- **Application packages** (`src/services/applicationPackage.ts`): deterministic templates
  build a tailored résumé summary, cover note, standard answers, and screening answers from
  profile + job data only. Nothing is invented.
- **Sensitive-answer safeguard**: work authorisation, sponsorship, background-check consent,
  and submission consent are never inferred. A missing explicit answer stalls the agent at
  **Action required** until you answer in the Applications tab.
- **Matching** (`src/utils/matching.ts`): deterministic weighted overlap of
  category / location / work mode / employment type / skills.

## Resetting the demo

Profile → **Reset demo** clears every `jorkmate:v1:*` localStorage key and returns to the
welcome screen. (Or clear site data in devtools.)

## 60-second presentation flow

1. Open Jorkmate → **Try a demo profile** → select **Nadine Park** (the canonical demo
   candidate from `docs/superpowers/specs/2026-07-18-jorkmate-demo-profile.md`).
2. Scroll one job card to show the full listing lives on the card.
3. Swipe right on a suitable role → **"Application agent spawned"** toast.
4. Keep swiping while the agent works in the background.
5. Open **Applications** → watch the timeline progress live (real Daytona pipeline steps in
   live mode, the ten-stage simulator standalone).
6. (Optional standalone) **Fast-forward demo** to complete instantly.
7. Expand the card → show the generated package / pipeline steps + screenshot.
8. Point at **Submitted · Live** (or **Submitted · Demo mode** standalone).
9. Open **Highlights** → top roles ranked by match, "View" boosts a job to the top of the
   deck.

## Limitations

- Standalone mode: ten seeded fictional jobs, three seeded personas, submissions never
  leave the browser.
- Résumé upload stores filename/size only; in live mode the file text is sent to the team
  server for Kimi parsing (PDF text extraction is server-side work — plain-text résumés
  parse best from the browser).
- Live mode trusts the server contract in `docs/superpowers/plans/2026-07-18-jorkmate.md`;
  the sensitive-answer safeguard applies to the in-browser simulator only — the live
  pipeline reads `application_answers` from `data/profile.json` server-side.
