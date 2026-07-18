"""Nosana — decentralised GPU scale. Management API (Bearer nos_ key) to
list/create GPU jobs; each deployment mints its own inference URL.

Base + auth confirmed live via smoke test (GET /jobs -> 200).
"""
import requests

from . import config

DEFAULT_BASE = "https://dashboard.k8s.prd.nos.ci/api"


class NosanaCloud:
    def __init__(self):
        self.key = (config.keys("NOSANA_PRIVATE_KEY") or [None])[0]
        self.base = (config.get("NOSANA_BASE_URL") or DEFAULT_BASE).rstrip("/")
        if not self.key:
            raise ValueError("Nosana: NOSANA_PRIVATE_KEY not set in .env")

    def _headers(self):
        return {"Authorization": f"Bearer {self.key}", "User-Agent": "DaytonaAggregator/1.0",
                "Content-Type": "application/json"}

    def jobs(self):
        r = requests.get(f"{self.base}/jobs", headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def credits(self):
        r = requests.get(f"{self.base}/credits", headers=self._headers(), timeout=30)
        r.raise_for_status()
        return r.json()

    def create_job(self, payload):
        """Deploy a GPU job paid from Nosana credits. Returns job incl. its
        inference endpoint once running.

        ponytail: payload shape (market, template, timeout...) is filled when you
        actually deploy — see dashboard.k8s.prd.nos.ci/api/swagger for the schema.
        """
        r = requests.post(f"{self.base}/jobs/create-with-credits", json=payload,
                          headers=self._headers(), timeout=60)
        r.raise_for_status()
        return r.json()
