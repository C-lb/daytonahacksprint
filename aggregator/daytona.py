"""Daytona sandboxes — the runtime/action layer. Run AI-generated code in an
isolated, disposable full-machine sandbox.

Wraps the official `daytona` SDK, imported lazily so this module imports fine
before `pip install daytona`. The smoke test proves the REST key auths; a live
`run()` proves the SDK path.
"""
from . import config


class DaytonaRuntime:
    def __init__(self):
        self.api_key = (config.keys("DAYTONA_API_KEY") or [None])[0]
        self.api_url = config.get("DAYTONA_API_URL")
        self.target = config.get("DAYTONA_TARGET")
        self._client = None

    def client(self):
        if self._client is None:
            try:
                from daytona import Daytona, DaytonaConfig
            except ImportError as exc:  # pragma: no cover
                raise ImportError("Daytona SDK missing. `pip install daytona`") from exc
            self._client = Daytona(DaytonaConfig(
                api_key=self.api_key, api_url=self.api_url, target=self.target))
        return self._client

    def run(self, code, language="python"):
        """Spin up an ephemeral sandbox, run `code`, return stdout, tear down.

        ponytail: method names track the current daytona SDK (create /
        process.code_run / delete). If your installed version differs, this is
        the one place to align — verify with `python -c "import daytona"`.
        """
        c = self.client()
        sandbox = c.create()
        try:
            res = sandbox.process.code_run(code)
            return getattr(res, "result", res)
        finally:
            c.delete(sandbox)
