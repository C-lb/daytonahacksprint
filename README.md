# daytonahacksprint

Team project for the **Daytona HackSprint Singapore 2026** (AI Builders x Daytona, NUS, 18 Jul 2026).

## The agentic loop we're building on
```
Oxylabs (ingest) → Kimi (reason) → Daytona (execute) → Nosana + ai& (compute)
```
Prize judging weighs **Sponsor Integration = coordination of Daytona + Kimi AI + Nosana**, plus Completeness (ship an MVP), Innovation, and Problem Solving. Demo is a **2-minute hard limit** and must show working code running inside the integrated stack.

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
