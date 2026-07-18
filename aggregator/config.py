"""Env loading + multi-key discovery. No third-party deps.

Reads the repo `.env`, then lets real process env vars override (so the same
code works in prod without a file). `keys(base)` implements the fallback
convention: BASE, BASE_2, BASE_3, ... (blank slots skipped).
"""
import os
from pathlib import Path

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
_PREFIXES = ("AI_AND", "OXYLABS", "DAYTONA", "NOSANA", "DOUBLEWORD", "KIMI")


def load_env(path=_ENV_PATH):
    data = {}
    p = Path(path)
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            data[k.strip()] = v.strip()
    # real env wins (prod / CI), plus any prefixed vars set only in the environment
    for k, v in os.environ.items():
        if k in data or k.startswith(_PREFIXES):
            data[k] = v
    return data


ENV = load_env()


def get(key, default=None):
    v = ENV.get(key)
    return v if v not in (None, "") else default


def keys(base):
    """[BASE, BASE_2, BASE_3, ...] — only non-empty, in order."""
    out = []
    if ENV.get(base):
        out.append(ENV[base])
    i = 2
    while f"{base}_{i}" in ENV:
        if ENV[f"{base}_{i}"]:
            out.append(ENV[f"{base}_{i}"])
        i += 1
    return out
