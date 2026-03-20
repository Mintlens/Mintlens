# @mintlens/sdk

Track LLM costs across providers with zero latency impact. Wrap your existing OpenAI, Anthropic, Gemini, Mistral, Cohere, Groq, or DeepSeek client — costs are tracked automatically in the background.

## Install

```bash
npm install @mintlens/sdk
```

Provider SDKs are peer dependencies — install whichever you use:

```bash
npm install openai              # for OpenAI / Groq / DeepSeek
npm install @anthropic-ai/sdk   # for Anthropic
```

## Quick start

```typescript
import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({
  apiKey: process.env.MINTLENS_API_KEY!,
})

const openai = wrapOpenAI(new OpenAI(), mintlens)

// Use openai as normal — costs are tracked automatically
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})
```

## Add context

Attribute costs to features, tenants, or users:

```typescript
const openai = wrapOpenAI(new OpenAI(), mintlens, {
  featureKey: 'support_chat',
  tenantId: 'customer-123',
  environment: 'production',
})
```

## Supported providers

| Provider | Wrapper | Streaming |
|----------|---------|-----------|
| OpenAI | `wrapOpenAI` | Yes |
| Anthropic | `wrapAnthropic` | Yes |
| Gemini | `wrapGemini` | Non-streaming only |
| Mistral | `wrapMistral` | Non-streaming only |
| Cohere | `wrapCohere` | Non-streaming only |
| Groq | `wrapGroq` | Yes (via OpenAI compat) |
| DeepSeek | `wrapDeepSeek` | Yes (via OpenAI compat) |

## Configuration

```typescript
const mintlens = new MintlensClient({
  apiKey: 'sk_live_...',       // required
  apiUrl: 'https://...',       // custom API endpoint (self-hosting)
  enabled: true,               // set false to disable in tests
  maxBatchSize: 50,            // events per batch
  flushIntervalMs: 1000,       // flush interval
  debug: false,                // enable console.debug logs
  onError: (err) => {},        // custom error handler
  defaults: {                  // applied to all events
    environment: 'production',
    featureKey: 'my-feature',
  },
})
```

## Graceful shutdown

Flush pending events before your process exits:

```typescript
process.on('SIGTERM', async () => {
  await mintlens.shutdown()
  process.exit(0)
})
```

## Manual tracking

For providers without a wrapper, use `track()` directly:

```typescript
const start = Date.now()
const response = await someProvider.complete(params)

mintlens.track({
  provider: 'other',
  model: response.model,
  tokensInput: response.usage.input_tokens,
  tokensOutput: response.usage.output_tokens,
  latencyMs: Date.now() - start,
  featureKey: 'my-feature',
})
```

## License

Apache-2.0
