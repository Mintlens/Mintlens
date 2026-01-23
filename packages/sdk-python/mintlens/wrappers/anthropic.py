"""Anthropic SDK wrapper for automatic usage tracking."""

from __future__ import annotations

import time
from typing import Any, Optional

from mintlens.client import MintlensClient


def wrap_anthropic(client: Any, mintlens: MintlensClient, **default_context: Any) -> Any:
    """
    Wrap an Anthropic client to automatically track usage with Mintlens.

    Args:
        client: An ``anthropic.Anthropic`` instance.
        mintlens: An initialized ``MintlensClient``.
        **default_context: Default tracking context applied to all calls.

    Example::

        from anthropic import Anthropic
        from mintlens import MintlensClient, wrap_anthropic

        mintlens = MintlensClient(api_key="sk_live_...")
        client = wrap_anthropic(Anthropic(), mintlens, feature_key="code_assistant")

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello"}],
            mintlens={"tenant_id": "customer-123"},
        )
    """
    try:
        import anthropic  # noqa: F401
    except ImportError as exc:
        raise ImportError(
            "anthropic package is required. Install with: pip install mintlens[anthropic]"
        ) from exc

    return _AnthropicProxy(client, mintlens, default_context)


class _AnthropicProxy:
    def __init__(self, client: Any, mintlens: MintlensClient, default_context: dict[str, Any]) -> None:
        self._client = client
        self._mintlens = mintlens
        self._default_context = default_context

    def __getattr__(self, name: str) -> Any:
        if name == "messages":
            return _MessagesProxy(self._client.messages, self._mintlens, self._default_context)
        return getattr(self._client, name)


class _MessagesProxy:
    def __init__(self, messages: Any, mintlens: MintlensClient, default_context: dict[str, Any]) -> None:
        self._messages = messages
        self._mintlens = mintlens
        self._default_context = default_context

    def create(self, *, mintlens: Optional[dict[str, Any]] = None, **kwargs: Any) -> Any:
        """Tracked version of messages.create."""
        call_context = {**self._default_context, **(mintlens or {})}
        start_ms = time.monotonic_ns() // 1_000_000

        response = self._messages.create(**kwargs)

        latency_ms = (time.monotonic_ns() // 1_000_000) - start_ms
        usage = getattr(response, "usage", None)
        if usage:
            self._mintlens.track({
                "provider": "anthropic",
                "model": kwargs.get("model", "unknown"),
                "tokens_input": getattr(usage, "input_tokens", 0) or 0,
                "tokens_output": getattr(usage, "output_tokens", 0) or 0,
                "latency_ms": latency_ms,
                **call_context,
            })

        return response

    def __getattr__(self, name: str) -> Any:
        return getattr(self._messages, name)
