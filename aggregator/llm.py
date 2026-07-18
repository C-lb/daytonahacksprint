"""OpenAI-compatible LLM adapter — serves BOTH ai& (brain/sovereign) and
Doubleword (orchestration gateway). Same wire protocol, different base_url/keys.

ai& sits behind Cloudflare, which 403s bot User-Agents (error 1010). So we send
a browser-ish UA by default — a real gotcha found during smoke testing.
"""
import requests

from . import config
from .core import KeyRotator, with_rotation

# Cloudflare on api.aiand.com blocks Python-urllib/httpx-default UAs -> send this.
DEFAULT_UA = "Mozilla/5.0 (compatible; DaytonaAggregator/1.0)"


class OpenAICompatLLM:
    def __init__(self, name, base_url, key_var, model=None, user_agent=DEFAULT_UA, timeout=120):
        if not base_url:
            raise ValueError(f"{name}: base_url not set in .env")
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.rot = KeyRotator(config.keys(key_var), name)
        self.model = model
        self.ua = user_agent
        self.timeout = timeout

    def _headers(self, key):
        return {"Authorization": f"Bearer {key}", "User-Agent": self.ua,
                "Content-Type": "application/json"}

    def chat(self, messages, model=None, **kw):
        """OpenAI /chat/completions. Extra kwargs (tools, temperature, stream...) pass through."""
        payload = {"model": model or self.model, "messages": messages, **kw}
        resp = with_rotation(
            self.rot,
            lambda k: requests.post(f"{self.base_url}/chat/completions", json=payload,
                                    headers=self._headers(k), timeout=self.timeout),
        )
        resp.raise_for_status()
        return resp.json()

    def text(self, prompt, **kw):
        """One-shot prompt -> assistant text."""
        ch = self.chat([{"role": "user", "content": prompt}], **kw)["choices"][0]
        content = ch["message"].get("content")
        if content is None:
            raise ValueError(
                f"{self.name}: empty content (finish_reason={ch.get('finish_reason')}). "
                "A reasoning model likely spent the token budget thinking before "
                "answering — raise max_tokens or use a lighter model "
                "(e.g. deepseek-ai/deepseek-v4-flash).")
        return content

    def models(self):
        resp = with_rotation(
            self.rot,
            lambda k: requests.get(f"{self.base_url}/models", headers=self._headers(k), timeout=self.timeout),
        )
        resp.raise_for_status()
        return resp.json()


def aiand():
    """Brain + sovereign compute. Default model from AI_AND_MODEL (Kimi lives here)."""
    return OpenAICompatLLM("ai&", config.get("AI_AND_BASE_URL"), "AI_AND_API_KEY",
                           model=config.get("AI_AND_MODEL"))


def doubleword():
    """Orchestration / inference-control gateway."""
    return OpenAICompatLLM("doubleword", config.get("DOUBLEWORD_BASE_URL"), "DOUBLEWORD_API_KEY")
