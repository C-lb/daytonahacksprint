# jorkmate — design spec

**Date:** 2026-07-18 · **Event:** Daytona HackSprint Singapore 2026 · **Demo limit:** 2 minutes

Hinge for jobs. Swipe right on a Workday job posting → an agent applies for real with your
prefilled profile. Swipe left to skip. Onboarding builds your profile from a resume upload
and industry picks.

## Decisions (locked)

| Question | Decision |
|---|---|
| Apply depth | **Real submission** via Daytona-sandboxed browser agent |
| Job sourcing | **Pre-scraped cache + one live Oxylabs scrape on stage** |
| Form factor | **Mobile web app / PWA**, iOS-native styling, demoed on a real iPhone over LAN |
| Profile scope | **Resume PDF + basics + industry picks**; Kimi parses resume into structured profile |
| Matching | **Per-card match score + blurb from a Nosana-deployed open model** |
| Apply UX | Swipe continues instantly, toast "agent applying…"; **live agent bottom sheet is stretch scope** — core flow is background apply → status in Applications tab |

## Sponsor mapping (judging: coordination of Daytona + Kimi + Nosana)

```
iPhone (PWA)  ──HTTP/SSE──▶  Node server (laptop)
                                 │
   ┌─────────────┬───────────────┼─────────────────┬──────────────┐
   ▼             ▼               ▼                 ▼              ▼
Oxylabs      Kimi (direct)   Daytona sandbox   Nosana GPU      ai&
scrape        resume parse    Playwright        small LLM       fallback for
Workday       + form-answer   apply agent       match scores    any LLM call
career sites  generation      (screenshots      + match blurb   (rotate on
              (big budget)     streamed back)                    402/429)
```

- **Oxylabs (ingest):** `scrape.mjs` run pre-demo fills `data/jobs.json` from 3–5 real
  Workday career sites. In-app refresh button triggers one live scrape on stage.
- **Kimi (reason):** direct Moonshot key, named on stage. Parses uploaded resume once at
  onboarding; per-apply, maps profile → the target Workday form's fields, including
  screening-question answers (honest but favorable). Large `max_tokens` (heavy reasoner —
  see README gotchas).
- **Daytona (execute):** per right-swipe, spin a sandbox running a Playwright script that
  walks the real Workday apply flow with the field map + resume file, screenshotting each
  step and emitting progress events.
- **Nosana (compute):** GPU deployment serving a small open model (Llama/Qwen class) that
  scores profile↔job compatibility (0–100 + one-line "why you two match" blurb) for every
  card, batch, at scrape/onboarding time.
- **ai& :** automatic LLM fallback (browser UA required — Cloudflare 1010 gotcha).

## Architecture

Single Node server (`src/server.mjs`, Express) that:
1. serves the PWA as static files (`web/`)
2. exposes the JSON API below
3. orchestrates sponsors by importing the existing `src/sponsors.mjs`
4. streams agent progress over SSE

Frontend: single-page vanilla app — hand-rolled Pointer Events swipe gestures, no build
step. Styling per **anti-vibecode** (applied at build time; UI mockups from the team are
incoming and take precedence on visual detail, reconciled with anti-vibecode). Safe-area
insets (`env(safe-area-inset-*)`) for dynamic island / home bar.

Storage: three JSON files, no DB — `data/profile.json`, `data/jobs.json`,
`data/applications.json`.

## Screens

1. **Onboarding** (first launch): name/email/phone → industry multi-pick chips → resume
   PDF upload → "Kimi is reading your resume…" progress → parsed profile confirmation
   screen (editable fields).
2. **Deck** (tab 1): full-bleed job cards — company, role, location, salary if scraped,
   match score badge + Nosana blurb. Right = apply (APPLIED stamp), left = skip (PASS
   stamp), rubber-band physics, undo snackbar on left-swipe.
3. **Highlights** (tab 2): horizontal carousel of curated top jobs for the user —
   highlighted cards ranked by Nosana match score (top N of the deck). Tapping a card
   opens it for swipe/apply.
4. **Applications** (tab 3): active applications/review processes with status chips
   `queued / applying / submitted / failed`; tap → final screenshot; failed → retry.
5. **Profile** (tab 4): edit basics/industries and everything that gets prefilled into
   applications; re-upload/re-parse resume.

Tab bar (4 icons): **Deck · Highlights · Applications · Profile**.

**Stretch (time-permitting) — live agent view:** bottom sheet from tapping the
"agent applying…" toast — streamed Daytona screenshots + step log. Core scope ships
background apply with status tracking only; the SSE stream endpoint stays in the API so
the sheet can be added without server changes.

## API

| Route | Behavior |
|---|---|
| `POST /api/profile` | save basics + industries |
| `POST /api/profile/resume` | PDF upload → Kimi parse → structured profile `{work_history[], education[], skills[], summary}` returned for confirmation |
| `GET /api/deck` | jobs filtered by industry, each with cached `match: {score, blurb}` |
| `POST /api/scrape` | on-stage live Oxylabs scrape → new jobs Nosana-scored → appended |
| `POST /api/swipe` | `{jobId, direction}`; right → create `queued` application, kick off apply pipeline async, return immediately |
| `GET /api/applications` | list with statuses |
| `GET /api/apply/:id/stream` | SSE `{step, message, screenshot?}`; replays buffered events on late connect |

Match scores are computed **batch at ingest time** and cached on the job record — never
per-swipe — so cards render instantly.

## Apply pipeline (per right-swipe)

1. **Kimi:** scraped form structure + profile → JSON field→value map.
2. **Daytona:** sandbox → Playwright script gets field map + resume file → navigates the
   real Workday flow (apply-as-guest or account create, autofill, resume upload, submit)
   → screenshots each step → emits events.
3. **Server:** relays events to SSE, updates `applications.json`, tears down sandbox.

Feasibility note: Workday renders with consistent `data-automation-id` attributes across
tenants — the Playwright script targets those, which is what makes a generic apply agent
possible in a day.

## Error handling

- All LLM calls through the existing rotate-on-402/429 helpers; Kimi → ai& fallback
  (browser UA on ai&).
- Apply failure (selector miss, tenant variant, CAPTCHA) → status `failed` + last
  screenshot + retry button. Demo only right-swipes rehearsed companies.
- Nosana scoring failure → card renders without score badge; deck never blocks.
- Live scrape failure on venue wifi → deck already full from cache; narrate and move on.
- SSE disconnect → "reconnecting…", events replay from buffer.

## Demo script (~110s)

1. (10s) Profile exists; "Kimi read my resume."
2. (15s) Tap refresh → live Oxylabs scrape lands new cards.
3. (20s) Swipe deck; show Highlights carousel; call out Nosana match scores.
4. (45s) Right-swipe rehearsed job → Applications tab shows `applying` → step screenshots
   land → **Submitted ✓**. (If the stretch live-agent sheet ships, tap the toast and
   watch the Daytona feed instead.)
5. (20s) Final confirmation screenshot; close on the sponsor-loop diagram.

## Testing

Smoke-level only: `src/smoke.mjs` for keys + one rehearsed end-to-end apply against a
chosen real posting. The judging artifact is the working loop, not a test suite.

## Out of scope (YAGNI)

Accounts/multi-user, push notifications, real matching ML, application tracking beyond
status chips, Android styling, deployment anywhere but the demo laptop.
