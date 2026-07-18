"""Oxylabs residential proxy — the perception/data layer.

You don't call an API; you route a normal HTTP request THROUGH the proxy and it
comes back from a residential exit IP. Geo + session are encoded into the proxy
username. Password is URL-encoded (it may contain +, / etc.).
"""
import requests
from urllib.parse import quote

from . import config


class OxylabsProxy:
    def __init__(self, username=None, password=None):
        self.host = config.get("OXYLABS_PROXY_HOST")
        self.port = config.get("OXYLABS_PROXY_PORT")
        self.user = username or config.get("OXYLABS_USERNAME")
        self.pw = password or config.get("OXYLABS_PASSWORD")
        self.default_country = config.get("OXYLABS_COUNTRY")
        if not self.user:
            raise ValueError("Oxylabs: OXYLABS_USERNAME not set in .env")

    def _proxy_url(self, country=None, session=None, sesstime=10):
        u = self.user
        cc = country if country is not None else self.default_country
        if cc:
            u += f"-cc-{cc}"
        if session:  # pin the same exit IP across requests
            u += f"-sessid-{session}-sesstime-{sesstime}"
        return f"http://{quote(u, safe='')}:{quote(self.pw or '', safe='')}@{self.host}:{self.port}"

    def proxies(self, **kw):
        p = self._proxy_url(**kw)
        return {"http": p, "https": p}

    def scrape(self, url, country=None, session=None, timeout=60, **kw):
        """Fetch a URL through a residential exit IP. Returns response text."""
        r = requests.get(url, proxies=self.proxies(country=country, session=session),
                         timeout=timeout, **kw)
        r.raise_for_status()
        return r.text

    def location(self, **kw):
        """Debug helper: show the current exit IP + geo."""
        return requests.get("https://ip.oxylabs.io/location",
                            proxies=self.proxies(**kw), timeout=30).json()


# ponytail: single cred pair. Fallback pairs (OXYLABS_USERNAME_2/_2) live in .env;
# rotate to them by constructing OxylabsProxy(username=..., password=...) on a
# proxy auth error. Auto-rotation added when a pair actually dies.
