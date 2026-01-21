"""Core Mintlens client — manages buffering and HTTP transport."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional
from urllib.request import Request, urlopen
from urllib.error import URLError
import json
import logging

logger = logging.getLogger("mintlens")

SDK_VERSION = "0.1.0"
DEFAULT_API_URL = "https://api.mintlens.io"
DEFAULT_BATCH_SIZE = 50
DEFAULT_FLUSH_INTERVAL_S = 1.0
DEFAULT_TIMEOUT_S = 5.0
MAX_RETRIES = 3


@dataclass
class MintlensClientOptions:
    """Configuration options for MintlensClient."""

    api_key: str
    """Your Mintlens project API key (starts with sk_live_ or sk_test_)."""

    api_url: str = DEFAULT_API_URL
    """Mintlens API base URL."""

    max_batch_size: int = DEFAULT_BATCH_SIZE
    """Maximum events to hold before flushing."""

    flush_interval_s: float = DEFAULT_FLUSH_INTERVAL_S
    """Maximum seconds between flushes."""

    timeout_s: float = DEFAULT_TIMEOUT_S
    """HTTP request timeout in seconds."""

    debug: bool = False
    """Enable debug logging."""

    on_error: Optional[Callable[[Exception], None]] = None
    """Called when an event fails to send (after retries)."""

    default_tenant_id: Optional[str] = None
    default_user_id: Optional[str] = None
    default_feature_key: Optional[str] = None
    default_environment: Optional[str] = None
    default_tags: list[str] = field(default_factory=list)


class MintlensClient:
    """
    Mintlens SDK client.

    Thread-safe. Uses a background daemon thread for flushing.
    Call shutdown() before process exit to flush remaining events.
    """

    def __init__(self, api_key: str, **kwargs: Any) -> None:
        self._opts = MintlensClientOptions(api_key=api_key, **kwargs)
        self._buffer: list[dict[str, Any]] = []
        self._lock = threading.Lock()
        self._shutdown_event = threading.Event()
        self._flush_thread = threading.Thread(
            target=self._flush_loop,
            daemon=True,
            name="mintlens-flush",
        )
        self._flush_thread.start()
        self._log("debug", "Mintlens client initialized", api_url=self._opts.api_url)

    def track(self, event: dict[str, Any]) -> None:
        """
        Track an LLM usage event. Fire-and-forget — never blocks.

        Args:
            event: LLM usage event dict. Required keys: provider, model,
                   tokens_input, tokens_output. Optional: tenant_id, user_id,
                   feature_key, latency_ms, tags.
        """
        enriched = {
            **({"tenant_id": self._opts.default_tenant_id} if self._opts.default_tenant_id else {}),
            **({"user_id": self._opts.default_user_id} if self._opts.default_user_id else {}),
            **({"feature_key": self._opts.default_feature_key} if self._opts.default_feature_key else {}),
            **({"environment": self._opts.default_environment} if self._opts.default_environment else {}),
            **event,
            "sdk_version": SDK_VERSION,
        }

        with self._lock:
            self._buffer.append(enriched)
            should_flush = len(self._buffer) >= self._opts.max_batch_size

        if should_flush:
            self._flush()

        self._log("debug", "Event enqueued", provider=event.get("provider"), model=event.get("model"))

    def flush(self) -> None:
        """Flush all pending events synchronously."""
        self._flush()

    def shutdown(self) -> None:
        """Flush remaining events and stop the background thread."""
        self._shutdown_event.set()
        self._flush()
        self._flush_thread.join(timeout=10.0)
        self._log("debug", "Mintlens client shut down")

    def _flush(self) -> None:
        with self._lock:
            if not self._buffer:
                return
            batch = self._buffer[: self._opts.max_batch_size]
            self._buffer = self._buffer[self._opts.max_batch_size :]

        self._send_with_retry(batch)

    def _flush_loop(self) -> None:
        while not self._shutdown_event.is_set():
            self._shutdown_event.wait(timeout=self._opts.flush_interval_s)
            self._flush()

    def _send_with_retry(self, events: list[dict[str, Any]]) -> None:
        body = json.dumps({"events": events}).encode("utf-8")
        retry_delays = [0.2, 0.5, 1.0]

        for attempt in range(MAX_RETRIES + 1):
            if attempt > 0:
                time.sleep(retry_delays[min(attempt - 1, len(retry_delays) - 1)])

            try:
                req = Request(
                    url=f"{self._opts.api_url}/v1/events/llm-usage",
                    data=body,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self._opts.api_key}",
                        "User-Agent": f"mintlens-sdk-python/{SDK_VERSION}",
                    },
                    method="POST",
                )
                with urlopen(req, timeout=self._opts.timeout_s) as resp:
                    if resp.status in (200, 202):
                        return
                    if 400 <= resp.status < 500 and resp.status != 429:
                        # Non-retryable client error
                        raise RuntimeError(f"Mintlens API error {resp.status}")
            except URLError as exc:
                if attempt == MAX_RETRIES:
                    self._handle_error(exc)
            except Exception as exc:  # noqa: BLE001
                if attempt == MAX_RETRIES:
                    self._handle_error(exc)

    def _handle_error(self, exc: Exception) -> None:
        self._log("warning", f"Failed to send events: {exc}")
        if self._opts.on_error:
            try:
                self._opts.on_error(exc)
            except Exception:  # noqa: BLE001
                pass

    def _log(self, level: str, message: str, **kwargs: Any) -> None:
        if self._opts.debug or level != "debug":
            getattr(logger, level)(f"[mintlens] {message}", extra=kwargs)
