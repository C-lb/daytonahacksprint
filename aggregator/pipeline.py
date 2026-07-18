"""Aggregator facade — the whole sponsor stack behind one object.

Adapters are lazy (built on first access) so a missing key for one provider
never blocks the others. The canonical flow is the notebook's own recipe:
    Oxylabs scrape -> ai& reason -> Daytona execute -> Nosana scale.
"""
from functools import cached_property

from .llm import aiand, doubleword
from .oxylabs import OxylabsProxy
from .daytona import DaytonaRuntime
from .nosana import NosanaCloud


class Aggregator:
    @cached_property
    def brain(self):      # ai& — reasoning (Kimi et al.), sovereign compute
        return aiand()

    @cached_property
    def router(self):     # Doubleword — orchestration / inference control
        return doubleword()

    @cached_property
    def web(self):        # Oxylabs — perception / data
        return OxylabsProxy()

    @cached_property
    def runtime(self):    # Daytona — run code / take actions
        return DaytonaRuntime()

    @cached_property
    def scale(self):      # Nosana — decentralised GPU
        return NosanaCloud()

    # --- example composed flow -------------------------------------------
    def research(self, url, question, model=None):
        """Scrape a page (residential IP) then reason over it with the brain."""
        html = self.web.scrape(url)
        prompt = (f"Answer strictly from this page.\n\n<page url='{url}'>\n"
                  f"{html[:12000]}\n</page>\n\nQuestion: {question}")
        return self.brain.text(prompt, model=model)


def demo():
    """Cheap live self-check: brain answers + proxy exits somewhere. Costs a few
    tokens + one proxied request. Run: `python -m aggregator.pipeline`."""
    agg = Aggregator()
    ans = agg.brain.text("Reply with exactly: OK", max_tokens=64)
    assert "OK" in ans.upper(), f"brain returned unexpected: {ans!r}"
    loc = agg.web.location()
    assert loc.get("ip"), f"proxy returned no ip: {loc}"
    print(f"brain OK · exit ip {loc['ip']} ({loc.get('providers', {}).get('maxmind', {}).get('country')})")
    print("demo passed")


if __name__ == "__main__":
    demo()
