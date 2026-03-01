# Contributing to Mintlens

Thank you for your interest in contributing! Mintlens is an open-core project. The SDKs and core platform (`apps/api`, `apps/web`) are Apache 2.0 licensed and we welcome contributions. The `packages/enterprise` directory is proprietary and not open to external contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)
- [SDK Contributions](#sdk-contributions)

---

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (we recommend 22 LTS)
- **pnpm** ≥ 10 (`npm install -g pnpm`)
- **Docker** + **Docker Compose** (for local services)

### Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/mintlens.git
cd mintlens

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Start local services (PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml up -d

# 5. Run database migrations
pnpm db:migrate

# 6. Start all apps in dev mode
pnpm dev
```

The API will be available at `http://localhost:3001` and the dashboard at `http://localhost:3000`.

---

## Development Workflow

### Commands

```bash
pnpm dev          # Start all apps in watch mode
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
pnpm format       # Prettier format
pnpm format:check # Check formatting
pnpm db:studio    # Open Drizzle Studio (DB explorer)
```

### Branching

- `main` — production-ready, protected
- `develop` — integration branch
- Feature branches: `feat/your-feature-name`
- Fix branches: `fix/issue-description`

---

## Project Structure

```
mintlens/
├── apps/
│   ├── api/          # Fastify backend — hexagonal architecture
│   └── web/          # Next.js 15 dashboard
├── packages/
│   ├── sdk-ts/       # TypeScript SDK (npm: @mintlens/sdk)
│   ├── sdk-python/   # Python SDK (PyPI: mintlens)
│   └── shared/       # Shared TypeScript types
└── docker/           # Docker + Nginx configs
```

The API follows **hexagonal architecture** (ports & adapters):
- `domain/` — pure business logic, no framework dependencies
- `application/` — use cases, orchestrates domain objects
- `infrastructure/` — database, Redis, external services
- `presentation/` — Fastify routes, validation, HTTP concerns

---

## Submitting Changes

1. **Open an issue first** for non-trivial changes to discuss the approach
2. Create a branch from `develop`
3. Write tests for your changes
4. Ensure `pnpm test` and `pnpm typecheck` pass
5. Open a PR against `develop` with a clear description

### PR Checklist

- [ ] Tests added/updated
- [ ] TypeScript types are correct
- [ ] No prompt/response content is stored (privacy rule)
- [ ] `pnpm lint` passes
- [ ] Changeset added if SDK-public API changed (`pnpm changeset`)

---

## SDK Contributions

The SDKs (`packages/sdk-ts` and `packages/sdk-python`) are the most impactful area for contributions:

- **New provider wrappers** — Mistral, Cohere, Google, etc.
- **Framework integrations** — LangChain, LlamaIndex, Vercel AI SDK
- **Performance improvements** to the batch queue
- **Documentation** and example code

When adding a new provider wrapper, follow the pattern of [openai.wrapper.ts](packages/sdk-ts/src/wrappers/openai.wrapper.ts):
1. Extract token counts from the provider response
2. Call `mintlens.track()` with `provider`, `model`, `tokensInput`, `tokensOutput`
3. Never store or forward prompt/response content
4. Add tests in `src/__tests__/`

---

## Need Help?

- Open a [GitHub Discussion](https://github.com/mintlens/mintlens/discussions)
- Email: hello@mintlens.io
