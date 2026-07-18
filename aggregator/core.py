"""Shared adapter machinery: key rotation on credit death.

A key "dies" when the provider answers with an auth/quota/ratelimit status.
`with_rotation` retries the SAME request against the next key until one works
or the list is exhausted (then it returns the last bad response so the caller
sees the real error).
"""

# 401 bad key · 402 payment required (credits dead) · 403 forbidden/quota · 429 rate limit
ROTATE_STATUS = {401, 402, 403, 429}


class NoKeysError(RuntimeError):
    """Provider has zero keys configured in .env."""


class KeyRotator:
    def __init__(self, keys, name="provider"):
        self.keys = list(keys)
        self.name = name
        self.i = 0
        if not self.keys:
            raise NoKeysError(f"{name}: no key set in .env")

    @property
    def current(self):
        return self.keys[self.i]

    def rotate(self):
        """Advance to next key. Returns False when none left."""
        self.i += 1
        return self.i < len(self.keys)


def with_rotation(rotator, attempt):
    """attempt(key) -> requests.Response. Rotate while status in ROTATE_STATUS."""
    last = None
    while True:
        last = attempt(rotator.current)
        if last.status_code not in ROTATE_STATUS:
            return last
        if not rotator.rotate():
            return last  # exhausted — surface the last failure
