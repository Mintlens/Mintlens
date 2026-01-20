"""
Mintlens Python SDK — LLM cost tracking & governance.

Track token usage across OpenAI, Anthropic, and other providers.
Enforce budgets, attribute costs to features and tenants, and feed
your billing system — with zero impact on latency.

Example::

    from mintlens import MintlensClient, wrap_openai
    from openai import OpenAI

    mintlens = MintlensClient(api_key="sk_live_...")
    client = wrap_openai(OpenAI(), mintlens)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
        mintlens={"feature_key": "support_chat", "tenant_id": "customer-123"},
    )

See https://docs.mintlens.io/sdk/python for full documentation.
"""

from .client import MintlensClient, MintlensClientOptions
from .wrappers.openai import wrap_openai
from .wrappers.anthropic import wrap_anthropic

__version__ = "0.1.0"
__all__ = [
    "MintlensClient",
    "MintlensClientOptions",
    "wrap_openai",
    "wrap_anthropic",
    "__version__",
]
