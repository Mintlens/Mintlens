<div align="center">
  <img src="docs/assets/mintlens-banner.png" alt="Mintlens" width="100%" />

  <h1>Mintlens</h1>
  <p><strong>LLM cost tracking & governance for AI builders.</strong><br/>
  See exactly what you spend, per feature, per customer, per model — and stop it before it explodes.</p>

  <p>
    <a href="https://mintlens.io">mintlens.io</a> ·
    <a href="https://docs.mintlens.io">Documentation</a> ·
    <a href="https://docs.mintlens.io/quickstart">Quickstart</a> ·
    <a href="https://github.com/mintlens/mintlens/discussions">Community</a>
  </p>

  <p>
    <a href="https://github.com/mintlens/mintlens/actions/workflows/ci.yml">
      <img src="https://github.com/mintlens/mintlens/actions/workflows/ci.yml/badge.svg" alt="CI" />
    </a>
    <a href="https://www.npmjs.com/package/@mintlens/sdk">
      <img src="https://img.shields.io/npm/v/@mintlens/sdk?color=00B67A&label=%40mintlens%2Fsdk" alt="npm" />
    </a>
    <a href="https://pypi.org/project/mintlens/">
      <img src="https://img.shields.io/pypi/v/mintlens?color=00B67A" alt="PyPI" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License" />
    </a>
    <a href="https://github.com/mintlens/mintlens/stargazers">
      <img src="https://img.shields.io/github/stars/mintlens/mintlens?style=social" alt="Stars" />
    </a>
  </p>
</div>

---

## The Problem

Your OpenAI dashboard shows you one number: **total spend**. It tells you nothing about:

- Which feature is burning 80% of your budget
- Which customer is triggering retry loops at 3am
- When to cut off a runaway agent before the invoice arrives

> *"We had a retry loop in our agent workflow that kept hitting the API with the same large context. 40% cost increase in 3 days before anyone noticed."* — r/LangChain

Mintlens fixes this. Track every token, enforce budgets, and kill runaway costs — automatically.

---

## How It Works

```
Your App ──► wrapOpenAI(client, mintlens) ──► OpenAI API
                           │
                    [fire & forget]
                           │
                    Mintlens API ──► PostgreSQL
                           │
                       Dashboard ──► Costs per feature / tenant / model
                           │
                      Kill-switch ──► Block calls when budget exceeded
```

**Zero latency impact.** Events are buffered and sent asynchronously — your users never wait for telemetry.

---

## Quickstart

### TypeScript / Node.js

```bash
npm install @mintlens/sdk
```

```typescript
import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({
  apiKey: process.env.MINTLENS_API_KEY!,
})

// Wrap once — track everywhere
const openai = wrapOpenAI(new OpenAI(), mintlens)

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  // Tag this call with your business context
  mintlens: {
    featureKey: 'support_chat',
    tenantId: 'customer-acme-123',
  },
})
// That's it. Cost is tracked in the background.
```

### Python

```bash
pip install mintlens
```

```python
from openai import OpenAI
from mintlens import MintlensClient, wrap_openai

mintlens = MintlensClient(api_key=os.environ["MINTLENS_API_KEY"])
client = wrap_openai(OpenAI(), mintlens, feature_key="support_chat")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    mintlens={"tenant_id": "customer-acme-123"},
)
```

### Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { MintlensClient, wrapAnthropic } from '@mintlens/sdk'

const anthropic = wrapAnthropic(new Anthropic(), mintlens)

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
  mintlens: { featureKey: 'code_assistant', tenantId: 'customer-123' },
})
```

---

## Features

### Tracking
- **Multi-provider** — OpenAI, Anthropic, Google, Mistral, Cohere
- **Zero-latency SDK** — fire-and-forget batching, never blocks your app
- **Granular attribution** — per feature, per end-customer, per user, per model
- **Framework-agnostic** — works with LangChain, LlamaIndex, Vercel AI SDK

### Governance
- **Budget enforcement** — daily, monthly, or rolling 30-day windows
- **Kill-switch** — automatically block API calls when a budget is exceeded
- **Alerts** — email and Slack notifications at configurable thresholds (e.g. 80%, 100%)

### Analytics
- **Cost Explorer** — filterable dashboard: by date, feature, model, tenant
- **Tenant Overview** — see cost, estimated revenue, and gross margin per customer
- **Unit economics** — cost per session, cost per feature, gross margin in real time

### Privacy First
- **No prompt storage** — we never store your LLM inputs or outputs
- **Metadata only** — token counts, latency, model name
- **Multi-tenant isolation** — PostgreSQL Row-Level Security, data never crosses tenants

---

## Supported Providers

| Provider | TypeScript | Python |
|----------|-----------|--------|
| OpenAI   | ✅ | ✅ |
| Anthropic | ✅ | ✅ |
| Google Gemini | 🚧 Soon | 🚧 Soon |
| Mistral | 🚧 Soon | 🚧 Soon |
| Cohere | 🚧 Soon | 🚧 Soon |

---

## Self-Hosting

Mintlens is designed to run on a single VPS with Docker Compose:

```bash
# Clone the repo
git clone https://github.com/mintlens/mintlens.git
cd mintlens

# Configure environment
cp .env.example .env.local
# Fill in your values...

# Start all services
docker compose -f docker/docker-compose.prod.yml up -d
```

**Minimum requirements:** 2 vCPU, 4GB RAM (Hetzner CX21 at ~€4/month handles thousands of events/sec).

---

## Architecture

```
mintlens/
├── apps/
│   ├── api/           # Fastify + TypeScript — Hexagonal Architecture
│   └── web/           # Next.js 15 — Dashboard
├── packages/
│   ├── sdk-ts/        # @mintlens/sdk — TypeScript SDK (Apache 2.0)
│   ├── sdk-python/    # mintlens — Python SDK (Apache 2.0)
│   └── shared/        # Shared TypeScript types
└── docker/            # Docker Compose + Nginx configs
```

**Stack:**
- **Backend:** Node.js + Fastify, Drizzle ORM, PostgreSQL 16 (with RLS), Redis 7
- **Frontend:** Next.js 15, Tailwind CSS, shadcn/ui, Recharts
- **Infra:** Docker Compose, Nginx, GitHub Actions CI/CD

---

## Roadmap

- [x] TypeScript SDK (OpenAI + Anthropic)
- [x] Python SDK (OpenAI + Anthropic)
- [x] Cost Explorer dashboard
- [x] Budget enforcement + kill-switch
- [x] Email + Slack alerts
- [ ] Tenant Overview + gross margin
- [ ] Google Gemini / Mistral wrappers
- [ ] LangChain / LlamaIndex integration guides
- [ ] Stripe Billing export
- [ ] Model routing (auto-switch to cheaper model)

---

## Contributing

We welcome contributions to the open-source SDKs! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

Areas where help is most valuable:
- New provider wrappers (Mistral, Cohere, Google)
- Framework integrations (LangChain, LlamaIndex, n8n)
- Performance improvements to batch queue
- Bug reports and documentation fixes

---

## License

The SDKs (`packages/sdk-ts`, `packages/sdk-python`, `packages/shared`) are licensed under the **Apache 2.0** license.

The platform (apps/api, apps/web) is proprietary and available as a hosted service at [mintlens.io](https://mintlens.io).

---

<div align="center">
  <sub>Built with care for AI builders. — <a href="https://mintlens.io">mintlens.io</a></sub>
</div>
