#!/usr/bin/env python3
"""Health-check every configured key (incl. fallback slots) with plain urllib.

    python -m aggregator.smoke
"""
import urllib.request
import urllib.error
import json
import ssl
from urllib.parse import quote

from . import config

TIMEOUT = 30
UA = "Mozilla/5.0 (compatible; DaytonaAggregator/1.0)"  # ai& Cloudflare needs a real UA
_ctx = ssl.create_default_context()


def _get(url, headers=None, opener=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    try:
        r = (opener.open(req, timeout=TIMEOUT) if opener
             else urllib.request.urlopen(req, timeout=TIMEOUT, context=_ctx))
        return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:200]
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def _bearer(url, key):
    return _get(url, headers={"Authorization": f"Bearer {key}"})


def _row(provider, slot, ok, code, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {provider:<10} {slot:<20} -> {code}  {detail}")
    return ok


def main():
    print("=== SMOKE TEST ===\n")
    results = []

    # ai& + Doubleword: OpenAI-compatible /models
    for prov, base_var, key_var in [("ai&", "AI_AND_BASE_URL", "AI_AND_API_KEY"),
                                     ("doubleword", "DOUBLEWORD_BASE_URL", "DOUBLEWORD_API_KEY")]:
        base = (config.get(base_var) or "").rstrip("/")
        ks = config.keys(key_var)
        if not ks:
            results.append(_row(prov, key_var, False, "n/a", "no key in .env"))
        for idx, k in enumerate(ks):
            code, body = _bearer(f"{base}/models", k)
            ok = code == 200
            n = ""
            if ok:
                try:
                    n = f"{len(json.loads(body).get('data', []))} models"
                except Exception:
                    pass
            results.append(_row(prov, key_var if idx == 0 else f"{key_var}_{idx+1}", ok, code,
                                n or (body[:70] if not ok else "")))

    # Daytona: authed GET /sandbox
    base = (config.get("DAYTONA_API_URL") or "").rstrip("/")
    for idx, k in enumerate(config.keys("DAYTONA_API_KEY")):
        code, body = _bearer(f"{base}/sandbox", k)
        if code == 404:
            code, body = _bearer(f"{base}/workspace", k)
        results.append(_row("daytona", "DAYTONA_API_KEY" if idx == 0 else f"DAYTONA_API_KEY_{idx+1}",
                            code == 200, code, "" if code == 200 else body[:70]))

    # Nosana: authed GET /jobs
    nbase = (config.get("NOSANA_BASE_URL") or "https://dashboard.k8s.prd.nos.ci/api").rstrip("/")
    for idx, k in enumerate(config.keys("NOSANA_PRIVATE_KEY")):
        code, body = _bearer(f"{nbase}/jobs", k)
        results.append(_row("nosana", "NOSANA_PRIVATE_KEY" if idx == 0 else f"NOSANA_PRIVATE_KEY_{idx+1}",
                            code == 200, code, body[:70]))

    # Oxylabs: proxied GET per USER/PASS pair
    host, port = config.get("OXYLABS_PROXY_HOST"), config.get("OXYLABS_PROXY_PORT")
    country = config.get("OXYLABS_COUNTRY") or ""
    pairs = []
    if config.get("OXYLABS_USERNAME"):
        pairs.append(("pair-1", config.get("OXYLABS_USERNAME"), config.get("OXYLABS_PASSWORD") or ""))
    i = 2
    while config.get(f"OXYLABS_USERNAME_{i}"):
        pairs.append((f"pair-{i}", config.get(f"OXYLABS_USERNAME_{i}"), config.get(f"OXYLABS_PASSWORD_{i}") or ""))
        i += 1
    for slot, user, pw in pairs:
        full = user + (f"-cc-{country}" if country else "")
        proxy = f"http://{quote(full, safe='')}:{quote(pw, safe='')}@{host}:{port}"
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http": proxy, "https": proxy}))
        code, body = _get("https://ip.oxylabs.io/location", opener=opener)
        geo = ""
        if code == 200:
            try:
                j = json.loads(body)
                geo = f"ip={j.get('ip')} cc={j.get('providers', {}).get('maxmind', {}).get('country')}"
            except Exception:
                pass
        results.append(_row("oxylabs", slot, code == 200, code, geo or (body[:70] if code != 200 else "")))

    passed = sum(results)
    print(f"\n=== {passed}/{len(results)} PASS ===")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
