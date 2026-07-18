# daytonahacksprint

Team project for the **Daytona HackSprint Singapore 2026** (AI Builders x Daytona, NUS, 18 Jul 2026).

## The agentic loop we're building on
```
Oxylabs (ingest) → Kimi (reason) → Daytona (execute) → Nosana + ai& (compute)
```
Prize judging weighs **Sponsor Integration = coordination of Daytona + Kimi AI + Nosana**, plus Completeness (ship an MVP), Innovation, and Problem Solving. Demo is a **2-minute hard limit** and must show working code running inside the integrated stack.

---

## What we built: jorkmate

**Hinge, but for jobs.** You swipe right on a real job posting and an AI agent applies for you with your details prefilled. Swipe left to skip.

### The 30-second pitch
1. You set up a profile once (or load a demo one). A resume gets read into structured data.
2. You get a deck of job cards, each with a **compatibility score** and a one-line "why you match".
3. **Swipe right** and an agent spins up a real cloud browser, walks the job's application form, fills it with your details, and submits. You keep swiping while it works.
4. The **Applications** tab shows each agent's live progress.

### How each sponsor is used (one line each)
| Sponsor | Role in jorkmate | Where |
|---|---|---|
| **Oxylabs** | Scrapes live job postings from real Workday career sites (through a residential proxy) to fill the deck | `src/scrape.mjs` |
| **Kimi** | Reads the resume into structured fields, then writes the answers for each application form | `src/formfill.mjs` |
| **Nosana** | Runs the open-model that scores each job's fit and writes the "why you match" blurb | `src/match.mjs` |
| **Daytona** | Spins up a sandboxed cloud browser that actually fills and submits the Workday application | `src/apply.mjs` |
| **ai&** | Backs every LLM call so nothing stalls if one provider hiccups | `src/sponsors.mjs` |

### The loop, in order
```
Oxylabs → deck of real jobs
   ↓
Nosana → score + match blurb on each card      (swipe right on one)
   ↓
Kimi → resume → form answers for that job
   ↓
Daytona → cloud browser fills + submits the application, streaming progress back
```
All five run behind one small Node server (`src/server.mjs`) that the phone app talks to.

### Run it for the demo
```bash
npm install
cp .env.example .env          # fill in sponsor keys
npm run serve                 # backend + app on http://localhost:3000
cd jorkmate && npm install && npm run build   # build the phone UI (served by the backend)
```
Open `http://localhost:3000` on a phone (or the iOS Simulator) → **Try a demo profile** → swipe.

**Break-glass fallback:** `MOCK_MODE=1 npm run serve` runs the whole flow with canned data (no live sponsor calls) so the demo never depends on the venue network.

### Status: what's fully live vs on fallback

Everything degrades gracefully, so the demo never breaks. But some legs run on a fallback rather than their true sponsor path today:

| Leg | Now | To make it fully live |
|---|---|---|
| **Kimi** | ai& gateway serves the reasoning (Kimi-via-ai& degenerates, auto-fails-over). Decided: no direct key | Would need a direct Moonshot `KIMI_API_KEY`. Not planned |
| **Nosana** | Match scores via ai& fallback | Deploy a GPU LLM, set `NOSANA_INFERENCE_URL` + `NOSANA_INFERENCE_MODEL` (steps below) |
| **Oxylabs** | Deck runs on pre-scraped seeds; live `/api/scrape` is Workday-bot-blocked on the proxy IPs | Use the Oxylabs Web Scraper API over 443 instead of the raw residential proxy |
| **Daytona** | Sandbox spins up + runs the browser, but Workday resets the sandbox's un-proxied egress mid-flow | Route sandbox egress through a residential proxy, or target a Workday tenant that doesn't block. Keep `APPLY_SUBMIT` unset until a real target is rehearsed |

None of these are code-blocked — the paths exist and switch on the moment the external piece is in place.

