import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Anthropic Integration — MintLens Docs' }

export default function AnthropicGuidePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>Anthropic Integration</h1>
      <p>Track costs for Claude models including Claude 3.5 Sonnet, Opus, and Haiku. Streaming supported.</p>

      <h2>Install</h2>
      <pre><code>{`npm install @mintlens/sdk @anthropic-ai/sdk`}</code></pre>

      <h2>Setup</h2>
      <pre><code>{`import Anthropic from '@anthropic-ai/sdk'
import { MintlensClient, wrapAnthropic } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
const anthropic = wrapAnthropic(new Anthropic(), mintlens)`}</code></pre>

      <h2>Messages API</h2>
      <pre><code>{`const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello Claude' }],
})
// Cost tracked automatically`}</code></pre>

      <h2>Streaming</h2>
      <pre><code>{`const stream = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
})

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text)
  }
}
// Cost tracked after stream completes`}</code></pre>

      <h2>Per-call context</h2>
      <pre><code>{`const anthropic = wrapAnthropic(new Anthropic(), mintlens, {
  featureKey: 'document_summary',
  tenantId: 'customer-456',
})`}</code></pre>

      <p>Next: <Link href="/docs/guides/multi-tenant">Multi-tenant tracking</Link> · <Link href="/docs/sdk">Full SDK reference</Link></p>
    </article>
  )
}
