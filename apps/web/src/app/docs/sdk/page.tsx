import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SDK Reference — MintLens Docs' }

export default function SdkReferencePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h3:text-base prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>SDK Reference</h1>
      <p>The <code>@mintlens/sdk</code> package provides zero-latency LLM cost tracking for TypeScript applications.</p>

      <h2>Installation</h2>
      <pre><code>{`npm install @mintlens/sdk`}</code></pre>

      <h2>Configuration</h2>
      <pre><code>{`import { MintlensClient } from '@mintlens/sdk'

const mintlens = new MintlensClient({
  apiKey: 'sk_live_...',        // required
  apiUrl: 'https://...',        // custom endpoint (self-hosting)
  enabled: true,                // set false in tests
  maxBatchSize: 50,             // events per batch
  flushIntervalMs: 1000,        // flush interval
  debug: false,                 // console.debug logs
  onError: (err) => {},         // custom error handler
  defaults: {                   // applied to all events
    environment: 'production',
    featureKey: 'my-feature',
  },
})`}</code></pre>

      <h2>Supported Providers</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2 pr-4 font-medium text-slate-600">Provider</th>
              <th className="py-2 pr-4 font-medium text-slate-600">Wrapper</th>
              <th className="py-2 font-medium text-slate-600">Streaming</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              ['OpenAI', 'wrapOpenAI', '✅'],
              ['Anthropic', 'wrapAnthropic', '✅'],
              ['Gemini', 'wrapGemini', 'Non-streaming only'],
              ['Mistral', 'wrapMistral', 'Non-streaming only'],
              ['Cohere', 'wrapCohere', 'Non-streaming only'],
              ['Groq', 'wrapGroq', '✅ (via OpenAI compat)'],
              ['DeepSeek', 'wrapDeepSeek', '✅ (via OpenAI compat)'],
            ].map(([provider, wrapper, streaming]) => (
              <tr key={provider}>
                <td className="py-2 pr-4 text-slate-700">{provider}</td>
                <td className="py-2 pr-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-mint-600">{wrapper}</code></td>
                <td className="py-2 text-slate-500 text-xs">{streaming}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Wrapper Usage</h2>
      <h3>OpenAI</h3>
      <pre><code>{`import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
const openai = wrapOpenAI(new OpenAI(), mintlens)

// Works with streaming too
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
})`}</code></pre>

      <h3>Anthropic</h3>
      <pre><code>{`import Anthropic from '@anthropic-ai/sdk'
import { MintlensClient, wrapAnthropic } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })
const anthropic = wrapAnthropic(new Anthropic(), mintlens)`}</code></pre>

      <h2>Manual Tracking</h2>
      <p>For providers without a wrapper:</p>
      <pre><code>{`mintlens.track({
  provider: 'other',
  model: 'custom-model',
  tokensInput: 150,
  tokensOutput: 80,
  latencyMs: 1200,
  featureKey: 'my-feature',
  tenantId: 'customer-123',
})`}</code></pre>

      <h2>Shutdown</h2>
      <pre><code>{`// Flush pending events before process exit
await mintlens.shutdown()`}</code></pre>
    </article>
  )
}