#### Making Nosana live
The code already speaks OpenAI-compatible chat, so it just needs a URL to an LLM server on a Nosana GPU:
1. **Fund the wallet** — the Nosana dashboard wallet needs SOL (gas) + NOS (GPU time), or the job never schedules.
2. **Deploy an OpenAI-compatible LLM** — via the dashboard or `@nosana/cli`, launch a GPU job from a template that serves the OpenAI API (vLLM or Ollama running a small model like Llama 3 8B or Qwen2.5 7B). Note the model name it serves.
3. **Grab the service URL** — the running job exposes its own endpoint (e.g. `https://<id>.node.k8s.prd.nos.ci`); the OpenAI base is that URL, usually plus `/v1`.
4. **Set `.env`:**
   ```
   NOSANA_INFERENCE_URL=https://<your-deployment>/v1
   NOSANA_INFERENCE_MODEL=<model the server serves, e.g. llama3>
   ```
5. **Verify:** `node -e "import('./src/match.mjs').then(m=>m.scoreAll())"` should print `via: nosana` (not `fallback`) for each job. If it says `fallback`, the URL is unreachable or not OpenAI-shaped.

Swagger for the current deploy flow: `https://dashboard.k8s.prd.nos.ci/api/swagger`.

---

## Setup
```bash
git clone https://github.com/C-lb/daytonahacksprint
cd daytonahacksprint
npm install                 # (once we add deps)
cp .env.example .env        # then fill in YOUR OWN keys
node src/smoke.mjs          # verify your keys reach every sponsor
```
`.env` is gitignored. **Never commit real keys.** Each collaborator uses their own.

## Sponsor endpoints (verified working)
| Sponsor | Base URL | Notes |
|---|---|---|
| ai& | `https://api.aiand.com/v1` | OpenAI-compatible; also `/v1/messages` (Anthropic). Serves Kimi, GLM, DeepSeek, Qwen, Gemma, GPT-OSS |
| Kimi | `https://api.moonshot.ai/v1` | OpenAI-compatible; use a **direct** key for judging |
| Daytona | `https://app.daytona.io/api` | Bearer key; sandbox runtime + MCP server |
| Nosana | `https://dashboard.k8s.prd.nos.ci/api` | Bearer key; job/deployment API, needs SOL/NOS in vault. Swagger at `/api/swagger` |
| Oxylabs | proxy `pr.oxylabs.io:7777` | residential proxy; port 7777 may be blocked on some networks (use hotspot / Web Scraper API over 443) |

## Gotchas from live key verification (save yourself the debug)
- **ai& is behind Cloudflare** — a bot `User-Agent` gets **403 / error 1010**. Always send a browser UA (e.g. `Mozilla/5.0 (compatible; ...)`) on ai& calls.
- **`kimi-k2.7-code` is a heavy reasoner** — it spends the whole `max_tokens` budget *thinking* and returns `content: null` on short budgets. For quick calls default to `deepseek-ai/deepseek-v4-flash`; give Kimi a big `max_tokens` for hard tasks.
- **Kimi via ai&** works with no separate key (`AIAND_MODEL=moonshotai/kimi-k2.7-code`); a **direct** Moonshot key is only needed if judging wants "Kimi AI" called by name.
- **Nosana** auth = `nos_` dashboard key (Bearer); inference is per-deployment (create a GPU job → it returns its own URL).
- **Multi-key fallback**: add `*_API_KEY_2` in `.env`; helpers rotate on 402/429.

## Collaboration workflow
- **Source of truth = this repo.** Both push to `main` directly, commit small and often, `git pull` before you start editing.
- Split work by plane to avoid stepping on each other (e.g. one owns ingest+reason, the other owns execute+compute).
- **VS Code Live Share** for tight pairing / debugging the same file together — the host runs it with the host's keys, so the guest doesn't need their own env to join a session.
- Keep the repo runnable end-to-end at all times; it's the judging artifact.

## Layout
```
src/
  smoke.mjs        # pings every sponsor with your .env keys (Node)
  sponsors.mjs     # thin clients for each sponsor (Node)
aggregator/        # Python reference impl of the same sponsor clients
  smoke.py         #   python3 -m aggregator.smoke  (uses the same .env)
```
> `src/` (Node) is the build target. `aggregator/` (Python) is the setup-phase
> reference that verified every endpoint live (it still uses the original
> `AI_AND_*` / `NOSANA_PRIVATE_KEY` naming). Pick Node for the real build; align
> or delete `aggregator/` once decided.
