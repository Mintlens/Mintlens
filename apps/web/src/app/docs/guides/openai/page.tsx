import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'OpenAI Integration — MintLens Docs' }

export default function OpenAIGuidePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>OpenAI Integration</h1>
      <p>Track costs for all OpenAI models including GPT-4o, GPT-4, and GPT-3.5. Streaming supported.</p>

      <h2>Install</h2>
      <pre><code>{`npm install @mintlens/sdk openai`}</code></pre>

      <h2>Setup</h2>
      <pre><code>{`import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
const openai = wrapOpenAI(new OpenAI(), mintlens)`}</code></pre>

      <h2>Chat completions</h2>
      <pre><code>{`const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
})
// Cost is tracked automatically — model, tokens, latency all captured`}</code></pre>

      <h2>Streaming</h2>
      <p>Streaming works transparently. Token counts are extracted from the final stream chunk.</p>
      <pre><code>{`const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}
// Cost tracked after stream completes`}</code></pre>

      <h2>Per-call context</h2>
      <p>Attribute costs to specific features or customers:</p>
      <pre><code>{`const openai = wrapOpenAI(new OpenAI(), mintlens, {
  featureKey: 'support_chat',
  tenantId: 'customer-123',
  environment: 'production',
})`}</code></pre>

      <h2>Model detection</h2>
      <p>The model name is auto-detected from the API response. Pricing is looked up from MintLens's provider pricing table, updated every 24 hours from public pricing data.</p>

      <p>Next: <Link href="/docs/guides/anthropic">Anthropic integration</Link> · <Link href="/docs/sdk">Full SDK reference</Link></p>
    </article>
  )
}
