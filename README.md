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

## Collaboration workflow
- **Source of truth = this repo.** Both push to `main` directly, commit small and often, `git pull` before you start editing.
- Split work by plane to avoid stepping on each other (e.g. one owns ingest+reason, the other owns execute+compute).
- **VS Code Live Share** for tight pairing / debugging the same file together — the host runs it with the host's keys, so the guest doesn't need their own env to join a session.
- Keep the repo runnable end-to-end at all times; it's the judging artifact.

## Layout
```
src/
  smoke.mjs      # pings every sponsor with your .env keys
  sponsors.mjs   # thin clients for each sponsor
```
