"""Daytona HackSprint aggregator — one facade over six sponsor platforms.

    from aggregator import Aggregator
    agg = Aggregator()
    print(agg.research("https://example.com", "What is this page about?"))
"""
from .pipeline import Aggregator
from .llm import aiand, doubleword, OpenAICompatLLM
from .oxylabs import OxylabsProxy
from .daytona import DaytonaRuntime
from .nosana import NosanaCloud

__all__ = ["Aggregator", "aiand", "doubleword", "OpenAICompatLLM",
           "OxylabsProxy", "DaytonaRuntime", "NosanaCloud"]
