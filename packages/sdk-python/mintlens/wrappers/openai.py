"""OpenAI SDK wrapper for automatic usage tracking."""

from __future__ import annotations

import time
from typing import Any, Optional

from mintlens.client import MintlensClient


def wrap_openai(client: Any, mintlens: MintlensClient, **default_context: Any) -> Any:
    """
    Wrap an OpenAI client to automatically track usage with Mintlens.

    Args:
        client: An ``openai.OpenAI`` or ``openai.AsyncOpenAI`` instance.
        mintlens: An initialized ``MintlensClient``.
        **default_context: Default tracking context (tenant_id, feature_key, etc.)
                          applied to all calls from this wrapper.

    Returns:
        A proxy of the original client with tracking enabled.

    Example::

        from openai import OpenAI
        from mintlens import MintlensClient, wrap_openai

        mintlens = MintlensClient(api_key="sk_live_...")
        client = wrap_openai(OpenAI(), mintlens, feature_key="support_chat")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello"}],
            # Per-call override:
            mintlens={"tenant_id": "customer-123"},
        )
    """
    try:
        import openai  # noqa: F401
    except ImportError as exc:
        raise ImportError(
            "openai package is required. Install with: pip install mintlens[openai]"
        ) from exc

    return _OpenAIProxy(client, mintlens, default_context)


class _OpenAIProxy:
    """Transparent proxy that intercepts chat.completions.create calls."""

    def __init__(self, client: Any, mintlens: MintlensClient, default_context: dict[str, Any]) -> None:
        self._client = client
        self._mintlens = mintlens
        self._default_context = default_context

    def __getattr__(self, name: str) -> Any:
        if name == "chat":
            return _ChatProxy(self._client.chat, self._mintlens, self._default_context)
        return getattr(self._client, name)


class _ChatProxy:
    def __init__(self, chat: Any, mintlens: MintlensClient, default_context: dict[str, Any]) -> None:
        self._chat = chat
        self._mintlens = mintlens
        self._default_context = default_context

    def __getattr__(self, name: str) -> Any:
        if name == "completions":
            return _CompletionsProxy(self._chat.completions, self._mintlens, self._default_context)
        return getattr(self._chat, name)


class _CompletionsProxy:
    def __init__(self, completions: Any, mintlens: MintlensClient, default_context: dict[str, Any]) -> None:
        self._completions = completions
        self._mintlens = mintlens
        self._default_context = default_context

    def create(self, *, mintlens: Optional[dict[str, Any]] = None, **kwargs: Any) -> Any:
        """Tracked version of chat.completions.create."""
        call_context = {**self._default_context, **(mintlens or {})}
        start_ms = time.monotonic_ns() // 1_000_000

        response = self._completions.create(**kwargs)

        latency_ms = (time.monotonic_ns() // 1_000_000) - start_ms
        usage = getattr(response, "usage", None)
        if usage:
            self._mintlens.track({
                "provider": "openai",
                "model": kwargs.get("model", "unknown"),
                "tokens_input": getattr(usage, "prompt_tokens", 0) or 0,
                "tokens_output": getattr(usage, "completion_tokens", 0) or 0,
                "latency_ms": latency_ms,
                **call_context,
            })

        return response

    def __getattr__(self, name: str) -> Any:
        return getattr(self._completions, name)
