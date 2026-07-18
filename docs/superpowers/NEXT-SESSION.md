# jorkmate — resume notes & to-dos

Last updated: 2026-07-18. Read this first when picking the work back up.

## Where things stand

Backend (Tasks 1–6) is done, reviewed, and merged. Frontend (teammate's React app in
`jorkmate/`) is wired to it and demos end-to-end. Full explainer + per-sponsor table is at
the top of the root `README.md`. Design spec: `docs/superpowers/specs/2026-07-18-jorkmate-design.md`.
Implementation plan + progress ledger: `docs/superpowers/plans/2026-07-18-jorkmate.md`,
`.superpowers/sdd/progress.md` (gitignored, local only).

## Run it

```bash
npm install && cp .env.example .env      # fill sponsor keys
npm run serve                            # backend + PWA on http://localhost:3000
cd jorkmate && npm install && npm run build   # rebuild the UI into ../web after any jorkmate/ edit
```
Open `http://localhost:3000` on a phone or the iOS Simulator (`xcrun simctl boot "iPhone 17 Pro"`,
`open -a Simulator`, `xcrun simctl openurl booted http://localhost:3000`).
Break-glass demo with no live calls: `MOCK_MODE=1 npm run serve`.

## To-do (highest leverage first)

1. **Kimi — DECIDED: no direct key.** Kimi-via-ai& degenerates, so `reason(..., {kimi:true})`
   falls back to ai&'s default model automatically. Reasoning still works; it just isn't
   branded "Kimi". In the pitch, describe the reasoning leg as "Kimi (via the ai& gateway,
   with automatic failover)". No action needed. Affects `src/formfill.mjs`, `src/match.mjs`.
2. **Nosana GPU deployment** — match scores currently come from the ai& fallback, not a
   Nosana GPU. See the walkthrough below. Set `NOSANA_INFERENCE_URL` + `NOSANA_INFERENCE_MODEL`
   in `.env`, then `node -e "import('./src/match.mjs').then(m=>m.scoreAll())"` should log
   `via: nosana`. Affects `src/match.mjs`.

   ### Nosana deployment walkthrough
   The code already speaks OpenAI-compatible chat (`src/match.mjs` → `chat({base,key,model})`
   → `POST <base>/chat/completions`). All it needs is a URL to an LLM server running on a
   Nosana GPU.
   1. **Fund the wallet.** The Nosana dashboard wallet needs SOL (gas) + NOS (pays for GPU
      time). Without balance the job never schedules.
   2. **Deploy an OpenAI-compatible LLM.** On the dashboard (or `@nosana/cli`), launch a GPU
      job from a template that serves an OpenAI API — vLLM or Ollama serving a small model
      (Llama 3 8B, Qwen2.5 7B, etc). Nosana's job market has ready templates; pick one that
      exposes `/v1/chat/completions` and note the model name it serves.
   3. **Grab the deployment's service URL.** Once running, the job exposes its own endpoint
      (e.g. `https://<id>.node.k8s.prd.nos.ci`). The OpenAI base is that URL, usually with a
      `/v1` suffix.
   4. **Set `.env`:**
      ```
      NOSANA_INFERENCE_URL=https://<your-deployment>/v1
      NOSANA_INFERENCE_MODEL=<model the server serves, e.g. llama3>
      # NOSANA_API_KEY only if the deployment enforces one; per-deployment vLLM usually ignores it
      ```
   5. **Verify:** `node -e "import('./src/match.mjs').then(m=>m.scoreAll())"` → each line
      should print `via: nosana` (not `fallback`). If it prints `fallback`, the URL is
      unreachable or not OpenAI-shaped — curl `<url>/models` to confirm the server is up.
   Exact dashboard labels shift; the Swagger at `https://dashboard.k8s.prd.nos.ci/api/swagger`
   and Nosana docs are the source of truth for the current deploy flow.
3. **Oxylabs live scrape** — Workday bot-blocks the residential-proxy exit IPs (303 →
   maintenance page), so `/api/scrape` returns 0 and the deck runs on seeds. Switch
   `src/scrape.mjs` to the Oxylabs Web Scraper API over 443 (README gotcha).
4. **Daytona real submission** — sandbox spins up and runs Playwright but Workday resets
   the connection from the sandbox's un-proxied egress (`ERR_CONNECTION_RESET`), so it
   reaches "opening posting" then fails. Selectors past `page.goto` in `src/apply_script.py`
   are unverified against a live Workday DOM. Options: route sandbox egress through a
   residential proxy, or rehearse against a Workday tenant that doesn't block. Keep
   `APPLY_SUBMIT` unset until a rehearsed real target is confirmed.
5. **Persona ↔ backend parity (minor)** — frontend `jorkmate/src/data/personas.ts` leads
   with Nadine Park (canonical, matches backend `data/profile.json`). Ari/Daniel are extra
   demo personas. Fine as-is; only revisit if the demo should show a single persona.

## Gotchas that already bit us

- **Stale bundle:** the browser/Simulator caches `index.html`. Fixed server-side with
  `no-store` on HTML (`src/server.mjs`), but if a device still looks stale, hard-reload or
  reopen the URL. Always `npm run build` in `jorkmate/` after editing frontend files.
- **Shared `main`:** everyone pushes to `main`; pull-rebase before editing (there are
  UserPromptSubmit + Stop git-sync hooks in `.claude/settings.local.json`).
- **ai& needs a browser User-Agent** (Cloudflare 1010). Handled in `src/sponsors.mjs`.

## Demo runbook (2-min, ~110s)

1. Seeded Nadine profile loaded; "Kimi read my resume."
2. Swipe the deck; call out the Nosana match scores + blurbs.
3. Right-swipe the rehearsed job → Applications tab shows `Live · Daytona` → live steps.
4. Close on the sponsor-loop diagram. If the network fights you: `MOCK_MODE=1`.
