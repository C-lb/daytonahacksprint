# Jorkmate

**Meet your next move.** A Hinge-inspired job matchmaker: complete one onboarding, then swipe
through roles. Swipe right and a simulated AI application agent assembles and "submits" the
application in the background while you keep browsing.

Frontend-only competition prototype. **Everything is simulated** — all ten job listings are
fictional, all companies are invented, and every submission ends at
**"Submitted · Demo mode"**. No backend, no database, no API keys, no scraping, no LLM calls.

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
npm run dev      # development server
npm run build    # production build (tsc + vite)
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

1. Open Jorkmate → **Try a demo profile** → select **Ari Tan**.
2. Scroll one job card to show the full listing lives on the card.
3. Swipe right on a suitable role → **"Application agent spawned"** toast.
4. Keep swiping while the agent works in the background.
5. Open **Activity** → watch the ten-stage timeline progress live.
6. (Optional) **Fast-forward demo** to complete instantly.
7. Open **Applications** → expand the card → show the generated package.
8. Point at **Submitted · Demo mode**.
9. Open **Highlights** → trending tech and finance roles, "View" boosts a job to the top of
   the deck.

## Limitations

- Demo data only: ten seeded jobs, three seeded personas.
- Résumé upload stores filename/size only — files are never read.
- "Submissions" never leave the browser.
