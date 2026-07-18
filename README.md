# Daytona HackSprint — Aggregator

One facade over the six sponsor platforms. Each maps to a layer of the stack:

| Layer | Provider | Adapter | Auth |
|-------|----------|---------|------|
| Brain + sovereign compute | **ai&** (serves Kimi, GLM, DeepSeek…) | `llm.aiand()` | Bearer key (rotates) |
| Orchestration / control | **Doubleword** | `llm.doubleword()` | Bearer key (rotates) |
| Perception / data | **Oxylabs** residential proxy | `OxylabsProxy` | user/pass, geo in username |
| Runtime / action | **Daytona** sandboxes | `DaytonaRuntime` | Bearer key |
| Decentralised GPU scale | **Nosana** | `NosanaCloud` | `nos_` key |

## Setup

```bash
pip install -r requirements.txt      # requests (+ daytona for the runtime path)
```

Keys live in `.env` (already populated). Multi-key fallback: set `KEY_2`, `KEY_3`…
and the LLM adapters rotate to the next on a dead key (402/429/401/403).

## Team collaboration

Code is shared; **API keys never are**. `.env` is git-ignored — each person keeps
their own. New teammate onboarding:

```bash
git clone <repo-url> && cd daytona
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # then paste YOUR OWN keys into .env
.venv/bin/python -m aggregator.smoke   # confirm your keys work
```

Rules of the road:
- Never `git add .env` — the `.gitignore` blocks it, but don't force it.
- Adding a new provider/setting? Add the **blank** key to `.env.example` and
  commit that, so everyone knows to fill it.
- Work on branches, merge via PR: `git checkout -b feat/researcher`.
- Keep personal scratch in `scratch/` or `*.local` files — both git-ignored.

## Verify the wiring

```bash
python -m aggregator.smoke        # cheap health check of every key + fallback slot
python -m aggregator.pipeline     # live self-check: brain answers + proxy exits
```

## Use it

```python
from aggregator import Aggregator
agg = Aggregator()

# brain (Kimi on ai&)
print(agg.brain.text("Summarise the agentic stack in one line."))

# scrape from a US residential IP, then reason over it
print(agg.research("https://news.ycombinator.com", "Top 3 stories?"))

# run AI-generated code in an isolated sandbox
print(agg.runtime.run("print(2 ** 10)"))

# decentralised GPU jobs
print(agg.scale.jobs())
```

Canonical flow: **Oxylabs scrape → ai& reason → Daytona execute → Nosana scale**,
with Doubleword available as an inference-control gateway.

## Notes
- ai& is behind Cloudflare — the adapter sends a browser `User-Agent` (bot UAs get 403 / error 1010).
- Pick the ai& model with `AI_AND_MODEL` (default `moonshotai/kimi-k2.7-code`); any id from `agg.brain.models()` works.
- Nosana inference is per-deployment: create a GPU job, it returns its own endpoint (store in `NOSANA_ENDPOINT`).
